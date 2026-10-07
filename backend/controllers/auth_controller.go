package controllers

import (
	"backend/database"
	"backend/middlewares"
	"backend/models"
	"backend/services"
	"backend/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

const refreshCookieName = "kawangizi_refresh"

// accessTTLSeconds mirrors services.accessTTL (15 minutes) for API responses.
const accessTTLSeconds = 15 * 60

// AuthController handles login, refresh, logout, and profile requests.
type AuthController struct {
	authSvc *services.AuthService
}

// NewAuthController wires the auth controller with its service (Constructor DI).
func NewAuthController(authSvc *services.AuthService) *AuthController {
	return &AuthController{authSvc: authSvc}
}

// Register godoc
// @Summary Create a new validator account
// @Accept json
// @Produce json
// @Param payload body models.RegisterRequest true "registration data"
// @Success 201 {object} models.User
// @Failure 400 {object} models.APIResponse
// @Failure 409 {object} models.APIResponse
// @Router /api/auth/register [post]
func (c *AuthController) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	user, err := c.authSvc.Register(r.Context(), req)
	if err != nil {
		switch err {
		case services.ErrEmailExists:
			utils.Error(w, http.StatusConflict, err.Error())
		case services.ErrValidation, services.ErrUnsupportedRole:
			utils.Error(w, http.StatusBadRequest, err.Error())
		default:
			utils.Error(w, http.StatusInternalServerError, "gagal membuat akun")
		}
		return
	}

	utils.Success(w, http.StatusCreated, "akun berhasil dibuat", user)
}

// Login godoc
// @Summary Authenticate user and issue tokens
// @Accept json
// @Produce json
// @Param payload body models.LoginRequest true "credentials"
// @Success 200 {object} models.AuthResponse
// @Failure 401 {object} models.APIResponse
// @Router /api/auth/login [post]
func (c *AuthController) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	user, access, rawRefresh, refreshExpires, err := c.authSvc.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		// Log failed authentication attempt for threat monitoring
		_ = database.RecordAuditLog(
			r.Context(),
			"anonymous",
			"auth.login.failed",
			req.Email,
			fmt.Sprintf("ip=%s ua=%s error=%v", middlewares.ClientIP(r), r.UserAgent(), err),
		)

		switch err {
		case services.ErrInvalidCredentials, services.ErrAccountDisabled:
			utils.Error(w, http.StatusUnauthorized, err.Error())
		case services.ErrRoleInactive:
			utils.Error(w, http.StatusForbidden, err.Error())
		default:
			utils.Error(w, http.StatusInternalServerError, "gagal memproses login")
		}
		return
	}

	// Log successful authentication event
	_ = database.RecordAuditLog(
		r.Context(),
		user.ID,
		"auth.login.success",
		user.Email,
		fmt.Sprintf("ip=%s ua=%s role=%s", middlewares.ClientIP(r), r.UserAgent(), user.Role),
	)

	c.setRefreshCookie(w, r, rawRefresh, refreshExpires)
	utils.Success(w, http.StatusOK, "login berhasil", models.AuthResponse{
		AccessToken: access,
		ExpiresIn:   int64(accessTTLSeconds),
		User:        user,
		Permissions: models.PermissionsFor(user.Role),
	})
}

// Refresh godoc
// @Summary Rotate refresh token and issue a new access token
// @Produce json
// @Success 200 {object} models.AuthResponse
// @Failure 401 {object} models.APIResponse
// @Router /api/auth/refresh [post]
func (c *AuthController) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(refreshCookieName)
	if err != nil {
		utils.Error(w, http.StatusUnauthorized, "sesi tidak valid, silakan login ulang")
		return
	}

	// authSvc.Refresh sudah mengembalikan user-nya. Jangan panggil Me() dengan
	// UserID dari context: route ini tidak membawa access token (hanya cookie),
	// sehingga context kosong dan refresh selalu gagal setelah token di-revoke.
	user, access, rawRefresh, refreshExpires, err := c.authSvc.Refresh(r.Context(), cookie.Value)
	if err != nil {
		c.clearRefreshCookie(w, r)
		utils.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	c.setRefreshCookie(w, r, rawRefresh, refreshExpires)
	utils.Success(w, http.StatusOK, "sesi diperbarui", models.AuthResponse{
		AccessToken: access,
		ExpiresIn:   int64(accessTTLSeconds),
		User:        user,
		Permissions: models.PermissionsFor(user.Role),
	})
}

// Logout godoc
// @Summary Revoke the current refresh token
// @Produce json
// @Success 200 {object} models.APIResponse
// @Router /api/auth/logout [post]
func (c *AuthController) Logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(refreshCookieName); err == nil {
		_ = c.authSvc.Logout(r.Context(), cookie.Value)
	}
	// Log user logout event
	if uid := middlewares.UserID(r.Context()); uid != "" {
		_ = database.RecordAuditLog(
			r.Context(),
			uid,
			"auth.logout",
			"",
			fmt.Sprintf("ip=%s", middlewares.ClientIP(r)),
		)
	}
	c.clearRefreshCookie(w, r)
	utils.Success(w, http.StatusOK, "berhasil keluar", nil)
}

// Me godoc
// @Summary Return the authenticated user profile and permissions
// @Produce json
// @Success 200 {object} models.AuthResponse
// @Failure 401 {object} models.APIResponse
// @Router /api/auth/me [get]
func (c *AuthController) Me(w http.ResponseWriter, r *http.Request) {
	userID := middlewares.UserID(r.Context())
	if userID == "" {
		utils.Error(w, http.StatusUnauthorized, "autentikasi diperlukan")
		return
	}

	user, err := c.authSvc.Me(r.Context(), userID)
	if err != nil {
		utils.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "ok", models.AuthResponse{
		User:        user,
		Permissions: models.PermissionsFor(user.Role),
	})
}

func (c *AuthController) setRefreshCookie(w http.ResponseWriter, r *http.Request, value string, expires time.Time) {
	isSecure := r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" || os.Getenv("APP_ENV") == "production"
	http.SetCookie(w, &http.Cookie{
		Name:     refreshCookieName,
		Value:    value,
		Path:     "/api/auth",
		Expires:  expires,
		HttpOnly: true,
		Secure:   isSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (c *AuthController) clearRefreshCookie(w http.ResponseWriter, r *http.Request) {
	isSecure := r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" || os.Getenv("APP_ENV") == "production"
	http.SetCookie(w, &http.Cookie{
		Name:     refreshCookieName,
		Value:    "",
		Path:     "/api/auth",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   isSecure,
		SameSite: http.SameSiteLaxMode,
	})
}
