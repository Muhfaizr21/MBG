package database

import (
	"context"
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

// demoValidatorUser adalah akun validator tambahan yang dipakai untuk
// mendemonstrasikan roster /admin/validators: guru piket cadangan pada sekolah
// yang sama, validator dengan riwayat pindai terlalu cepat (anomali Pasal 14),
// dan validator yang akunnya sedang dibekukan.
var demoValidatorUsers = []struct {
	ID, FullName, Email, Password, NPSN, SchoolName                 string
	ProfileID, SatgasID, NIP, Role, Device, DeviceID, Certification string
}{
	{
		ID: "usr-validator-002", FullName: "Dewi Puspitasari, S.Pd.", Email: "validator2@sdn01menteng.sch.id",
		Password: "Validator123!", NPSN: "33.210.130", SchoolName: "SDN Menteng 01 Pagi",
		ProfileID: "VAL-002", SatgasID: "BGN-VLD-0056", NIP: "19890914 201402 2 004",
		Role: "Guru Kelas IV & Guru Piket MBG", Device: "iPhone 14", DeviceID: "dev-ios-002",
		Certification: "Sertifikasi Higienitas Dasar (BNSP)",
	},
	{
		ID: "usr-validator-003", FullName: "Ahmad Fauzi, M.Pd.", Email: "validator@sdn01gondangdia.sch.id",
		Password: "Validator123!", NPSN: "20101456", SchoolName: "SDN Gondangdia 01",
		ProfileID: "VAL-003", SatgasID: "BGN-VLD-0089", NIP: "19790518 200501 1 007",
		Role: "Wali Kelas VI & Tim Penerimaan MBG", Device: "Pixel 8", DeviceID: "dev-android-001",
		Certification: "Sertifikasi Higienitas Dasar (BNSP)",
	},
	{
		ID: "usr-validator-004", FullName: "Rina Wulandari, S.Gz.", Email: "validator@smpn1surabaya.sch.id",
		Password: "Validator123!", NPSN: "20532109", SchoolName: "SMPN 1 Surabaya Pusat",
		ProfileID: "VAL-004", SatgasID: "BGN-VLD-0112", NIP: "19920824 201903 2 008",
		Role: "Kepala Sekolah & Penanggung Jawab Mutu", Device: "iPhone 15", DeviceID: "dev-ios-004",
		Certification: "Sertifikasi Higienitas Lanjutan (Auditor HACCP)",
	},
}

// SeedValidatorDemo mengisi akun + profil validator demo (idempoten) dan,
// hanya bila belum ada pindai sama sekali, riwayat pindai hari ini.
//
// Syarat "belum ada pindai" menjaga agar data demo tidak pernah bercampur dengan
// pemindaian lapangan yang sungguhan.
func SeedValidatorDemo(ctx context.Context) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("memulai transaksi seed validator: %w", err)
	}
	defer tx.Rollback(ctx)

	for _, u := range demoValidatorUsers {
		hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("hash password %s: %w", u.Email, err)
		}

		// VAL-004 sengaja berstatus nonaktif: akunnya dibekukan, jadi Users.status
		// ikut 'pending' dan login validator tersebut akan ditolak.
		profileStatus := "active"
		userStatus := "active"
		if u.ProfileID == "VAL-004" {
			profileStatus, userStatus = "inactive", "pending"
		}

		if _, err := tx.Exec(ctx, `
			INSERT INTO users (id, full_name, email, password_hash, role, npsn, school_name, sppg_id, status)
			VALUES ($1, $2, $3, $4, 'validator', $5, $6, 'SPPG-01', $7)
			ON CONFLICT (id) DO NOTHING`,
			u.ID, u.FullName, u.Email, string(hash), u.NPSN, u.SchoolName, userStatus,
		); err != nil {
			return fmt.Errorf("seed user %s: %w", u.Email, err)
		}

		if _, err := tx.Exec(ctx, `
			INSERT INTO validator_profiles
				(id, user_id, satgas_id, name, nip, npsn, role, device, device_id, certification, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			ON CONFLICT (id) DO NOTHING`,
			u.ProfileID, u.ID, u.SatgasID, u.FullName, u.NIP, u.NPSN,
			u.Role, u.Device, u.DeviceID, u.Certification, profileStatus,
		); err != nil {
			return fmt.Errorf("seed validator profile %s: %w", u.ProfileID, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit seed validator: %w", err)
	}

	inserted, err := seedDemoScans(ctx)
	if err != nil {
		return err
	}
	if inserted > 0 {
		log.Printf("✅ Seed %d riwayat pindai demo untuk audit validator\n", inserted)
	}
	return nil
}

