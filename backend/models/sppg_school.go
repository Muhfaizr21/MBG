package models

import (
	"time"
)

// SpecialDietary merujuk pada porsi alergen atau diet medis khusus siswa.
type SpecialDietary struct {
	Type  string `json:"type"`  // e.g. "Alergi kacang", "Diet rendah gula"
	Count int    `json:"count"` // e.g. 6
	Note  string `json:"note"`  // e.g. "Lauk diganti ayam tanpa bumbu kacang"
}

// AttendanceStatusInfo status kepatuhan presensi terhadap deadline 05:00 WIB.
type AttendanceStatusInfo struct {
	Label  string `json:"label"`  // e.g. "Update 04:42", "Telat 05:12", "Belum update"
	Tone   string `json:"tone"`   // e.g. "bg-emerald-50 text-emerald-800"
	OnTime bool   `json:"onTime"` // true jika <= 05:00
}

// SppgSchoolQuota entitas lengkap sekolah binaan dan alokasi kuota harian SPPG.
type SppgSchoolQuota struct {
	ID               string               `json:"id"`
	SppgID           string               `json:"sppgId"`
	SchoolID         string               `json:"schoolId"`
	Npsn             string               `json:"npsn"`
	Name             string               `json:"name"`
	Address          string               `json:"address"`
	Level            string               `json:"level"`
	Lat              float64              `json:"lat"`
	Lng              float64              `json:"lng"`
	Enrolled         int                  `json:"enrolled"`
	Present          int                  `json:"present"`
	ReduceSpecial    int                  `json:"reduceSpecial"`
	AbsenceNote      string               `json:"absenceNote"`
	PresentUpdatedAt string               `json:"presentUpdatedAt"`
	PackingQuota     int                  `json:"packingQuota"`
	Status           AttendanceStatusInfo `json:"status"`
	Specials         []SpecialDietary     `json:"specials"`
	Principal        string               `json:"principal"`
	Validator        string               `json:"validator"`
	ValidatorPhone   string               `json:"validatorPhone"`
	Droppoint        string               `json:"droppoint"`
	Fleet            string               `json:"fleet"`
	Date             string               `json:"date"`
	CreatedAt        time.Time            `json:"createdAt"`
	UpdatedAt        time.Time            `json:"updatedAt"`
}

// SppgSchoolTotals agregasi total kuota dan kehadiran per dapur.
type SppgSchoolTotals struct {
	Quota    int `json:"quota"`
	Present  int `json:"present"`
	Updated  int `json:"updated"`
	Total    int `json:"total"`
	Specials int `json:"specials"`
}

// SppgSchoolBundle paket lengkap sekolah binaan untuk portal SPPG & audit Superadmin.
type SppgSchoolBundle struct {
	SppgID      string             `json:"sppgId"`
	KitchenName string             `json:"kitchenName"`
	KitchenCode string             `json:"kitchenCode"`
	Depot       DepotInfo          `json:"depot"`
	Deadline    string             `json:"deadline"` // "05:00"
	Totals      SppgSchoolTotals   `json:"totals"`
	Schools     []SppgSchoolQuota  `json:"schools"`
}

// UpdateAttendancePayload mutasi presensi harian dari sekolah binaan.
type UpdateAttendancePayload struct {
	Present          int              `json:"present"`
	ReduceSpecial    int              `json:"reduceSpecial"`
	AbsenceNote      string           `json:"absenceNote"`
	PresentUpdatedAt string           `json:"presentUpdatedAt,omitempty"`
	Specials         []SpecialDietary `json:"specials,omitempty"`
}

// UpdateDroppointPayload pemutakhiran titik drop-point dan kontak validator.
type UpdateDroppointPayload struct {
	Droppoint      string `json:"droppoint"`
	Validator      string `json:"validator"`
	ValidatorPhone string `json:"validatorPhone"`
	Principal      string `json:"principal,omitempty"`
}

// RemindAttendancePayload penagihan presensi pagi ke guru validator.
type RemindAttendancePayload struct {
	CustomMessage string `json:"customMessage,omitempty"`
}
