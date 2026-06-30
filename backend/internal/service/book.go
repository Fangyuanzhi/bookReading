package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrBookNotFound    = errors.New("book not found")
	ErrChapterNotFound = errors.New("chapter not found")
	ErrUnauthorized    = errors.New("unauthorized")
	ErrPaymentRequired = errors.New("payment required")
)

// PaymentRequiredDetail 付费拦截详情
type PaymentRequiredDetail struct {
	BookID     uuid.UUID
	AccessType model.BookAccessType
	Price      int64
	Reason     string
}

func (e *PaymentRequiredDetail) Error() string {
	return ErrPaymentRequired.Error()
}

func (e *PaymentRequiredDetail) Unwrap() error {
	return ErrPaymentRequired
}

// BookService 书籍服务
type BookService struct {
	bookRepo   *repository.BookRepository
	paymentSvc *PaymentService
}

// NewBookService 创建书籍服务
func NewBookService(bookRepo *repository.BookRepository, paymentSvc *PaymentService) *BookService {
	return &BookService{bookRepo: bookRepo, paymentSvc: paymentSvc}
}

// CreateBookRequest 创建书籍请求
type CreateBookRequest struct {
	Title       string           `json:"title" validate:"required,max=200"`
	Author      string           `json:"author" validate:"max=100"`
	Description string           `json:"description"`
	Language    string           `json:"language" validate:"max=10"`
	Source      model.BookSource `json:"source"`
	LicenseNote string           `json:"license_note"`
}

// UpdateBookRequest 更新书籍请求
type UpdateBookRequest struct {
	Title       string              `json:"title" validate:"omitempty,max=200"`
	Author      string              `json:"author" validate:"omitempty,max=100"`
	Description string              `json:"description"`
	CoverURL    string              `json:"cover_url"`
	AccessType  *model.BookAccessType `json:"access_type,omitempty"`
	Price       *int64              `json:"price,omitempty"`
}

// UpdateBookStatusRequest 更新书籍状态
type UpdateBookStatusRequest struct {
	Status model.BookStatus `json:"status" validate:"required"`
}

// UpdateChapterRequest 更新章节请求
type UpdateChapterRequest struct {
	Title   string  `json:"title" validate:"omitempty,max=200"`
	Idx     *int    `json:"idx"`
	Href    string  `json:"href" validate:"omitempty,max=500"`
	Content *string `json:"content"`
}

// CreateChapterRequest 创建章节请求
type CreateChapterRequest struct {
	Title   string `json:"title" validate:"required,max=200"`
	Idx     int    `json:"idx"`
	Href    string `json:"href" validate:"omitempty,max=500"`
	Content string `json:"content"`
}

// BookResponse 书籍响应
type BookResponse struct {
	model.Book
	ChapterCount int    `json:"chapter_count"`
	HasAccess    bool   `json:"has_access"`
	AccessReason string `json:"access_reason,omitempty"`
}

// CreateBook 创建书籍
func (s *BookService) CreateBook(ctx context.Context, req *CreateBookRequest, userID uuid.UUID) (*model.Book, error) {
	book := &model.Book{
		Title:       req.Title,
		Author:      req.Author,
		Description: req.Description,
		Language:    req.Language,
		Source:      req.Source,
		LicenseNote: req.LicenseNote,
		Status:      model.BookStatusPublished,
		CreatedBy:   &userID,
	}

	if book.Language == "" {
		book.Language = "zh"
	}
	if book.Source == "" {
		book.Source = model.BookSourcePublicDomain
	}
	// 原创作品默认草稿，需作者手动发布
	if book.Source == model.BookSourceOriginal {
		book.Status = model.BookStatusDraft
	} else if book.Status == "" {
		book.Status = model.BookStatusPublished
	}

	if err := s.bookRepo.Create(ctx, book); err != nil {
		return nil, err
	}

	return book, nil
}

func (s *BookService) canViewBook(book *model.Book, viewerID uuid.UUID) bool {
	if book.Status == model.BookStatusPublished {
		return true
	}
	return book.CreatedBy != nil && viewerID != uuid.Nil && *book.CreatedBy == viewerID
}

// GetBook 获取书籍详情
func (s *BookService) GetBook(ctx context.Context, id uuid.UUID) (*BookResponse, error) {
	return s.GetBookForUser(ctx, id, uuid.Nil)
}

// GetBookForUser 获取书籍详情（草稿仅作者可见）
func (s *BookService) GetBookForUser(ctx context.Context, id uuid.UUID, viewerID uuid.UUID) (*BookResponse, error) {
	book, err := s.bookRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return nil, ErrBookNotFound
		}
		return nil, err
	}

	if !s.canViewBook(book, viewerID) {
		return nil, ErrBookNotFound
	}

	resp := &BookResponse{
		Book:         *book,
		ChapterCount: len(book.Chapters),
		HasAccess:    true,
	}
	s.applyAccessInfo(ctx, resp, viewerID)
	return resp, nil
}

