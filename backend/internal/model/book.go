package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BookSource 书籍来源类型
type BookSource string

const (
	BookSourcePublicDomain BookSource = "public_domain"
	BookSourceOriginal     BookSource = "original"
	BookSourceLicensed     BookSource = "licensed"
)

// BookStatus 书籍状态
type BookStatus string

const (
	BookStatusDraft     BookStatus = "draft"
	BookStatusPublished BookStatus = "published"
	BookStatusRemoved   BookStatus = "removed"
)

// BookAccessType 书籍访问类型（商业化）
type BookAccessType string

const (
	BookAccessFree BookAccessType = "free" // 免费阅读
	BookAccessVIP  BookAccessType = "vip"  // VIP 会员可读
	BookAccessPaid BookAccessType = "paid" // 单本付费
)

// Book 书籍模型
type Book struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Title       string         `json:"title" gorm:"not null;size:200"`
	Author      string         `json:"author" gorm:"size:100"`
	CoverURL    string         `json:"cover_url"`
	Description string         `json:"description" gorm:"type:text"`
	Language    string         `json:"language" gorm:"default:'zh';size:10"`
	Source      BookSource     `json:"source" gorm:"default:'public_domain'"`
	Status      BookStatus     `json:"status" gorm:"default:'published'"`
	AccessType  BookAccessType `json:"access_type" gorm:"default:'free'"`
	Price       int64          `json:"price" gorm:"default:0"` // 单本价格（分），仅 access_type=paid 时有效
	EPUBPath    string         `json:"epub_path"`
	LicenseNote string         `json:"license_note"`
	CreatedBy   *uuid.UUID     `json:"created_by" gorm:"type:uuid;index"`
	Creator     *User          `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Chapters    []Chapter      `json:"chapters,omitempty" gorm:"foreignKey:BookID"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (Book) TableName() string {
	return "books"
}

// BeforeCreate 创建前钩子
func (b *Book) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

// IsPublished 是否已发布
func (b *Book) IsPublished() bool {
	return b.Status == BookStatusPublished
}
