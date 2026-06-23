package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrPaymentNotFound   = errors.New("payment not found")
	ErrPaymentAlreadyPaid = errors.New("payment already paid")
	ErrPaymentExpired    = errors.New("payment expired")
	ErrInsufficientBalance = errors.New("insufficient balance")
)

// PaymentService 支付服务
type PaymentService struct {
	paymentRepo *repository.PaymentRepository
	bookRepo    *repository.BookRepository
}

// NewPaymentService 创建支付服务
func NewPaymentService(paymentRepo *repository.PaymentRepository, bookRepo *repository.BookRepository) *PaymentService {
	return &PaymentService{
		paymentRepo: paymentRepo,
		bookRepo:    bookRepo,
	}
}

// CreatePaymentRequest 创建支付请求
type CreatePaymentRequest struct {
	Type        model.PaymentType `json:"type" validate:"required"`
	Amount      int64             `json:"amount" validate:"required,gt=0"`
	Subject     string            `json:"subject" validate:"required"`
	Description string            `json:"description"`
	BookID      *string           `json:"book_id,omitempty"`
	ChapterID   *string           `json:"chapter_id,omitempty"`
	Provider    string            `json:"provider" validate:"required,oneof=alipay wechat"`
}

// PaymentResponse 支付响应
type PaymentResponse struct {
	PaymentID       string `json:"payment_id"`
	ProviderOrderID string `json:"provider_order_id"`
	PayURL          string `json:"pay_url"` // 支付跳转链接
	ExpireAt        int64  `json:"expire_at"` // 过期时间戳
}

// CreatePayment 创建支付订单
func (s *PaymentService) CreatePayment(ctx context.Context, req *CreatePaymentRequest, userID uuid.UUID) (*PaymentResponse, error) {
	// 验证金额
	if req.Amount <= 0 {
		return nil, errors.New("invalid amount")
	}

	// 创建支付记录
	payment := &model.Payment{
		UserID:      userID,
		Type:        req.Type,
		Amount:      req.Amount,
		Currency:    "CNY",
		Status:      model.PaymentStatusPending,
		Subject:     req.Subject,
		Description: req.Description,
		Provider:    req.Provider,
	}

	if req.BookID != nil {
		bookID, err := uuid.Parse(*req.BookID)
		if err != nil {
			return nil, err
		}
		payment.BookID = &bookID
	}

	if req.ChapterID != nil {
		chapterID, err := uuid.Parse(*req.ChapterID)
		if err != nil {
			return nil, err
		}
		payment.ChapterID = &chapterID
	}

	// 设置过期时间（30分钟）
	expireAt := time.Now().Add(30 * time.Minute)
	payment.ExpiredAt = &expireAt

	if err := s.paymentRepo.Create(ctx, payment); err != nil {
		return nil, err
	}

	// 生成第三方支付订单号（模拟）
	providerOrderID := fmt.Sprintf("%s_%s", req.Provider, payment.ID.String()[:8])
	payment.ProviderOrderID = providerOrderID

	// 更新支付记录
	if err := s.paymentRepo.Update(ctx, payment); err != nil {
		return nil, err
	}

	// 生成支付链接（模拟）
	payURL := fmt.Sprintf("https://example.com/pay/%s?order=%s", req.Provider, providerOrderID)

	return &PaymentResponse{
		PaymentID:       payment.ID.String(),
		ProviderOrderID: providerOrderID,
		PayURL:          payURL,
		ExpireAt:        expireAt.Unix(),
	}, nil
}

// ProcessPaymentCallback 处理支付回调
func (s *PaymentService) ProcessPaymentCallback(ctx context.Context, provider, providerOrderID string, success bool) error {
	payment, err := s.paymentRepo.GetByProviderOrderID(ctx, provider, providerOrderID)
	if err != nil {
		return err
	}

	// 检查是否已过期
	if payment.ExpiredAt != nil && time.Now().After(*payment.ExpiredAt) {
		payment.Status = model.PaymentStatusCancelled
		return s.paymentRepo.Update(ctx, payment)
	}

	// 检查是否已支付
	if payment.IsPaid() {
		return ErrPaymentAlreadyPaid
	}

	if success {
		now := time.Now()
		payment.Status = model.PaymentStatusPaid
		payment.PaidAt = &now

		// 处理购买逻辑
		if err := s.processPurchase(ctx, payment); err != nil {
			return err
		}
	} else {
		payment.Status = model.PaymentStatusFailed
	}

	return s.paymentRepo.Update(ctx, payment)
}

// processPurchase 处理购买逻辑
func (s *PaymentService) processPurchase(ctx context.Context, payment *model.Payment) error {
	switch payment.Type {
	case model.PaymentTypeBook:
		if payment.BookID != nil {
			purchase := &model.UserBookPurchase{
				UserID: payment.UserID,
				BookID: *payment.BookID,
				Price:  payment.Amount,
			}
			if err := s.paymentRepo.CreateUserBookPurchase(ctx, purchase); err != nil {
				return err
			}
		}
	case model.PaymentTypeVIP:
		// 创建VIP订阅
		now := time.Now()
		endAt := now.AddDate(0, 1, 0) // 1个月
		sub := &model.VIPSubscription{
			UserID:   payment.UserID,
			Level:    1,
			StartAt:  now,
			EndAt:    endAt,
			IsActive: true,
		}
		if err := s.paymentRepo.CreateVIPSubscription(ctx, sub); err != nil {
			return err
		}
	}
	return nil
}

// GetPaymentStatus 获取支付状态
func (s *PaymentService) GetPaymentStatus(ctx context.Context, paymentID uuid.UUID) (*model.Payment, error) {
	return s.paymentRepo.GetByID(ctx, paymentID)
}

// ListUserPayments 获取用户支付记录
func (s *PaymentService) ListUserPayments(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]model.Payment, int64, error) {
	return s.paymentRepo.ListByUser(ctx, userID, page, pageSize)
}

// CheckUserVIP 检查用户VIP状态
func (s *PaymentService) CheckUserVIP(ctx context.Context, userID uuid.UUID) (*model.VIPSubscription, error) {
	return s.paymentRepo.GetVIPSubscription(ctx, userID)
}

// CheckUserBookAccess 检查用户是否有书籍访问权限
func (s *PaymentService) CheckUserBookAccess(ctx context.Context, userID, bookID uuid.UUID) (bool, error) {
	// 检查是否已购买
	purchased, err := s.paymentRepo.HasUserPurchasedBook(ctx, userID, bookID)
	if err != nil {
		return false, err
	}
	if purchased {
		return true, nil
	}

	// 检查是否是VIP
	vip, err := s.paymentRepo.GetVIPSubscription(ctx, userID)
	if err != nil {
		return false, err
	}
	if vip != nil && vip.IsValid() {
		return true, nil
	}

	return false, nil
}
