package middlewares

import (
	"backend/services"
	"backend/utils"
	"context"
	"net/http"
	"strings"
)

type contextKey string

// Context keys injected by the auth middleware.
const (
	CtxUserID contextKey = "userID"
	CtxRole   contextKey = "role"
	CtxSppgID contextKey = "sppgID"
	CtxNPSN   contextKey = "npsn"
)

const bearerPrefix = "bearer "

// Auth validates the Authorization: Bearer <jwt> header and injects
// userID, role, sppgID, and npsn into the request context. Requests without a valid token
// still pass through so route-level RequireAuth can decide.
func Auth(authSvc *services.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if strings.HasPrefix(strings.ToLower(header), bearerPrefix) {
				token := strings.TrimSpace(header[len(bearerPrefix):])
				if userID, role, sppgID, npsn, err := authSvc.ParseAccessToken(token); err == nil {
					ctx := context.WithValue(r.Context(), CtxUserID, userID)
					ctx = context.WithValue(ctx, CtxRole, role)
					ctx = context.WithValue(ctx, CtxSppgID, sppgID)
					ctx = context.WithValue(ctx, CtxNPSN, npsn)
					r = r.WithContext(ctx)
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireAuth rejects requests that lack a valid authenticated user.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if UserID(r.Context()) == "" {
			utils.Error(w, http.StatusUnauthorized, "autentikasi diperlukan")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RequirePermission rejects requests whose role lacks the permission.
func RequirePermission(perm string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := Role(r.Context())
			if role == "" {
				utils.Error(w, http.StatusUnauthorized, "autentikasi diperlukan")
				return
			}
			if !hasPermission(role, perm) {
				utils.Error(w, http.StatusForbidden, "akses ditolak: izin "+perm+" tidak dimiliki")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireRole rejects requests whose role is not in the allowed list.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := Role(r.Context())
			if role == "" {
				utils.Error(w, http.StatusUnauthorized, "autentikasi diperlukan")
				return
			}
			for _, allowed := range roles {
				if role == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}
			utils.Error(w, http.StatusForbidden, "akses ditolak: role "+role+" tidak diizinkan")
		})
	}
}

// UserID returns the authenticated user id from context ("" if anonymous).
func UserID(ctx context.Context) string {
	v, _ := ctx.Value(CtxUserID).(string)
	return v
}

// Role returns the authenticated role from context ("" if anonymous).
func Role(ctx context.Context) string {
	v, _ := ctx.Value(CtxRole).(string)
	return v
}

// SppgID returns the authenticated user's assigned SPPG ID ("" if none/anonymous).
func SppgID(ctx context.Context) string {
	v, _ := ctx.Value(CtxSppgID).(string)
	return v
}

// NPSN returns the authenticated user's school NPSN ("" if none/anonymous).
func NPSN(ctx context.Context) string {
	v, _ := ctx.Value(CtxNPSN).(string)
	return v
}
