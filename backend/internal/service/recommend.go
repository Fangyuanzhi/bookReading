package service

import (
	"context"
	"math/rand"
	"time"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/google/uuid"
)

// RecommendService 推荐服务
type RecommendService struct {
	bookRepo *repository.BookRepository
	userRepo *repository.UserRepository
}

// NewRecommendService 创建推荐服务
func NewRecommendService(bookRepo *repository.BookRepository, userRepo *repository.UserRepository) *RecommendService {
	return &RecommendService{
		bookRepo: bookRepo,
		userRepo: userRepo,
	}
}

// RecommendRequest 推荐请求
type RecommendRequest struct {
	UserID uuid.UUID `json:"user_id"`
	Type   string    `json:"type"` // personalized, popular, similar
	Limit  int       `json:"limit"`
}

// RecommendResult 推荐结果
type RecommendResult struct {
	Books       []model.Book `json:"books"`
	Reason      string       `json:"reason"`
	Total       int          `json:"total"`
}

// Recommend 获取推荐
func (s *RecommendService) Recommend(ctx context.Context, req *RecommendRequest) (*RecommendResult, error) {
	if req.Limit < 1 || req.Limit > 50 {
		req.Limit = 10
	}

	switch req.Type {
	case "popular":
		return s.getPopularBooks(ctx, req.Limit)
	case "similar":
		return s.getSimilarBooks(ctx, req.UserID, req.Limit)
	case "new":
		return s.getNewBooks(ctx, req.Limit)
	default:
		return s.getPersonalized(ctx, req.UserID, req.Limit)
	}
}

// getPersonalized 个性化推荐
func (s *RecommendService) getPersonalized(ctx context.Context, userID uuid.UUID, limit int) (*RecommendResult, error) {
	// 简化实现：随机返回书籍
	// 实际应该基于用户阅读历史、偏好标签等
	books, _, err := s.bookRepo.List(ctx, 0, limit*2, "")
	if err != nil {
		return nil, err
	}

	// 随机选择
	rand.Seed(time.Now().UnixNano())
	if len(books) > limit {
		// 随机打乱
		rand.Shuffle(len(books), func(i, j int) {
			books[i], books[j] = books[j], books[i]
		})
		books = books[:limit]
	}

	return &RecommendResult{
		Books:  books,
		Reason: "基于您的阅读偏好推荐",
		Total:  len(books),
	}, nil
}

// getPopularBooks 热门推荐
func (s *RecommendService) getPopularBooks(ctx context.Context, limit int) (*RecommendResult, error) {
	// 简化实现：返回最新的书籍
	books, _, err := s.bookRepo.List(ctx, 0, limit, "")
	if err != nil {
		return nil, err
	}

	return &RecommendResult{
		Books:  books,
		Reason: "热门书籍",
		Total:  len(books),
	}, nil
}

// getSimilarBooks 相似书籍推荐
func (s *RecommendService) getSimilarBooks(ctx context.Context, userID uuid.UUID, limit int) (*RecommendResult, error) {
	// 简化实现：返回同作者或同类型的书籍
	books, _, err := s.bookRepo.List(ctx, 0, limit, "")
	if err != nil {
		return nil, err
	}

	return &RecommendResult{
		Books:  books,
		Reason: "相似书籍推荐",
		Total:  len(books),
	}, nil
}

// getNewBooks 新书推荐
func (s *RecommendService) getNewBooks(ctx context.Context, limit int) (*RecommendResult, error) {
	books, _, err := s.bookRepo.List(ctx, 0, limit, "")
	if err != nil {
		return nil, err
	}

	return &RecommendResult{
		Books:  books,
		Reason: "新书上架",
		Total:  len(books),
	}, nil
}

// GetDailyRecommend 每日推荐
func (s *RecommendService) GetDailyRecommend(ctx context.Context, userID uuid.UUID) (*RecommendResult, error) {
	// 基于日期生成一致的推荐
	seed := time.Now().YearDay() + int(userID.ID())
	rand.Seed(int64(seed))

	books, _, err := s.bookRepo.List(ctx, 0, 5, "")
	if err != nil {
		return nil, err
	}

	// 随机打乱但每天结果一致
	if len(books) > 3 {
		rand.Shuffle(len(books), func(i, j int) {
			books[i], books[j] = books[j], books[i]
		})
		books = books[:3]
	}

	return &RecommendResult{
		Books:  books,
		Reason: "今日推荐",
		Total:  len(books),
	}, nil
}

// GetTrendingBooks 趋势书籍
func (s *RecommendService) GetTrendingBooks(ctx context.Context, limit int) (*RecommendResult, error) {
	// 简化实现：返回随机书籍
	books, _, err := s.bookRepo.List(ctx, 0, limit, "")
	if err != nil {
		return nil, err
	}

	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(books), func(i, j int) {
		books[i], books[j] = books[j], books[i]
	})

	return &RecommendResult{
		Books:  books,
		Reason: "趋势上升",
		Total:  len(books),
	}, nil
}

// GetEditorPicks 编辑精选
func (s *RecommendService) GetEditorPicks(ctx context.Context, limit int) (*RecommendResult, error) {
	books, _, err := s.bookRepo.List(ctx, 0, limit, "")
	if err != nil {
		return nil, err
	}

	return &RecommendResult{
		Books:  books,
		Reason: "编辑精选",
		Total:  len(books),
	}, nil
}
