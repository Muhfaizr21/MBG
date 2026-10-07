package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type fakeUserRepo struct {
	user          *models.User
	storedRefresh map[string]string
}

func newFakeRepo(t *testing.T) *fakeUserRepo {
	t.Helper()
	hash, err := bcrypt.GenerateFromPassword([]byte("Secret123!"), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	return &fakeUserRepo{
		user: &models.User{
			ID:           "usr-test",
			FullName:     "Test User",
			Email:        "test@kawangizi.id",
			PasswordHash: string(hash),
			Role:         models.RoleSatgas,
			Status:       models.StatusActive,
		},
		storedRefresh: map[string]string{},
	}
}

func (f *fakeUserRepo) GetByEmail(_ context.Context, email string) (*models.User, error) {
	if email != f.user.Email {
		return nil, repositories.ErrNotFound
	}
	return f.user, nil
}

func (f *fakeUserRepo) GetByID(_ context.Context, id string) (*models.User, error) {
	if id != f.user.ID {
		return nil, repositories.ErrNotFound
	}
	return f.user, nil
}

func (f *fakeUserRepo) Create(_ context.Context, user *models.User) error {
	f.user = user
	return nil
}

func (f *fakeUserRepo) SaveRefreshToken(_ context.Context, userID, tokenHash string, _ time.Time) error {
	f.storedRefresh[tokenHash] = userID
	return nil
}

func (f *fakeUserRepo) FindRefreshToken(_ context.Context, tokenHash string) (string, time.Time, bool, error) {
	userID, ok := f.storedRefresh[tokenHash]
	if !ok {
		return "", time.Time{}, false, repositories.ErrNotFound
	}
	return userID, time.Now().Add(time.Hour), false, nil
}

func (f *fakeUserRepo) RevokeRefreshToken(_ context.Context, tokenHash string) error {
	delete(f.storedRefresh, tokenHash)
	return nil
}

func newTestService(repo *fakeUserRepo) *AuthService {
	return NewAuthService(repo, "test-secret", 15*time.Minute, 168*time.Hour)
}

func TestLoginSuccess(t *testing.T) {
	repo := newFakeRepo(t)
	svc := newTestService(repo)

	user, access, rawRefresh, expires, err := svc.Login(context.Background(), "test@kawangizi.id", "Secret123!")
	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}
	if access == "" || rawRefresh == "" {
		t.Fatal("Login() returned empty tokens")
	}
	if user.Role != models.RoleSatgas {
		t.Errorf("role = %q, want satgas", user.Role)
	}
	if !expires.After(time.Now()) {
		t.Error("refresh expiry must be in the future")
	}
	if len(models.PermissionsFor(user.Role)) == 0 {
		t.Error("expected non-empty permissions")
	}
}

func TestLoginWrongPassword(t *testing.T) {
	svc := newTestService(newFakeRepo(t))
	if _, _, _, _, err := svc.Login(context.Background(), "test@kawangizi.id", "wrong"); err != ErrInvalidCredentials {
		t.Errorf("Login() error = %v, want ErrInvalidCredentials", err)
	}
}

func TestLoginUnknownEmail(t *testing.T) {
	svc := newTestService(newFakeRepo(t))
	if _, _, _, _, err := svc.Login(context.Background(), "nobody@kawangizi.id", "Secret123!"); err != ErrInvalidCredentials {
		t.Errorf("Login() error = %v, want ErrInvalidCredentials", err)
	}
}

func TestLoginDisabledAccount(t *testing.T) {
	repo := newFakeRepo(t)
	repo.user.Status = models.StatusBlacklisted
	svc := newTestService(repo)

	if _, _, _, _, err := svc.Login(context.Background(), "test@kawangizi.id", "Secret123!"); err != ErrAccountDisabled {
		t.Errorf("Login() error = %v, want ErrAccountDisabled", err)
	}
}