// demoScan adalah riwayat pindai demo untuk dua akun: satu unfold validator
// dengan durasi inspeksi wajar, satu dengan pindai "kilat" di bawah ambang
// Pasal 14 supaya aturan anomali benar-benar terhitung dari data.
var demoScan = []struct {
	ID, ActorID, BoxID, BatchID, Verdict, Reason string
	TempC                                        float64
	DurationMS                                   int
}{
	{"SCN-DEMO-1001", "usr-validator-001", "BX-041", "BATCH-DEMO-01", "layak", "Inspeksi fisik sesuai SOP", 61.2, 820},
	{"SCN-DEMO-1002", "usr-validator-001", "BX-040", "BATCH-DEMO-01", "layak", "Inspeksi fisik sesuai SOP", 60.8, 780},
	{"SCN-DEMO-1003", "usr-validator-001", "BX-039", "BATCH-DEMO-01", "layak", "Inspeksi fisik sesuai SOP", 62.4, 910},
	{"SCN-DEMO-1004", "usr-validator-001", "BX-038", "BATCH-DEMO-01", "peringatan", "Suhu holding 59.4°C di bawah ambang 60°C", 59.4, 860},
	{"SCN-DEMO-1005", "usr-validator-001", "BX-037", "BATCH-DEMO-01", "layak", "Inspeksi fisik sesuai SOP", 61.9, 795},
	{"SCN-DEMO-2001", "usr-validator-003", "BX-045", "BATCH-DEMO-02", "layak", "Pindai sangat cepat, indikasi kurang teliti", 42.1, 140},
	{"SCN-DEMO-2002", "usr-validator-003", "BX-044", "BATCH-DEMO-02", "layak", "Pindai sangat cepat, indikasi kurang teliti", 42.0, 150},
	{"SCN-DEMO-2003", "usr-validator-003", "BX-043", "BATCH-DEMO-02", "layak", "Pindai sangat cepat, indikasi kurang teliti", 42.5, 165},
	{"SCN-DEMO-2004", "usr-validator-003", "BX-042", "BATCH-DEMO-02", "layak", "Inspeksi fisik sesuai SOP", 44.8, 520},
}

func seedDemoScans(ctx context.Context) (int64, error) {
	var count int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM scan_logs").Scan(&count); err != nil {
		return 0, fmt.Errorf("cek scan_logs: %w", err)
	}
	if count > 0 {
		return 0, nil
	}

	for _, s := range demoScan {
		if _, err := pool.Exec(ctx, `
			INSERT INTO scan_logs
				(id, box_id, qr_token, batch_id, ai_class, ai_confidence, visual_score,
				 holding_temp_c, release_temp_c, duration_ms, verdict, reason, actor_id, created_at)
			VALUES ($1, $2, '', $3, 'Fresh', 0.94, 96.0, $4, 78.0, $5, $6, $7, $8, NOW())
			ON CONFLICT (id) DO NOTHING`,
			s.ID, s.BoxID, s.BatchID, s.TempC, s.DurationMS, s.Verdict, s.Reason, s.ActorID,
		); err != nil {
			return 0, fmt.Errorf("seed scan demo %s: %w", s.ID, err)
		}
	}
	return int64(len(demoScan)), nil
}
