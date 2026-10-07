package models

import "time"

// DashboardKPIs rangkuman metrik utama
type DashboardKPIs struct {
	TotalPortionsToday   int     `json:"totalPortionsToday"`
	TargetPortionsToday  int     `json:"targetPortionsToday"`
	SchoolsServedCount   int     `json:"schoolsServedCount"`
	ActiveKitchensCount  int     `json:"activeKitchensCount"`
	ActiveIncidentsCount int     `json:"activeIncidentsCount"`
	FrozenBatchesCount   int     `json:"frozenBatchesCount"`
	OnTimeRate           float64 `json:"onTimeRate"`
	SafetyPassRate       float64 `json:"safetyPassRate"`
	ColdChainSafeRate    float64 `json:"coldChainSafeRate"`
	AvgTempC             float64 `json:"avgTempC"`
	TempLogsCount        int     `json:"tempLogsCount"`
	TotalNoticesCount    int     `json:"totalNoticesCount"`
	TotalReportsCount    int     `json:"totalReportsCount"`
	TotalBastsCount      int     `json:"totalBastsCount"`
	TotalValidatorsCount int     `json:"totalValidatorsCount"`
}

// NutritionChartItem item AKG
type NutritionChartItem struct {
	Nutrient string  `json:"nutrient"`
	Actual   float64 `json:"actual"`
	Target   float64 `json:"target"`
	Unit     string  `json:"unit"`
}

// DemographicsChartItem demografi siswa
type DemographicsChartItem struct {
	Name  string `json:"name"`
	Value int    `json:"value"`
	Color string `json:"color"`
}

// DemographicsSummary ringkasan demografi
type DemographicsSummary struct {
	TotalStudents int                     `json:"totalStudents"`
	MalePercent   float64                 `json:"malePercent"`
	FemalePercent float64                 `json:"femalePercent"`
	Items         []DemographicsChartItem `json:"items"`
}

// LogisticsChartItem kapasitas vs terkirim regional
type LogisticsChartItem struct {
	Region    string `json:"region"`
	Terkirim  int    `json:"terkirim"`
	Kapasitas int    `json:"kapasitas"`
}

// HourlyFlowChartItem aliran porsi per jam
type HourlyFlowChartItem struct {
	Time   string `json:"time"`
	Volume int    `json:"volume"`
}

// RiskFactorChartItem anomali dan mitigasi
type RiskFactorChartItem struct {
	Factor string `json:"factor"`
	Pct    int    `json:"pct"`
	Cases  int    `json:"cases"`
	Color  string `json:"color"`
	Action string `json:"action"`
}

// SLARadarChartItem 5 dimensi SLA
type SLARadarChartItem struct {
	Subject string  `json:"subject"`
	Score   float64 `json:"score"`
}

// DashboardCharts kumpulan data untuk 6 grafik Charts5W1H
type DashboardCharts struct {
	NutritionScore         float64               `json:"nutritionScore"`
	Nutrition              []NutritionChartItem  `json:"nutrition"`
	Demographics           DemographicsSummary   `json:"demographics"`
	Logistics              []LogisticsChartItem  `json:"logistics"`
	HourlyFlow             []HourlyFlowChartItem `json:"hourlyFlow"`
	RiskFactors            []RiskFactorChartItem `json:"riskFactors"`
	TotalRiskCases         int                   `json:"totalRiskCases"`
	AvgMitigationMinutes   float64               `json:"avgMitigationMinutes"`
	SLARadar               []SLARadarChartItem   `json:"slaRadar"`
	MinSLADimension        string                `json:"minSlaDimension"`
	MinSLAScore            float64               `json:"minSlaScore"`
	ProtectedPortionsTotal int                   `json:"protectedPortionsTotal"`
}

// DashboardRecentDelivery item kiriman terakhir
type DashboardRecentDelivery struct {
	ID        string  `json:"id"`
	School    string  `json:"school"`
	Sppg      string  `json:"sppg"`
	City      string  `json:"city"`
	Portions  int     `json:"portions"`
	Time      string  `json:"time"`
	Temp      string  `json:"temp"`
	Status    string  `json:"status"`
	Quality   string  `json:"quality"`
	Freshness string  `json:"freshness"`
	AiScore   float64 `json:"aiScore"`
}

// DashboardRecentNotice pengumuman terbaru
type DashboardRecentNotice struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Summary  string `json:"summary"`
	Date     string `json:"date"`
	Category string `json:"category"`
	Urgency  string `json:"urgency"`
}

// AdminDashboardBundle respon terpadu penuh dashboard
type AdminDashboardBundle struct {
	KPIs             DashboardKPIs             `json:"kpis"`
	Charts           DashboardCharts           `json:"charts"`
	RecentDeliveries []DashboardRecentDelivery `json:"recentDeliveries"`
	RecentNotices    []DashboardRecentNotice   `json:"recentNotices"`
	AuditLogCount    int                       `json:"auditLogCount"`
	ServerTime       time.Time                 `json:"serverTime"`
}
