package models

import "time"

// Status operasional validator lapangan.
//
// Status ini hidup di validator_profiles.status, sementara kelayakan masuk
// sistem hidup di users.status. Keduanya harus selalu berubah bersamaan —
// gunakan UserStatusFor untuk memetakan, dan jangan menulis users.status
// langsung dari handler.
const (
	ValidatorActive      = "active"
	ValidatorFlagged     = "flagged"
	ValidatorInactive    = "inactive"
	ValidatorBlacklisted = "blacklisted"
)

// Ambang durasi inspeksi visual (Juknis MBG Pasal 14).
// Pindai yang lebih cepat dari MinScanDurationMS dihitung sebagai anomali
// ketelitian pada audit superadmin.
const (
	MinScanDurationMS  = 200
	TargetInspectionMS = 500
	RecentScanLogLimit = 5
)

// validatorStatuses adalah daftar status yang boleh disetel lewat API.
var validatorStatuses = map[string]bool{
	ValidatorActive:      true,
	ValidatorFlagged:     true,
	ValidatorInactive:    true,
	ValidatorBlacklisted: true,
}

// ValidValidatorStatus reports whether the status identifier is known.
func ValidValidatorStatus(status string) bool {
	return validatorStatuses[status]
}

// UserStatusFor memetakan status validator ke status kelayakan akun (users).
// "flagged" tetap boleh login — akun hanya ditegur, bukan dibekukan.
func UserStatusFor(validatorStatus string) string {
	switch validatorStatus {
	case ValidatorActive, ValidatorFlagged:
		return StatusActive
	case ValidatorInactive:
		return StatusPending
	case ValidatorBlacklisted:
		return StatusBlacklisted
	default:
		return StatusPending
	}
}

// ValidatorProfile adalah roster validator lapangan untuk portal superadmin
// (/admin/validators).
//
// Semua field turunan (ScansToday, AvgDurationSec, Anomalies, LastScanAt,
// QuotaToday) dihitung ulang dari scan_logs & attendances saat dibaca —
// tidak disimpan, supaya tidak basi saat hari berganti.
type ValidatorProfile struct {
	ID         string `json:"id"`
	UserID     string `json:"userId,omitempty"`
	SatgasID   string `json:"satgasId"`
	Name       string `json:"name"`
	Email      string `json:"email,omitempty"`
	NIP        string `json:"nip"`
	NPSN       string `json:"npsn"`
	SchoolName string `json:"schoolName"`
	SchoolCity string `json:"schoolCity"`
	Role       string `json:"role"`

	Device        string `json:"device"`
	DeviceID      string `json:"deviceId"`
	DeviceBound   bool   `json:"deviceBound"`
	Certification string `json:"certification"`
	Status        string `json:"status"`

	BackupValidatorID   string     `json:"backupValidatorId,omitempty"`
	BackupValidatorName string     `json:"backupValidatorName,omitempty"`
	WarningCount        int        `json:"warningCount"`
	LastWarningAt       *time.Time `json:"lastWarningAt,omitempty"`
	LastWarningNote     string     `json:"lastWarningNote,omitempty"`

	ScansToday     int        `json:"scansToday"`
	QuotaToday     int        `json:"quotaToday"`
	AvgDurationSec float64    `json:"avgDurationSec"`
	Anomalies      int        `json:"anomalies"`
	LastScanAt     *time.Time `json:"lastScanAt,omitempty"`

	ScanLogs []ScanLog `json:"scanLogs"`
}

// SetValidatorStatusRequest mengubah status operasional validator.
type SetValidatorStatusRequest struct {
	Status string `json:"status"`
	Reason string `json:"reason"`
}

// ResetValidatorDeviceRequest memutus tautan kriptografis perangkat.
type ResetValidatorDeviceRequest struct {
	Reason string `json:"reason"`
}

// WarnValidatorRequest menerbitkan surat peringatan digital ke validator.
type WarnValidatorRequest struct {
	Note string `json:"note"`
}

// AssignBackupValidatorRequest menugaskan guru piket cadangan pada validator
// yang sedang bermasalah, agar verifikasi porsi school tidak terhenti.
type AssignBackupValidatorRequest struct {
	BackupValidatorID string `json:"backupValidatorId"`
	Reason            string `json:"reason"`
}