func (s *BookService) applyAccessInfo(ctx context.Context, resp *BookResponse, viewerID uuid.UUID) {
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

// ListBooks 获取书籍列表
func (s *BookService) ListBooks(ctx context.Context, page, pageSize int, search, source string) ([]model.Book, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.bookRepo.List(ctx, offset, pageSize, search, source)
}

// ListMyBooks 获取当前用户创建的书籍
func (s *BookService) ListMyBooks(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]model.Book, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	return s.bookRepo.ListByCreator(ctx, userID, offset, pageSize)
}

// UpdateBook 更新书籍
func (s *BookService) UpdateBook(ctx context.Context, id uuid.UUID, req *UpdateBookRequest, userID uuid.UUID) (*model.Book, error) {
	book, err := s.bookRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return nil, ErrBookNotFound
		}
		return nil, err
	}

	// 检查权限
	if book.CreatedBy == nil || *book.CreatedBy != userID {
		return nil, ErrUnauthorized
	}

	if req.Title != "" {
		book.Title = req.Title
	}
	if req.Author != "" {
		book.Author = req.Author
	}
	if req.Description != "" {
		book.Description = req.Description
	}
	if req.CoverURL != "" {
		book.CoverURL = req.CoverURL
	}
	if req.AccessType != nil {
		book.AccessType = *req.AccessType
		if book.AccessType == model.BookAccessFree {
			book.Price = 0
		}
	}
	if req.Price != nil {
		book.Price = *req.Price
	}

	if err := s.bookRepo.Update(ctx, book); err != nil {
		return nil, err
	}

	return book, nil
}

// DeleteBook 删除书籍
func (s *BookService) DeleteBook(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	book, err := s.bookRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return ErrBookNotFound
		}
		return err
	}

	// 检查权限
	if book.CreatedBy == nil || *book.CreatedBy != userID {
		return ErrUnauthorized
	}

	return s.bookRepo.Delete(ctx, id)
}

// CreateChapters 批量创建章节
func (s *BookService) CreateChapters(ctx context.Context, bookID uuid.UUID, reqs []CreateChapterRequest, userID uuid.UUID) error {
	book, err := s.bookRepo.GetByID(ctx, bookID)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return ErrBookNotFound
		}
		return err
	}

	// 检查权限
	if book.CreatedBy == nil || *book.CreatedBy != userID {
		return ErrUnauthorized
	}

	chapters := make([]model.Chapter, len(reqs))
	for i, req := range reqs {
		chapters[i] = model.Chapter{
			BookID:  bookID,
			Title:   req.Title,
			Idx:     req.Idx,
			Href:    req.Href,
			Content: req.Content,
		}
		if chapters[i].Href == "" {
			chapters[i].Href = fmt.Sprintf("chapter-%d.xhtml", req.Idx)
		}
	}

	return s.bookRepo.CreateChapters(ctx, chapters)
}

// GetChapter 获取章节详情
func (s *BookService) GetChapter(ctx context.Context, id uuid.UUID) (*model.Chapter, error) {
	return s.GetChapterForUser(ctx, id, uuid.Nil)
}

// GetChapterForUser 获取章节详情（草稿书籍仅作者可见）
func (s *BookService) GetChapterForUser(ctx context.Context, id uuid.UUID, viewerID uuid.UUID) (*model.Chapter, error) {
	chapter, err := s.bookRepo.GetChapterByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return nil, ErrChapterNotFound
		}
		return nil, err
	}

	book, err := s.bookRepo.GetByID(ctx, chapter.BookID)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return nil, ErrChapterNotFound
		}
		return nil, err
	}
	if !s.canViewBook(book, viewerID) {
		return nil, ErrChapterNotFound
	}

	if err := s.ensureReadAccess(ctx, book, viewerID); err != nil {
		return nil, err
	}

	return chapter, nil
}

func (s *BookService) ensureReadAccess(ctx context.Context, book *model.Book, viewerID uuid.UUID) error {
	if s.paymentSvc == nil {
		return nil
	}
	info, err := s.paymentSvc.GetBookAccessInfo(ctx, viewerID, book.ID)
	if err != nil {
		return err
	}
	if !info.HasAccess {
		return &PaymentRequiredDetail{
			BookID:     book.ID,
			AccessType: book.AccessType,
			Price:      book.Price,
			Reason:     info.Reason,
		}
	}
	return nil
}

// GetChaptersByBook 获取书籍的所有章节
func (s *BookService) GetChaptersByBook(ctx context.Context, bookID uuid.UUID) ([]model.Chapter, error) {
	return s.GetChaptersByBookForUser(ctx, bookID, uuid.Nil)
}

