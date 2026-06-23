package repository

import (
	"context"
	"errors"
	"time"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrPaymentNotFound = errors.New("payment not found")
)

// PaymentRepository 支付数据访问层
type PaymentRepository struct {
	db *gorm.DB
}

// NewPaymentRepository 创建支付仓库
func NewPaymentRepository(db *gorm.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

// Create 创建支付记录
func (r *PaymentRepository) Create(ctx context.Context, payment *model.Payment) error {
	return r.db.WithContext(ctx).Create(payment).Error
}

// GetByID 根据ID获取支付记录
func (r *PaymentRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Payment, error) {
	var payment model.Payment
	if err := r.db.WithContext(ctx).First(&payment, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPaymentNotFound
		}
		return nil, err
	}
	return &payment, nil
}

// GetByProviderOrderID 根据第三方订单号获取
func (r *PaymentRepository) GetByProviderOrderID(ctx context.Context, provider, orderID string) (*model.Payment, error) {
	var payment model.Payment
	if err := r.db.WithContext(ctx).Where("provider = ? AND provider_order_id = ?", provider, orderID).First(&payment).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPaymentNotFound
		}
		return nil, err
	}
	return &payment, nil
}

// Update 更新支付记录
func (r *PaymentRepository) Update(ctx context.Context, payment *model.Payment) error {
	return r.db.WithContext(ctx).Save(payment).Error
}

// ListByUser 获取用户的支付记录
func (r *PaymentRepository) ListByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]model.Payment, int64, error) {
	var payments []model.Payment
	var total int64

	query := r.db.WithContext(ctx).Model(&model.Payment{}).Where("user_id = ?", userID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&payments).Error; err != nil {
		return nil, 0, err
	}

	return payments, total, nil
}

// CreateVIPSubscription 创建VIP订阅
func (r *PaymentRepository) CreateVIPSubscription(ctx context.Context, sub *model.VIPSubscription) error {
	return r.db.WithContext(ctx).Create(sub).Error
}

// GetVIPSubscription 获取用户VIP订阅
func (r *PaymentRepository) GetVIPSubscription(ctx context.Context, userID uuid.UUID) (*model.VIPSubscription, error) {
	var sub model.VIPSubscription
	if err := r.db.WithContext(ctx).Where("user_id = ? AND is_active = ? AND end_at > ?", userID, true, time.Now()).First(&sub).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &sub, nil
}

// CreateUserBookPurchase 创建用户书籍购买记录
func (r *PaymentRepository) CreateUserBookPurchase(ctx context.Context, purchase *model.UserBookPurchase) error {
	return r.db.WithContext(ctx).Create(purchase).Error
}

// HasUserPurchasedBook 检查用户是否已购买书籍
func (r *PaymentRepository) HasUserPurchasedBook(ctx context.Context, userID, bookID uuid.UUID) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&model.UserBookPurchase{}).Where("user_id = ? AND book_id = ?", userID, bookID).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
