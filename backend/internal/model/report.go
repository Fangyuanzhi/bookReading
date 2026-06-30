package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReportTargetType 举报对象类型
type ReportTargetType string

const (
	ReportTargetBook   ReportTargetType = "book"
	ReportTargetNote   ReportTargetType = "note"
	ReportTargetReview ReportTargetType = "review"
)

// ReportReason 举报原因
type ReportReason string

const (
	ReportReasonCopyright      ReportReason = "copyright"
	ReportReasonInappropriate  ReportReason = "inappropriate"
	ReportReasonSpam           ReportReason = "spam"
	ReportReasonOther          ReportReason = "other"
)

// ReportStatus 举报处理状态
type ReportStatus string

const (
	ReportStatusPending   ReportStatus = "pending"
	ReportStatusResolved  ReportStatus = "resolved"
	ReportStatusDismissed ReportStatus = "dismissed"
)

// Report 内容举报（避风港通知入口）
type Report struct {
	ID         uuid.UUID        `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ReporterID uuid.UUID        `json:"reporter_id" gorm:"type:uuid;not null;index"`
	Reporter   *User            `json:"reporter,omitempty" gorm:"foreignKey:ReporterID"`
	TargetType ReportTargetType `json:"target_type" gorm:"not null;size:20;index:idx_report_target,priority:1"`
	TargetID   uuid.UUID        `json:"target_id" gorm:"type:uuid;not null;index:idx_report_target,priority:2"`
	Reason     ReportReason     `json:"reason" gorm:"not null;size:30"`
	Detail     string           `json:"detail" gorm:"type:text"`
	Status     ReportStatus     `json:"status" gorm:"default:'pending';size:20;index"`
	CreatedAt  time.Time        `json:"created_at"`
	UpdatedAt  time.Time        `json:"updated_at"`
	DeletedAt  gorm.DeletedAt   `json:"-" gorm:"index"`
}

func (Report) TableName() string {
	return "reports"
}

func (r *Report) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
