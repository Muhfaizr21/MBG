package repositories

import (
	"backend/database"
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// Helper bersama untuk mutasi yang wajib meninggalkan jejak audit.
//
// Dipakai oleh slice yang mengubah status entitas milik pengguna (validator,
// dapur SPPG): baris utama ikut berubah, efek sampingnya ke tabel lain, dan
// audit_logs tercatat — semuanya dalam satu statement. Dengan begitu mustahil
// meninggalkan data setengah berubah.

// mutation menjelaskan satu perubahan beserta jejak audit-nya.
//
// Argumen SQL dirakit dari struct ini, bukan ditulis manual per pemanggil:
// penomoran placeholder ($1..$n) mudah salah geser dan kesalahan seperti itu
// lolos tanpa error Go — misalnya menulis kolom dengan nilai id yang salah.
type mutation struct {
	// statement adalah bodiesatu CTE UPDATE; placeholder $1-$5 milik audit,
	// sehingga argumen domain dimulai dari $6.
	statement string
	actorID   string
	action    string
	target    string
	detail    string
	args      []any
	// syncUserStatus menyalakan sinkronisasi tabel turunan via $8; hanya
	// dipakai mutateStatusTemplate.
	syncUserStatus bool
	userStatus     string
}

// auditTemplate membungkus statement UPDATE menjadi CTE yang juga mencatat
// audit_logs.
//
// INSERT audit memakai SELECT ... WHERE EXISTS (SELECT 1 FROM upd) supaya baris
// audit hanya tercatat bila perubahan benar-benar terjadi.
const auditTemplate = `
WITH upd AS (
	%[1]s
), audit AS (
	INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
	SELECT $5, $1, $2, $3, $4, NOW()
	WHERE EXISTS (SELECT 1 FROM upd)
	RETURNING id
)
SELECT id FROM upd`

// runAudited menjalankan satu mutasi ter-audit lalu memuat ulang entitasnya.
//
// reload memuat representasi domain masing-masing slice (validator atau SPPG),
// sehingga lapisan atas tidak perlu tahu bentuk tabel yang dipakai.
func runAudited(
	ctx context.Context,
	template string,
	m mutation,
	reload func(ctx context.Context, id string) (any, error),
) (any, error) {
	args := []any{m.actorID, m.action, m.target, strings.TrimSpace(m.detail), uuid.NewString()}
	args = append(args, m.args...)
	if m.syncUserStatus {
		args = append(args, m.userStatus)
	}

	var id string
	err := database.Pool().QueryRow(ctx, fmt.Sprintf(template, m.statement), args...).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("mutasi ter-audit: %w", err)
	}
	return reload(ctx, id)
}

// mutationTemplateWithSync dicerminkan juga ke tabel turunan (users), supaya
// kelayakan akun tidak bisa berbeda dengan profilnya.
const mutationTemplateWithSync = `
WITH upd AS (
	%[1]s
), usr AS (
	UPDATE users SET status = $8
	WHERE id = (SELECT user_id FROM upd) AND user_id IS NOT NULL
	RETURNING id
), audit AS (
	INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
	SELECT $5, $1, $2, $3, $4, NOW()
	WHERE EXISTS (SELECT 1 FROM upd)
	RETURNING id
)
SELECT id FROM upd`

// auditDetail menyusun kolom detail audit_logs yang enak dibaca.
func auditDetail(field, value, reason string) string {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return fmt.Sprintf("%s=%s", field, value)
	}
	return fmt.Sprintf("%s=%s; alasan=%s", field, value, reason)
}
