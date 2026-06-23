package service

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/fangyuanzhi/bookreading-backend/pkg/centrifugo"
	"github.com/google/uuid"
)

var (
	ErrReviewNotFound = errors.New("review not found")
)

// ReviewService 书评服务
type ReviewService struct {
	reviewRepo       *repository.ReviewRepository
	centrifugoClient *centrifugo.Client
}

// NewReviewService 创建书评服务
func NewReviewService(reviewRepo *repository.ReviewRepository, centrifugoClient *centrifugo.Client) *ReviewService {
	return &ReviewService{
		reviewRepo:       reviewRepo,
		centrifugoClient: centrifugoClient,
	}
}

// CreateReviewRequest 创建书评请求
type CreateReviewRequest struct {
	BookID    string `json:"book_id" validate:"required,uuid"`
	ChapterID string `json:"chapter_id" validate:"omitempty,uuid"`
	Body      string `json:"body" validate:"required,max=2000"`
}

// UpdateReviewRequest 更新书评请求
type UpdateReviewRequest struct {
	Body string `json:"body" validate:"required,max=2000"`
}

// ReviewResponse 书评响应
type ReviewResponse struct {
	model.Review
	HasLiked bool `json:"has_liked"`
}

// CreateReview 创建书评
func (s *ReviewService) CreateReview(ctx context.Context, req *CreateReviewRequest, userID uuid.UUID) (*model.Review, error) {
	bookID, err := uuid.Parse(req.BookID)
	if err != nil {
		return nil, err
	}

	review := &model.Review{
		BookID: bookID,
		UserID: userID,
		Body:   req.Body,
	}

	if req.ChapterID != "" {
		chapterID, err := uuid.Parse(req.ChapterID)
		if err != nil {
			return nil, err
		}
		review.ChapterID = &chapterID
	}

	if err := s.reviewRepo.Create(ctx, review); err != nil {
		return nil, err
	}

	// 实时推送到书籍频道
	if s.centrifugoClient != nil {
		channel := centrifugo.GenerateChannelName("book", bookID.String())
		s.centrifugoClient.Publish(channel, map[string]interface{}{
			"type": "review_created",
			"data": review,
		})
	}

	return review, nil
}

// GetReview 获取书评详情
func (s *ReviewService) GetReview(ctx context.Context, id uuid.UUID, currentUserID uuid.UUID) (*ReviewResponse, error) {
	review, err := s.reviewRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrReviewNotFound) {
			return nil, ErrReviewNotFound
		}
		return nil, err
	}

	hasLiked, _ := s.reviewRepo.HasLiked(ctx, id, currentUserID)

	return &ReviewResponse{
		Review:   *review,
		HasLiked: hasLiked,
	}, nil
}

// ListReviewsByBook 获取书籍的书评列表
func (s *ReviewService) ListReviewsByBook(ctx context.Context, bookID uuid.UUID, page, pageSize int) ([]model.Review, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.reviewRepo.ListByBook(ctx, bookID, offset, pageSize)
}

// ListReviewsByChapter 获取章节的书评列表
func (s *ReviewService) ListReviewsByChapter(ctx context.Context, chapterID uuid.UUID, page, pageSize int) ([]model.Review, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.reviewRepo.ListByChapter(ctx, chapterID, offset, pageSize)
}

// ListReviewsByUser 获取当前用户的书评列表
func (s *ReviewService) ListReviewsByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]model.Review, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	return s.reviewRepo.ListByUser(ctx, userID, offset, pageSize)
}

// UpdateReview 更新书评
func (s *ReviewService) UpdateReview(ctx context.Context, id uuid.UUID, req *UpdateReviewRequest, userID uuid.UUID) (*model.Review, error) {
	review, err := s.reviewRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrReviewNotFound) {
			return nil, ErrReviewNotFound
		}
		return nil, err
	}

	// 检查权限
	if review.UserID != userID {
		return nil, errors.New("unauthorized")
	}

	review.Body = req.Body

	if err := s.reviewRepo.Update(ctx, review); err != nil {
		return nil, err
	}

	return review, nil
}

// DeleteReview 删除书评
func (s *ReviewService) DeleteReview(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	review, err := s.reviewRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrReviewNotFound) {
			return ErrReviewNotFound
		}
		return err
	}

	// 检查权限
	if review.UserID != userID {
		return errors.New("unauthorized")
	}

	return s.reviewRepo.Delete(ctx, id)
}

// LikeReview 点赞书评
func (s *ReviewService) LikeReview(ctx context.Context, reviewID, userID uuid.UUID) error {
	// 检查书评是否存在
	_, err := s.reviewRepo.GetByID(ctx, reviewID)
	if err != nil {
		if errors.Is(err, repository.ErrReviewNotFound) {
			return ErrReviewNotFound
		}
		return err
	}

	// 检查是否已点赞
	hasLiked, err := s.reviewRepo.HasLiked(ctx, reviewID, userID)
	if err != nil {
		return err
	}
	if hasLiked {
		return nil // 已点赞，幂等
	}

	// 创建点赞记录
	like := &model.ReviewLike{
		ReviewID: reviewID,
		UserID:   userID,
	}
	if err := s.reviewRepo.CreateLike(ctx, like); err != nil {
		return err
	}

	// 增加点赞数
	return s.reviewRepo.IncrementLikes(ctx, reviewID)
}

// UnlikeReview 取消点赞
func (s *ReviewService) UnlikeReview(ctx context.Context, reviewID, userID uuid.UUID) error {
	// 检查是否已点赞
	hasLiked, err := s.reviewRepo.HasLiked(ctx, reviewID, userID)
	if err != nil {
		return err
	}
	if !hasLiked {
		return nil // 未点赞，幂等
	}

	// 删除点赞记录
	if err := s.reviewRepo.DeleteLike(ctx, reviewID, userID); err != nil {
		return err
	}

	// 减少点赞数
	return s.reviewRepo.DecrementLikes(ctx, reviewID)
}
