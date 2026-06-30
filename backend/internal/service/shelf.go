package service

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrShelfBookNotFound     = errors.New("book not found")
	ErrShelfBookNotPublished = errors.New("only published books can be added to shelf")
)

// ShelfService 书架服务
type ShelfService struct {
	shelfRepo    *repository.ShelfRepository
	bookRepo     *repository.BookRepository
	progressRepo *repository.ProgressRepository
	paymentSvc   *PaymentService
}

// NewShelfService 创建书架服务
func NewShelfService(
	shelfRepo *repository.ShelfRepository,
	bookRepo *repository.BookRepository,
	progressRepo *repository.ProgressRepository,
	paymentSvc *PaymentService,
) *ShelfService {
	return &ShelfService{
		shelfRepo:    shelfRepo,
		bookRepo:     bookRepo,
		progressRepo: progressRepo,
		paymentSvc:   paymentSvc,
	}
}

// AddShelfRequest 加入书架请求
type AddShelfRequest struct {
	BookID uuid.UUID `json:"book_id" binding:"required"`
}

// ShelfItemResponse 书架条目响应
type ShelfItemResponse struct {
	BookID    uuid.UUID              `json:"book_id"`
	AddedAt   string                 `json:"added_at"`
	Book      *BookResponse          `json:"book"`
	Progress  *model.ReadingProgress `json:"progress,omitempty"`
}

// List 获取书架列表
func (s *ShelfService) List(ctx context.Context, userID uuid.UUID, search string, page, pageSize int) ([]ShelfItemResponse, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	items, total, err := s.shelfRepo.ListByUser(ctx, userID, search, offset, pageSize)
	if err != nil {
		return nil, 0, err
	}

	resp := make([]ShelfItemResponse, 0, len(items))
	for _, item := range items {
		if item.Book == nil {
			continue
		}
		bookResp := &BookResponse{
			Book:         *item.Book,
			ChapterCount: len(item.Book.Chapters),
			HasAccess:    true,
		}
		s.applyShelfAccessInfo(ctx, bookResp, userID)

		entry := ShelfItemResponse{
			BookID:  item.BookID,
			AddedAt: item.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			Book:    bookResp,
		}

		if progress, err := s.progressRepo.GetByUserAndBook(ctx, userID, item.BookID); err == nil {
			entry.Progress = progress
		}

		resp = append(resp, entry)
	}

	return resp, total, nil
}

func (s *ShelfService) applyShelfAccessInfo(ctx context.Context, resp *BookResponse, viewerID uuid.UUID) {
	if s.paymentSvc == nil {
		return
	}
	info, err := s.paymentSvc.GetBookAccessInfo(ctx, viewerID, resp.Book.ID)
	if err != nil {
		return
	}
	resp.HasAccess = info.HasAccess
	resp.AccessReason = info.Reason
	if resp.AccessType == "" {
		resp.AccessType = model.BookAccessFree
	}
}

// Add 加入书架
func (s *ShelfService) Add(ctx context.Context, userID uuid.UUID, bookID uuid.UUID) error {
	book, err := s.bookRepo.GetByID(ctx, bookID)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return ErrShelfBookNotFound
		}
		return err
	}

	if book.Status != model.BookStatusPublished {
		return ErrShelfBookNotPublished
	}

	return s.shelfRepo.Add(ctx, userID, bookID)
}

// Remove 移出书架
func (s *ShelfService) Remove(ctx context.Context, userID, bookID uuid.UUID) error {
	return s.shelfRepo.Remove(ctx, userID, bookID)
}

// Status 查询是否在书架
func (s *ShelfService) Status(ctx context.Context, userID, bookID uuid.UUID) (bool, error) {
	return s.shelfRepo.Exists(ctx, userID, bookID)
}
