package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"errors"
	"strings"
)

// SppgIncidentService mendefinisikan kontrak logika bisnis untuk penanganan insiden, respons SLA, dan karantina batch.
type SppgIncidentService interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgIncidentBundle, error)
	ListTickets(ctx context.Context, sppgID string) ([]models.SppgIncidentTicket, error)
	GetTicket(ctx context.Context, id, sppgID string) (*models.SppgIncidentTicket, error)
	CreateTicket(ctx context.Context, sppgID string, payload *models.CreateIncidentTicketPayload) (*models.SppgIncidentTicket, error)
	ReplyTicket(ctx context.Context, id, sppgID string, payload *models.ReplyTicketPayload, actorName string) (*models.SppgIncidentTicket, error)
	ReplacePortions(ctx context.Context, id, sppgID string, payload *models.ReplaceTicketPortionsPayload, actorName string) (*models.SppgIncidentTicket, int, error)
	RecallBatch(ctx context.Context, sppgID string, payload *models.RecallBatchPayload, actorName string) (*models.SppgIncidentRecall, []string, error)
	CloseTicket(ctx context.Context, id, sppgID string, payload *models.CloseTicketPayload, actorName string) (*models.SppgIncidentTicket, error)
}

type sppgIncidentService struct {
	repo repositories.SppgIncidentRepository
}

// NewSppgIncidentService membuat instance service insiden baru (Constructor DI).
func NewSppgIncidentService(repo repositories.SppgIncidentRepository) SppgIncidentService {
	return &sppgIncidentService{repo: repo}
}

func (s *sppgIncidentService) GetBundle(ctx context.Context, sppgID string) (*models.SppgIncidentBundle, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	return s.repo.GetBundle(ctx, sppgID)
}

func (s *sppgIncidentService) ListTickets(ctx context.Context, sppgID string) ([]models.SppgIncidentTicket, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	return s.repo.ListTickets(ctx, sppgID)
}

func (s *sppgIncidentService) GetTicket(ctx context.Context, id, sppgID string) (*models.SppgIncidentTicket, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, errors.New("ID tiket aduan tidak boleh kosong")
	}
	return s.repo.GetTicket(ctx, id, sppgID)
}

func (s *sppgIncidentService) CreateTicket(ctx context.Context, sppgID string, payload *models.CreateIncidentTicketPayload) (*models.SppgIncidentTicket, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	if payload == nil {
		return nil, errors.New("payload tiket aduan tidak boleh kosong")
	}
	if strings.TrimSpace(payload.SchoolName) == "" {
		return nil, errors.New("nama sekolah pelapor wajib diisi")
	}
	if strings.TrimSpace(payload.BatchToken) == "" {
		return nil, errors.New("batch token wajib diisi")
	}
	if payload.Level < 1 || payload.Level > 3 {
		payload.Level = 2 // default sedang
	}
	if strings.TrimSpace(payload.Category) == "" {
		payload.Category = "Keluhan Makanan"
	}
	if strings.TrimSpace(payload.Message) == "" {
		return nil, errors.New("deskripsi isi laporan keluhan wajib diisi")
	}

	return s.repo.CreateTicket(ctx, sppgID, payload)
}

func (s *sppgIncidentService) ReplyTicket(ctx context.Context, id, sppgID string, payload *models.ReplyTicketPayload, actorName string) (*models.SppgIncidentTicket, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, errors.New("ID tiket aduan tidak boleh kosong")
	}
	if payload == nil || strings.TrimSpace(payload.Text) == "" {
		return nil, errors.New("tanggapan dan hasil pengecekan sampel wajib diisi")
	}
	if strings.TrimSpace(actorName) == "" {
		actorName = "Petugas SPPG"
	}

	return s.repo.ReplyTicket(ctx, id, sppgID, actorName, payload.Text)
}

func (s *sppgIncidentService) ReplacePortions(ctx context.Context, id, sppgID string, payload *models.ReplaceTicketPortionsPayload, actorName string) (*models.SppgIncidentTicket, int, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, 0, errors.New("ID tiket aduan tidak boleh kosong")
	}
	if payload == nil || payload.Boxes <= 0 {
		return nil, 0, errors.New("jumlah boks pengganti harus lebih besar dari 0")
	}
	if strings.TrimSpace(actorName) == "" {
		actorName = "Petugas SPPG"
	}

	return s.repo.ReplacePortions(ctx, id, sppgID, actorName, payload.Boxes)
}

func (s *sppgIncidentService) RecallBatch(ctx context.Context, sppgID string, payload *models.RecallBatchPayload, actorName string) (*models.SppgIncidentRecall, []string, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	if payload == nil || strings.TrimSpace(payload.BatchToken) == "" {
		return nil, nil, errors.New("nomor batch token wajib diisi untuk karantina darurat")
	}
	reason := strings.TrimSpace(payload.Reason)
	if reason == "" {
		reason = "Indikasi bau masam / kerusakan kualitas porsi boks saat diterima sekolah."
	}
	if strings.TrimSpace(actorName) == "" {
		actorName = "Petugas SPPG & Satgas"
	}

	return s.repo.RecallBatch(ctx, sppgID, payload.BatchToken, reason, actorName)
}

func (s *sppgIncidentService) CloseTicket(ctx context.Context, id, sppgID string, payload *models.CloseTicketPayload, actorName string) (*models.SppgIncidentTicket, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, errors.New("ID tiket aduan tidak boleh kosong")
	}
	if payload == nil || strings.TrimSpace(payload.Resolution) == "" {
		return nil, errors.New("bukti dan catatan penyelesaian bersama Satgas wajib diisi")
	}
	if strings.TrimSpace(actorName) == "" {
		actorName = "Petugas SPPG & Satgas"
	}

	return s.repo.CloseTicket(ctx, id, sppgID, actorName, payload.Resolution)
}
