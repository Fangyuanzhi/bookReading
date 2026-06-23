package service

import (
	"context"
	"strings"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/google/uuid"
)

// SearchService 搜索服务
type SearchService struct {
	bookRepo  *repository.BookRepository
	noteRepo  *repository.NoteRepository
	reviewRepo *repository.ReviewRepository
}

// NewSearchService 创建搜索服务
func NewSearchService(bookRepo *repository.BookRepository, noteRepo *repository.NoteRepository, reviewRepo *repository.ReviewRepository) *SearchService {
	return &SearchService{
		bookRepo:   bookRepo,
		noteRepo:   noteRepo,
		reviewRepo: reviewRepo,
	}
}

// SearchResult 搜索结果
type SearchResult struct {
	Books   []model.Book   `json:"books"`
	Notes   []model.Note   `json:"notes"`
	Reviews []model.Review `json:"reviews"`
	Total   int64          `json:"total"`
}

// SearchRequest 搜索请求
type SearchRequest struct {
	Query    string `json:"q" validate:"required,min=1,max=100"`
	Type     string `json:"type"` // all, book, note, review
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
}

// Search 全局搜索
func (s *SearchService) Search(ctx context.Context, req *SearchRequest) (*SearchResult, error) {
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 50 {
		req.PageSize = 20
	}

	result := &SearchResult{}
	var total int64

	switch req.Type {
	case "book":
		books, count, err := s.searchBooks(ctx, req)
		if err != nil {
			return nil, err
		}
		result.Books = books
		total = count
	case "note":
		notes, count, err := s.searchNotes(ctx, req)
		if err != nil {
			return nil, err
		}
		result.Notes = notes
		total = count
	case "review":
		reviews, count, err := s.searchReviews(ctx, req)
		if err != nil {
			return nil, err
		}
		result.Reviews = reviews
		total = count
	default:
		// 搜索所有类型
		books, bookCount, _ := s.searchBooks(ctx, req)
		notes, noteCount, _ := s.searchNotes(ctx, req)
		reviews, reviewCount, _ := s.searchReviews(ctx, req)
		result.Books = books
		result.Notes = notes
		result.Reviews = reviews
		total = bookCount + noteCount + reviewCount
	}

	result.Total = total
	return result, nil
}

// searchBooks 搜索书籍
func (s *SearchService) searchBooks(ctx context.Context, req *SearchRequest) ([]model.Book, int64, error) {
	offset := (req.Page - 1) * req.PageSize
	return s.bookRepo.List(ctx, offset, req.PageSize, req.Query)
}

// searchNotes 搜索段评
func (s *SearchService) searchNotes(ctx context.Context, req *SearchRequest) ([]model.Note, int64, error) {
	// 简化实现，实际应该使用全文搜索
	return s.noteRepo.Search(ctx, req.Query, req.Page, req.PageSize)
}

// searchReviews 搜索书评
func (s *SearchService) searchReviews(ctx context.Context, req *SearchRequest) ([]model.Review, int64, error) {
	return s.reviewRepo.Search(ctx, req.Query, req.Page, req.PageSize)
}

// SearchBooksInShelf 搜索书架中的书籍
func (s *SearchService) SearchBooksInShelf(ctx context.Context, userID uuid.UUID, query string) ([]model.Book, error) {
	// 获取用户的阅读进度，然后搜索相关书籍
	// 简化实现
	books, _, err := s.bookRepo.List(ctx, 0, 100, query)
	if err != nil {
		return nil, err
	}
	return books, nil
}

// GetHotBooks 获取热门书籍
func (s *SearchService) GetHotBooks(ctx context.Context, limit int) ([]model.Book, error) {
	if limit < 1 || limit > 50 {
		limit = 10
	}
	// 简化实现，按创建时间排序
	books, _, err := s.bookRepo.List(ctx, 0, limit, "")
	if err != nil {
		return nil, err
	}
	return books, nil
}

// GetNewBooks 获取新书
func (s *SearchService) GetNewBooks(ctx context.Context, limit int) ([]model.Book, error) {
	if limit < 1 || limit > 50 {
		limit = 10
	}
	books, _, err := s.bookRepo.List(ctx, 0, limit, "")
	if err != nil {
		return nil, err
	}
	return books, nil
}

// Suggest 搜索建议
func (s *SearchService) Suggest(ctx context.Context, query string, limit int) ([]string, error) {
	if limit < 1 || limit > 10 {
		limit = 5
	}

	// 简化实现，返回相关书籍标题
	books, _, err := s.bookRepo.List(ctx, 0, limit, query)
	if err != nil {
		return nil, err
	}

	suggestions := make([]string, 0, len(books))
	for _, book := range books {
		if strings.Contains(strings.ToLower(book.Title), strings.ToLower(query)) {
			suggestions = append(suggestions, book.Title)
		}
	}

	return suggestions, nil
}
