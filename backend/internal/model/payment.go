package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PaymentStatus 支付状态
type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"   // 待支付
	PaymentStatusPaid      PaymentStatus = "paid"      // 已支付
	PaymentStatusFailed    PaymentStatus = "failed"    // 支付失败
	PaymentStatusRefunded  PaymentStatus = "refunded"  // 已退款
	PaymentStatusCancelled PaymentStatus = "cancelled" // 已取消
)

// PaymentType 支付类型
type PaymentType string

const (
	PaymentTypeBook    PaymentType = "book"    // 购买书籍
	PaymentTypeVIP     PaymentType = "vip"     // VIP会员
	PaymentTypeChapter PaymentType = "chapter" // 购买章节
)

// Payment 支付记录
type Payment struct {
	ID          uuid.UUID     `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID      uuid.UUID     `json:"user_id" gorm:"type:uuid;not null;index"`
	User        *User         `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Type        PaymentType   `json:"type" gorm:"not null"`
	Amount      int64         `json:"amount" gorm:"not null"` // 金额（分）
	Currency    string        `json:"currency" gorm:"default:'CNY'"`
	Status      PaymentStatus `json:"status" gorm:"default:'pending'"`
	Subject     string        `json:"subject"`  // 订单标题
	Description string        `json:"description"` // 订单描述
	BookID      *uuid.UUID    `json:"book_id,omitempty" gorm:"type:uuid"`
	Book        *Book         `json:"book,omitempty" gorm:"foreignKey:BookID"`
	ChapterID   *uuid.UUID    `json:"chapter_id,omitempty" gorm:"type:uuid"`
	Chapter     *Chapter      `json:"chapter,omitempty" gorm:"foreignKey:ChapterID"`
	// 支付渠道信息
	Provider      string `json:"provider"`       // 支付渠道：alipay, wechat
	ProviderOrderID string `json:"provider_order_id"` // 第三方支付订单号
	PaidAt        *time.Time `json:"paid_at"`
	ExpiredAt     *time.Time `json:"expired_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (Payment) TableName() string {
	return "payments"
}

// BeforeCreate 创建前钩子
func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// IsPaid 是否已支付
func (p *Payment) IsPaid() bool {
	return p.Status == PaymentStatusPaid
}

// CanPay 是否可以支付
func (p *Payment) CanPay() bool {
	return p.Status == PaymentStatusPending
}

// VIPSubscription VIP订阅
type VIPSubscription struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	User      *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Level     int       `json:"level" gorm:"default:1"` // VIP等级
	StartAt   time.Time `json:"start_at"`
	EndAt     time.Time `json:"end_at"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName 指定表名
func (VIPSubscription) TableName() string {
	return "vip_subscriptions"
}

// IsValid 是否有效
func (v *VIPSubscription) IsValid() bool {
	return v.IsActive && time.Now().Before(v.EndAt)
}

// UserBookPurchase 用户书籍购买记录
type UserBookPurchase struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	BookID    uuid.UUID `json:"book_id" gorm:"type:uuid;not null;index"`
	Book      *Book     `json:"book,omitempty" gorm:"foreignKey:BookID"`
	Price     int64     `json:"price"` // 购买价格（分）
	CreatedAt time.Time `json:"created_at"`
}

// TableName 指定表名
func (UserBookPurchase) TableName() string {
	return "user_book_purchases"
}
