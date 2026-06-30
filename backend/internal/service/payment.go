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

const (
	VIPMonthlyPriceCents = 1990 // ¥19.9/月
)

var (
	ErrPaymentNotFound      = errors.New("payment not found")
	ErrPaymentAlreadyPaid   = errors.New("payment already paid")
	ErrPaymentExpired       = errors.New("payment expired")
	ErrInsufficientBalance  = errors.New("insufficient balance")
	ErrPaymentUnauthorized  = errors.New("payment unauthorized")
	ErrInvalidPaymentAmount = errors.New("invalid payment amount")
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

// PricingPlan 定价方案
type PricingPlan struct {
	Type        model.PaymentType `json:"type"`
	Amount      int64             `json:"amount"`
	Label       string            `json:"label"`
	Description string            `json:"description"`
}

// PricingResponse 定价信息
type PricingResponse struct {
	VIPMonthly PricingPlan `json:"vip_monthly"`
	Providers  []string    `json:"providers"`
}

// BookAccessInfo 书籍访问信息
type BookAccessInfo struct {
	BookID     string             `json:"book_id"`
	AccessType model.BookAccessType `json:"access_type"`
	Price      int64              `json:"price"`
	HasAccess  bool               `json:"has_access"`
	Reason     string             `json:"reason,omitempty"`
}

// CreatePaymentRequest 创建支付请求
type CreatePaymentRequest struct {
	Type        model.PaymentType `json:"type" validate:"required"`
	Amount      int64             `json:"amount" validate:"required,gt=0"`
	Subject     string            `json:"subject" validate:"required"`
	Description string            `json:"description"`
	BookID      *string           `json:"book_id,omitempty"`
	ChapterID   *string           `json:"chapter_id,omitempty"`
	Provider    string            `json:"provider" validate:"required,oneof=mock alipay wechat"`
}

// PaymentResponse 支付响应
type PaymentResponse struct {
	PaymentID       string `json:"payment_id"`
	ProviderOrderID string `json:"provider_order_id"`
	PayURL          string `json:"pay_url"`
	ExpireAt        int64  `json:"expire_at"`
	Provider        string `json:"provider"`
}

// GetPricing 获取定价方案
func (s *PaymentService) GetPricing() *PricingResponse {
	return &PricingResponse{
		VIPMonthly: PricingPlan{
			Type:        model.PaymentTypeVIP,
			Amount:      VIPMonthlyPriceCents,
			Label:       "读书会 VIP 月卡",
			Description: "畅读全部 VIP 专区作品，专属标识",
		},
		Providers: []string{"mock", "alipay", "wechat"},
	}
}

// CreatePayment 创建支付订单
func (s *PaymentService) CreatePayment(ctx context.Context, req *CreatePaymentRequest, userID uuid.UUID) (*PaymentResponse, error) {
	expected, err := s.expectedAmount(ctx, req)
	if err != nil {
		return nil, err
	}
	if req.Amount != expected {
		return nil, ErrInvalidPaymentAmount
	}

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

	expireAt := time.Now().Add(30 * time.Minute)
	payment.ExpiredAt = &expireAt

	if err := s.paymentRepo.Create(ctx, payment); err != nil {
		return nil, err
	}

	providerOrderID := fmt.Sprintf("%s_%s", req.Provider, payment.ID.String()[:8])
	payment.ProviderOrderID = providerOrderID

	if err := s.paymentRepo.Update(ctx, payment); err != nil {
		return nil, err
	}

	payURL := fmt.Sprintf("/vip?pay=%s", payment.ID.String())
	if req.Provider != "mock" {
		payURL = fmt.Sprintf("https://example.com/pay/%s?order=%s", req.Provider, providerOrderID)
	}

	return &PaymentResponse{
		PaymentID:       payment.ID.String(),
		ProviderOrderID: providerOrderID,
		PayURL:          payURL,
		ExpireAt:        expireAt.Unix(),
		Provider:        req.Provider,
	}, nil
}

func (s *PaymentService) expectedAmount(ctx context.Context, req *CreatePaymentRequest) (int64, error) {
	switch req.Type {
	case model.PaymentTypeVIP:
		return VIPMonthlyPriceCents, nil
	case model.PaymentTypeBook:
		if req.BookID == nil {
			return 0, errors.New("book_id required")
		}
		bookID, err := uuid.Parse(*req.BookID)
		if err != nil {
			return 0, err
		}
		book, err := s.bookRepo.GetByID(ctx, bookID)
		if err != nil {
			return 0, err
		}
		if book.AccessType != model.BookAccessPaid || book.Price <= 0 {
			return 0, errors.New("book is not for sale")
		}
		return book.Price, nil
	default:
		return req.Amount, nil
	}
}

// ConfirmPayment 模拟支付确认（开发/演示用）
func (s *PaymentService) ConfirmPayment(ctx context.Context, paymentID, userID uuid.UUID) (*model.Payment, error) {
	payment, err := s.paymentRepo.GetByID(ctx, paymentID)
	if err != nil {
		return nil, err
	}
	if payment.UserID != userID {
		return nil, ErrPaymentUnauthorized
	}
	if payment.Provider != "mock" {
		return nil, errors.New("only mock payments can be confirmed directly")
	}
	if payment.IsPaid() {
		return payment, nil
	}
	if payment.ExpiredAt != nil && time.Now().After(*payment.ExpiredAt) {
		payment.Status = model.PaymentStatusCancelled
		_ = s.paymentRepo.Update(ctx, payment)
		return nil, ErrPaymentExpired
	}

	if err := s.ProcessPaymentCallback(ctx, payment.Provider, payment.ProviderOrderID, true); err != nil {
		if errors.Is(err, ErrPaymentAlreadyPaid) {
			return s.paymentRepo.GetByID(ctx, paymentID)
		}
		return nil, err
	}
	return s.paymentRepo.GetByID(ctx, paymentID)
}

// ProcessPaymentCallback 处理支付回调
func (s *PaymentService) ProcessPaymentCallback(ctx context.Context, provider, providerOrderID string, success bool) error {
	payment, err := s.paymentRepo.GetByProviderOrderID(ctx, provider, providerOrderID)
	if err != nil {
		return err
	}

	if payment.ExpiredAt != nil && time.Now().After(*payment.ExpiredAt) {
		payment.Status = model.PaymentStatusCancelled
		return s.paymentRepo.Update(ctx, payment)
	}

	if payment.IsPaid() {
		return ErrPaymentAlreadyPaid
	}

	if success {
		now := time.Now()
		payment.Status = model.PaymentStatusPaid
		payment.PaidAt = &now

		if err := s.processPurchase(ctx, payment); err != nil {
			return err
		}
	} else {
		payment.Status = model.PaymentStatusFailed
	}

	return s.paymentRepo.Update(ctx, payment)
}

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
		now := time.Now()
		endAt := now.AddDate(0, 1, 0)
		existing, err := s.paymentRepo.GetVIPSubscription(ctx, payment.UserID)
		if err != nil {
			return err
		}
		if existing != nil && existing.IsValid() {
			endAt = existing.EndAt.AddDate(0, 1, 0)
			existing.EndAt = endAt
			existing.IsActive = true
			return s.paymentRepo.UpdateVIPSubscription(ctx, existing)
		}
		sub := &model.VIPSubscription{
			UserID:   payment.UserID,
			Level:    1,
			StartAt:  now,
			EndAt:    endAt,
			IsActive: true,
		}
		return s.paymentRepo.CreateVIPSubscription(ctx, sub)
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

// CheckUserBookAccess 检查用户是否有书籍阅读权限
func (s *PaymentService) CheckUserBookAccess(ctx context.Context, userID, bookID uuid.UUID) (bool, error) {
	info, err := s.GetBookAccessInfo(ctx, userID, bookID)
	if err != nil {
		return false, err
	}
	return info.HasAccess, nil
}

// GetBookAccessInfo 获取书籍访问详情
func (s *PaymentService) GetBookAccessInfo(ctx context.Context, userID, bookID uuid.UUID) (*BookAccessInfo, error) {
	book, err := s.bookRepo.GetByID(ctx, bookID)
	if err != nil {
		return nil, err
	}

	info := &BookAccessInfo{
		BookID:     bookID.String(),
		AccessType: book.AccessType,
		Price:      book.Price,
		HasAccess:  true,
	}

	if book.AccessType == "" || book.AccessType == model.BookAccessFree {
		info.AccessType = model.BookAccessFree
		return info, nil
	}

	if book.CreatedBy != nil && userID != uuid.Nil && *book.CreatedBy == userID {
		return info, nil
	}

	switch book.AccessType {
	case model.BookAccessVIP:
		vip, err := s.paymentRepo.GetVIPSubscription(ctx, userID)
		if err != nil {
			return nil, err
		}
		if vip != nil && vip.IsValid() {
			return info, nil
		}
		info.HasAccess = false
		info.Reason = "vip_required"
	case model.BookAccessPaid:
		purchased, err := s.paymentRepo.HasUserPurchasedBook(ctx, userID, bookID)
		if err != nil {
			return nil, err
		}
		if purchased {
			return info, nil
		}
		vip, err := s.paymentRepo.GetVIPSubscription(ctx, userID)
		if err != nil {
			return nil, err
		}
		if vip != nil && vip.IsValid() {
			return info, nil
		}
		info.HasAccess = false
		info.Reason = "purchase_required"
	default:
		return info, nil
	}

	return info, nil
}
