package models

import "time"

// AbsentDetails merinci alasan ketidakhadiran siswa di sekolah.
type AbsentDetails struct {
	Sick        int `json:"sick"`
	Permission  int `json:"permission"`
	Unexplained int `json:"unexplained"`
}

// GoldenWindow memantau rentang waktu aman konsumsi porsi MBG (maksimum 4 jam dari masak).
type GoldenWindow struct {
	CookedAt             string `json:"cookedAt"`
	DeliveredAt          string `json:"deliveredAt"`
	LunchTime            string `json:"lunchTime"`
	SafeUntil            string `json:"safeUntil"`
	MinutesLeft          int    `json:"minutesLeft"`
	IsSafeToRedistribute bool   `json:"isSafeToRedistribute"`
}

// ConsumptionEvaluation mencatat evaluasi sisa makanan (plate waste) dan daya terima rasa gizi siswa.
type ConsumptionEvaluation struct {
	FinishRate      float64 `json:"finishRate"`
	RiceWastePct    float64 `json:"riceWastePct"`
	ProteinWastePct float64 `json:"proteinWastePct"`
	VeggieWastePct  float64 `json:"veggieWastePct"`
	FeedbackNotes   string  `json:"feedbackNotes"`
}

// RedistributionLog mencatat audit surat jalan resmi pengalihan porsi utuh ke lembaga sosial / panti.
type RedistributionLog struct {
	DispatchID         string `json:"dispatchId"`
	AuthorizedBy       string `json:"authorizedBy"`
	TargetFacility     string `json:"targetFacility"`
	PortionsAllocated  int    `json:"portionsAllocated"`
	CourierName        string `json:"courierName"`
	DispatchedAt       string `json:"dispatchedAt"`
	ArrivedAt          string `json:"arrivedAt,omitempty"`
	RecipientSignature string `json:"recipientSignature,omitempty"`
}

// Attendance merepresentasikan rekonsiliasi harian penerimaan siswa dan porsi MBG.
type Attendance struct {
	ID                    string                `json:"id"`
	SchoolNPSN            string                `json:"schoolNpsn"`
	SchoolName            string                `json:"schoolName"`
	Level                 string                `json:"level"`
	City                  string                `json:"city"`
	Province              string                `json:"province"`
	SPPGID                string                `json:"sppgId"`
	SPPGName              string                `json:"sppg"`
	SPPGCode              string                `json:"sppgCode"`
	Principal             string                `json:"principal"`
	HeadValidator         string                `json:"headValidator"`
	Date                  string                `json:"date"`
	RegisteredStudents    int                   `json:"registeredStudents"`
	PresentStudents       int                   `json:"presentStudents"`
	AbsentDetails         AbsentDetails         `json:"absentDetails"`
	DeliveredPortions     int                   `json:"deliveredPortions"`
	ConsumedPortions      int                   `json:"consumedPortions"`
	SurplusPortions       int                   `json:"surplusPortions"`
	SurplusStatus         string                `json:"surplusStatus"` // available_for_redistribution | redistributed | disposed | zero_surplus
	GoldenWindow          GoldenWindow          `json:"goldenWindow"`
	ConsumptionEvaluation ConsumptionEvaluation `json:"consumptionEvaluation"`
	AttendanceRate        float64               `json:"attendanceRate"`
	FinishRate            float64               `json:"finishRate"`
	ReconciliationStatus  string                `json:"reconciliationStatus"` // matched | surplus_safe | surplus_redistributed | discrepancy_flagged
	DiscrepancyCount      int                   `json:"discrepancyCount"`
	TargetTomorrowQuota   int                   `json:"targetTomorrowQuota"`
	RedistributionLog     *RedistributionLog    `json:"redistributionLog"`
	Notes                 string                `json:"notes"`
	CreatedAt             time.Time             `json:"createdAt"`
}

// AdjustQuotaRequest adalah payload superadmin untuk penyesuaian porsi H+1.
type AdjustQuotaRequest struct {
	NewQuota int    `json:"newQuota"`
	Reason   string `json:"reason"`
}

// RedistributeSurplusRequest adalah payload superadmin untuk otorisasi pengalihan sisa porsi aman.
type RedistributeSurplusRequest struct {
	TargetFacility    string `json:"targetFacility"`
	PortionsAllocated int    `json:"portionsAllocated"`
	CourierName       string `json:"courierName"`
	AuthorizedBy      string `json:"authorizedBy"`
}

// AuditDiscrepancyRequest adalah payload superadmin untuk menerbitkan berita acara audit selisih.
type AuditDiscrepancyRequest struct {
	Investigator string `json:"investigator"`
	Notes        string `json:"notes"`
}

// AttendanceFilter untuk parameter query pencarian dan saringan rekonsiliasi.
type AttendanceFilter struct {
	Search string `json:"search"`
	Status string `json:"status"`
	City   string `json:"city"`
}
