package models

import (
	"encoding/json"
	"time"
)

// NoticeAttachment merepresentasikan dokumen PDF resmi terlampir pada maklumat
type NoticeAttachment struct {
	FileName          string `json:"fileName"`
	FileSize          string `json:"fileSize"`
	VerifiedSignature string `json:"verifiedSignature"`
}

// NoticeAcknowledgementStats merepresentasikan statistik konfirmasi pembacaan (tap to acknowledge)
type NoticeAcknowledgementStats struct {
	TotalRecipients   int     `json:"totalRecipients"`
	AcknowledgedCount int     `json:"acknowledgedCount"`
	ComplianceRate    float64 `json:"complianceRate"`
}

// NoticeAuthor merepresentasikan pejabat/satgas penerbit surat edaran
type NoticeAuthor struct {
	Name string `json:"name"`
	Role string `json:"role"`
}

// Notice merepresentasikan surat edaran, maklumat, atau flash alert BGN
type Notice struct {
	ID                      string                     `json:"id"`
	RefNumber               string                     `json:"refNumber"`
	Title                   string                     `json:"title"`
	Category                string                     `json:"category"`
	CategoryLabel           string                     `json:"categoryLabel"`
	Urgency                 string                     `json:"urgency"`
	UrgencyLabel            string                     `json:"urgencyLabel"`
	TargetAudience          string                     `json:"targetAudience"`
	TargetAudienceLabel     string                     `json:"targetAudienceLabel"`
	ScopeRegion             string                     `json:"scopeRegion"`
	PublishedAt             string                     `json:"publishedAt"`
	EffectiveDate           string                     `json:"effectiveDate"`
	AuthorName              string                     `json:"authorName"`
	AuthorRole              string                     `json:"authorRole"`
	Author                  NoticeAuthor               `json:"author"`
	Content                 string                     `json:"content"`
	IsFlashAlert            bool                       `json:"isFlashAlert"`
	RequiresAcknowledgement bool                       `json:"requiresAcknowledgement"`
	Status                  string                     `json:"status"` // 'active' | 'archived'
	StatusLabel             string                     `json:"statusLabel"`
	StatusReason            string                     `json:"statusReason,omitempty"`
	AcknowledgementStats    NoticeAcknowledgementStats `json:"acknowledgementStats"`
	Attachments             json.RawMessage            `json:"attachments"`
	CreatedAt               time.Time                  `json:"createdAt"`
	UpdatedAt               time.Time                  `json:"updatedAt"`
}

// CreateNoticeRequest merepresentasikan payload pembuatan maklumat baru
type CreateNoticeRequest struct {
	Title                   string `json:"title"`
	RefNumber               string `json:"refNumber"`
	Category                string `json:"category"`
	Urgency                 string `json:"urgency"`
	TargetAudience          string `json:"targetAudience"`
	ScopeRegion             string `json:"scopeRegion"`
	AuthorName              string `json:"authorName"`
	AuthorRole              string `json:"authorRole"`
	Content                 string `json:"content"`
	EffectiveDate           string `json:"effectiveDate"`
	IsFlashAlert            bool   `json:"isFlashAlert"`
	RequiresAcknowledgement bool   `json:"requiresAcknowledgement"`
	AttachmentName          string `json:"attachmentName"`
	AttachmentSize          string `json:"attachmentSize"`
}

// NoticeFilter merepresentasikan filter query pencarian maklumat
type NoticeFilter struct {
	Search         string
	Category       string
	Urgency        string
	TargetAudience string
	Status         string
}