// GetChaptersByBookForUser 获取书籍章节列表（草稿书籍仅作者可见）
func (s *BookService) GetChaptersByBookForUser(ctx context.Context, bookID uuid.UUID, viewerID uuid.UUID) ([]model.Chapter, error) {
	book, err := s.bookRepo.GetByID(ctx, bookID)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return nil, ErrBookNotFound
		}
		return nil, err
	}
	if !s.canViewBook(book, viewerID) {
		return nil, ErrBookNotFound
	}
	return s.bookRepo.GetChaptersByBookID(ctx, bookID)
}

// UpdateBookStatus 发布或撤回书籍
func (s *BookService) UpdateBookStatus(ctx context.Context, id uuid.UUID, status model.BookStatus, userID uuid.UUID) (*model.Book, error) {
	book, err := s.bookRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return nil, ErrBookNotFound
		}
		return nil, err
	}
	if book.CreatedBy == nil || *book.CreatedBy != userID {
		return nil, ErrUnauthorized
	}
	if status != model.BookStatusDraft && status != model.BookStatusPublished {
		return nil, errors.New("invalid status")
	}
	if status == model.BookStatusPublished {
		chapters, err := s.bookRepo.GetChaptersByBookID(ctx, id)
		if err != nil {
			return nil, err
		}
		if len(chapters) == 0 {
			return nil, errors.New("至少需要一个章节才能发布")
		}
	}
	book.Status = status
	if err := s.bookRepo.Update(ctx, book); err != nil {
		return nil, err
	}
	return book, nil
}

// UpdateChapter 更新章节
func (s *BookService) UpdateChapter(ctx context.Context, chapterID uuid.UUID, req *UpdateChapterRequest, userID uuid.UUID) (*model.Chapter, error) {
	chapter, err := s.bookRepo.GetChapterByID(ctx, chapterID)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return nil, ErrChapterNotFound
		}
		return nil, err
	}
	book, err := s.bookRepo.GetByID(ctx, chapter.BookID)
	if err != nil {
		return nil, err
	}
	if book.CreatedBy == nil || *book.CreatedBy != userID {
		return nil, ErrUnauthorized
	}
	if req.Title != "" {
		chapter.Title = req.Title
	}
	if req.Idx != nil {
		chapter.Idx = *req.Idx
	}
	if req.Href != "" {
		chapter.Href = req.Href
	}
	if req.Content != nil {
		chapter.Content = *req.Content
	}
	if err := s.bookRepo.UpdateChapter(ctx, chapter); err != nil {
		return nil, err
	}
	return chapter, nil
}

// DeleteChapter 删除章节
func (s *BookService) DeleteChapter(ctx context.Context, chapterID uuid.UUID, userID uuid.UUID) error {
	chapter, err := s.bookRepo.GetChapterByID(ctx, chapterID)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return ErrChapterNotFound
		}
		return err
	}
	book, err := s.bookRepo.GetByID(ctx, chapter.BookID)
	if err != nil {
		return err
	}
	if book.CreatedBy == nil || *book.CreatedBy != userID {
		return ErrUnauthorized
	}
	return s.bookRepo.DeleteChapter(ctx, chapterID)
}

// CreateSingleChapter 创建单个章节（自动递增 idx）
func (s *BookService) CreateSingleChapter(ctx context.Context, bookID uuid.UUID, req *CreateChapterRequest, userID uuid.UUID) (*model.Chapter, error) {
	book, err := s.bookRepo.GetByID(ctx, bookID)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return nil, ErrBookNotFound
		}
		return nil, err
	}
	if book.CreatedBy == nil || *book.CreatedBy != userID {
		return nil, ErrUnauthorized
	}
	idx := req.Idx
	if idx <= 0 {
		maxIdx, err := s.bookRepo.MaxChapterIdx(ctx, bookID)
		if err != nil {
			return nil, err
		}
		idx = maxIdx + 1
	}
	href := req.Href
	if href == "" {
		href = fmt.Sprintf("chapter-%d.xhtml", idx)
	}
	chapter := &model.Chapter{
		BookID:  bookID,
		Title:   req.Title,
		Idx:     idx,
		Href:    href,
		Content: req.Content,
	}
	if err := s.bookRepo.CreateChapters(ctx, []model.Chapter{*chapter}); err != nil {
		return nil, err
	}
	// reload to get generated ID
	chapters, err := s.bookRepo.GetChaptersByBookID(ctx, bookID)
	if err != nil {
		return nil, err
	}
	for i := range chapters {
		if chapters[i].Idx == idx && chapters[i].Title == req.Title {
			return &chapters[i], nil
		}
	}
	return chapter, nil
}