func TestRegisterSuccess(t *testing.T) {
	svc := newTestService(newFakeRepo(t))

	user, err := svc.Register(context.Background(), models.RegisterRequest{
		FullName:   "Validator Baru",
		Email:      "new@kawangizi.id",
		Password:   "Rahasia123!",
		Role:       models.RoleValidator,
		NPSN:       "12345678",
		SchoolName: "SDN 01 Citra",
		SppgID:     "SPPG-001",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}
	if user.Role != models.RoleValidator {
		t.Errorf("role = %q, want validator", user.Role)
	}
	if user.Status != models.StatusActive {
		t.Errorf("status = %q, want active", user.Status)
	}
	if user.Email != "new@kawangizi.id" || user.SchoolName != "SDN 01 Citra" {
		t.Errorf("unexpected user: %+v", user)
	}
	if user.PasswordHash == "" {
		t.Error("password hash must be set")
	}
}

func TestRegisterDuplicateEmail(t *testing.T) {
	svc := newTestService(newFakeRepo(t))

	_, err := svc.Register(context.Background(), models.RegisterRequest{
		FullName:   "Duplicate",
		Email:      "test@kawangizi.id",
		Password:   "Rahasia123!",
		Role:       models.RoleValidator,
		NPSN:       "12345678",
		SchoolName: "SDN 01 Citra",
		SppgID:     "SPPG-001",
	})
	if err != ErrEmailExists {
		t.Errorf("Register() error = %v, want ErrEmailExists", err)
	}
}

func TestRegisterRejectsPrivilegedRole(t *testing.T) {
	svc := newTestService(newFakeRepo(t))

	_, err := svc.Register(context.Background(), models.RegisterRequest{
		FullName:   "Hacker",
		Email:      "hacker@kawangizi.id",
		Password:   "Rahasia123!",
		Role:       models.RoleSuperadmin,
		NPSN:       "12345678",
		SchoolName: "SDN 01 Citra",
		SppgID:     "SPPG-001",
	})
	if err != ErrUnsupportedRole {
		t.Errorf("Register() error = %v, want ErrUnsupportedRole", err)
	}
}

func TestRegisterInvalidPayload(t *testing.T) {
	svc := newTestService(newFakeRepo(t))

	cases := []models.RegisterRequest{
		{FullName: "", Email: "a@b.id", Password: "Rahasia123!", Role: models.RoleValidator, NPSN: "1", SchoolName: "S", SppgID: "S"},
		{FullName: "X", Email: "not-an-email", Password: "Rahasia123!", Role: models.RoleValidator, NPSN: "1", SchoolName: "S", SppgID: "S"},
		{FullName: "X", Email: "a@b.id", Password: "123", Role: models.RoleValidator, NPSN: "1", SchoolName: "S", SppgID: "S"},
		{FullName: "X", Email: "a@b.id", Password: "Rahasia123!", Role: models.RoleValidator, NPSN: "", SchoolName: "", SppgID: ""},
		{FullName: "X", Email: "a@b.id", Password: "Rahasia123!", Role: models.RoleSppg, NPSN: "1", SchoolName: "S", SppgID: "S"},
	}
	for i, req := range cases {
		if _, err := svc.Register(context.Background(), req); err != ErrValidation && err != ErrUnsupportedRole {
			t.Errorf("case %d: Register() error = %v, want validation error", i, err)
		}
	}
}

func TestParseAccessTokenRoundTrip(t *testing.T) {
	svc := newTestService(newFakeRepo(t))

	_, access, _, _, err := svc.Login(context.Background(), "test@kawangizi.id", "Secret123!")
	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}

	userID, role, err := svc.ParseAccessToken(access)
	if err != nil {
		t.Fatalf("ParseAccessToken() error = %v", err)
	}
	if userID != "usr-test" || role != models.RoleSatgas {
		t.Errorf("got (%q, %q), want (usr-test, satgas)", userID, role)
	}

	if _, _, err := svc.ParseAccessToken("garbage-token"); err == nil {
		t.Error("ParseAccessToken(garbage) expected error")
	}
}

func TestRefreshRotatesToken(t *testing.T) {
	svc := newTestService(newFakeRepo(t))

	_, _, rawRefresh, _, err := svc.Login(context.Background(), "test@kawangizi.id", "Secret123!")
	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}

	_, _, newRaw, _, err := svc.Refresh(context.Background(), rawRefresh)
	if err != nil {
		t.Fatalf("Refresh() error = %v", err)
	}
	if newRaw == rawRefresh {
		t.Error("Refresh() should rotate the refresh token")
	}

	// old token must be revoked (rotation)
	if _, _, _, _, err := svc.Refresh(context.Background(), rawRefresh); err == nil {
		t.Error("reusing revoked refresh token should fail")
	}
}

func TestLogoutRevokesToken(t *testing.T) {
	svc := newTestService(newFakeRepo(t))

	_, _, rawRefresh, _, err := svc.Login(context.Background(), "test@kawangizi.id", "Secret123!")
	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}
	svc.Logout(context.Background(), rawRefresh)

	if _, _, _, _, err := svc.Refresh(context.Background(), rawRefresh); err == nil {
		t.Error("refresh after logout should fail")
	}
}

func TestPermissionMatrixIsolation(t *testing.T) {
	sensitive := []string{
		models.PermValidatorsManage, models.PermKillswitch,
		models.PermAiOverride, models.PermPaymentClearance, models.PermUsersCreate,
	}
	for _, role := range []string{models.RoleSatgas, models.RoleSppg, models.RoleValidator, models.RoleSiswa} {
		for _, perm := range sensitive {
			if models.HasPermission(role, perm) {
				t.Errorf("role %s must not have %s", role, perm)
			}
		}
	}
	for _, perm := range sensitive {
		if !models.HasPermission(models.RoleSuperadmin, perm) {
			t.Errorf("superadmin missing %s", perm)
		}
	}

	if !models.HasPermission(models.RoleValidator, models.PermScanSubmit) {
		t.Error("validator must have scan.submit")
	}
	if models.HasPermission(models.RoleSppg, models.PermScanSubmit) {
		t.Error("sppg must not have scan.submit")
	}
	if !models.HasPermission(models.RoleSppg, models.PermKitchenOps) {
		t.Error("sppg must have kitchen.ops")
	}
	if models.HasPermission("unknown", models.PermDashboardRead) {
		t.Error("unknown role must be deny-all")
	}
}
