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
)

// BookService 书籍服务
type BookService struct {
	bookRepo *repository.BookRepository
}

// NewBookService 创建书籍服务
func NewBookService(bookRepo *repository.BookRepository) *BookService {
	return &BookService{bookRepo: bookRepo}
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
	Title       string `json:"title" validate:"omitempty,max=200"`
	Author      string `json:"author" validate:"omitempty,max=100"`
	Description string `json:"description"`
	CoverURL    string `json:"cover_url"`
}

// CreateChapterRequest 创建章节请求
type CreateChapterRequest struct {
	Title   string `json:"title" validate:"required,max=200"`
	Idx     int    `json:"idx" validate:"required"`
	Href    string `json:"href" validate:"required,max=500"`
	Content string `json:"content"`
}

// BookResponse 书籍响应
type BookResponse struct {
	model.Book
	ChapterCount int `json:"chapter_count"`
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

	if err := s.bookRepo.Create(ctx, book); err != nil {
		return nil, err
	}

	return book, nil
}

// GetBook 获取书籍详情
func (s *BookService) GetBook(ctx context.Context, id uuid.UUID) (*BookResponse, error) {
	book, err := s.bookRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return nil, ErrBookNotFound
		}
		return nil, err
	}

	resp := &BookResponse{
		Book:         *book,
		ChapterCount: len(book.Chapters),
	}
	return resp, nil
}

// ListBooks 获取书籍列表
func (s *BookService) ListBooks(ctx context.Context, page, pageSize int, search string) ([]model.Book, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.bookRepo.List(ctx, offset, pageSize, search)
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
	}

	return s.bookRepo.CreateChapters(ctx, chapters)
}

// GetChapter 获取章节详情
func (s *BookService) GetChapter(ctx context.Context, id uuid.UUID) (*model.Chapter, error) {
	chapter, err := s.bookRepo.GetChapterByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return nil, ErrChapterNotFound
		}
		return nil, err
	}
	return chapter, nil
}

// GetChaptersByBook 获取书籍的所有章节
func (s *BookService) GetChaptersByBook(ctx context.Context, bookID uuid.UUID) ([]model.Chapter, error) {
	return s.bookRepo.GetChaptersByBookID(ctx, bookID)
}

// ParseEPUB 解析 EPUB 文件（简化版）
func (s *BookService) ParseEPUB(ctx context.Context, bookID uuid.UUID, epubPath string, userID uuid.UUID) error {
	// TODO: 实现 EPUB 解析
	// 1. 读取 ZIP 文件
	// 2. 解析 container.xml 找到 OPF
	// 3. 解析 OPF 获取 spine 和 TOC
	// 4. 提取章节内容
	// 5. 创建章节记录

	return fmt.Errorf("EPUB parsing not implemented yet")
}
