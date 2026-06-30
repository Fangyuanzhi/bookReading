package repository

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrReviewNotFound = errors.New("review not found")
)

// ReviewRepository 书评数据访问层
type ReviewRepository struct {
	db *gorm.DB
}

// NewReviewRepository 创建书评仓库
func NewReviewRepository(db *gorm.DB) *ReviewRepository {
	return &ReviewRepository{db: db}
}

// Create 创建书评
func (r *ReviewRepository) Create(ctx context.Context, review *model.Review) error {
	return r.db.WithContext(ctx).Create(review).Error
}

// GetByID 根据ID获取书评
func (r *ReviewRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Review, error) {
	var review model.Review
	if err := r.db.WithContext(ctx).Preload("User").First(&review, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrReviewNotFound
		}
		return nil, err
	}
	return &review, nil
}

// ListByBook 获取书籍的书评列表
func (r *ReviewRepository) ListByBook(ctx context.Context, bookID uuid.UUID, offset, limit int) ([]model.Review, int64, error) {
	var reviews []model.Review
	var total int64

	query := r.db.WithContext(ctx).Model(&model.Review{}).Where("book_id = ? AND chapter_id IS NULL", bookID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Preload("User").Order("created_at DESC").Offset(offset).Limit(limit).Find(&reviews).Error; err != nil {
		return nil, 0, err
	}

	return reviews, total, nil
}

// ListByChapter 获取章节的书评列表
func (r *ReviewRepository) ListByChapter(ctx context.Context, chapterID uuid.UUID, offset, limit int) ([]model.Review, int64, error) {
	var reviews []model.Review
	var total int64

	query := r.db.WithContext(ctx).Model(&model.Review{}).Where("chapter_id = ?", chapterID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Preload("User").Order("created_at DESC").Offset(offset).Limit(limit).Find(&reviews).Error; err != nil {
		return nil, 0, err
	}

	return reviews, total, nil
}

// ListByUser 获取用户的书评列表
func (r *ReviewRepository) ListByUser(ctx context.Context, userID uuid.UUID, offset, limit int) ([]model.Review, int64, error) {
	var reviews []model.Review
	var total int64

	query := r.db.WithContext(ctx).Model(&model.Review{}).Where("user_id = ?", userID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&reviews).Error; err != nil {
		return nil, 0, err
	}

	return reviews, total, nil
}

// Update 更新书评
func (r *ReviewRepository) Update(ctx context.Context, review *model.Review) error {
	return r.db.WithContext(ctx).Save(review).Error
}

// Delete 删除书评
func (r *ReviewRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.Review{}, "id = ?", id).Error
}

// CreateLike 创建点赞
func (r *ReviewRepository) CreateLike(ctx context.Context, like *model.ReviewLike) error {
	return r.db.WithContext(ctx).Create(like).Error
}

// DeleteLike 取消点赞
func (r *ReviewRepository) DeleteLike(ctx context.Context, reviewID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.ReviewLike{}, "review_id = ? AND user_id = ?", reviewID, userID).Error
}

// HasLiked 检查是否已点赞
func (r *ReviewRepository) HasLiked(ctx context.Context, reviewID, userID uuid.UUID) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&model.ReviewLike{}).Where("review_id = ? AND user_id = ?", reviewID, userID).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// IncrementLikes 增加点赞数
func (r *ReviewRepository) IncrementLikes(ctx context.Context, reviewID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&model.Review{}).Where("id = ?", reviewID).UpdateColumn("likes", gorm.Expr("likes + 1")).Error
}

// DecrementLikes 减少点赞数
func (r *ReviewRepository) DecrementLikes(ctx context.Context, reviewID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&model.Review{}).Where("id = ?", reviewID).UpdateColumn("likes", gorm.Expr("likes - 1")).Error
}

// SumLikesByUser 统计用户书评收到的总点亮数
func (r *ReviewRepository) SumLikesByUser(ctx context.Context, userID uuid.UUID) (int64, error) {
	var total int64
	err := r.db.WithContext(ctx).Model(&model.Review{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(likes), 0)").
		Scan(&total).Error
	return total, err
}

// CountByUser 统计用户书评数（仅已发布书籍）
func (r *ReviewRepository) CountByUser(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Review{}).
		Joins("JOIN books ON books.id = reviews.book_id AND books.status = ? AND books.deleted_at IS NULL", model.BookStatusPublished).
		Where("reviews.user_id = ?", userID).
		Count(&count).Error
	return count, err
}

// ListPublicByUser 获取用户书评（仅已发布书籍）
func (r *ReviewRepository) ListPublicByUser(ctx context.Context, userID uuid.UUID, offset, limit int) ([]model.Review, error) {
	var reviews []model.Review
	err := r.db.WithContext(ctx).
		Preload("Book").
		Joins("JOIN books ON books.id = reviews.book_id AND books.status = ? AND books.deleted_at IS NULL", model.BookStatusPublished).
		Where("reviews.user_id = ?", userID).
		Order("reviews.created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&reviews).Error
	return reviews, err
}

// ListRecentByUserIDs 获取关注用户的最新书评
func (r *ReviewRepository) ListRecentByUserIDs(ctx context.Context, userIDs []uuid.UUID, limit int) ([]model.Review, error) {
	if len(userIDs) == 0 {
		return []model.Review{}, nil
	}
	if limit < 1 || limit > 100 {
		limit = 30
	}
	var reviews []model.Review
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Book").
		Joins("JOIN books ON books.id = reviews.book_id AND books.status = ? AND books.deleted_at IS NULL", model.BookStatusPublished).
		Where("reviews.user_id IN ?", userIDs).
		Order("reviews.created_at DESC").
		Limit(limit).
		Find(&reviews).Error
	return reviews, err
}

// ListHot 热门书评（按点亮数）
func (r *ReviewRepository) ListHot(ctx context.Context, limit int) ([]model.Review, error) {
	if limit < 1 || limit > 50 {
		limit = 10
	}
	var reviews []model.Review
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Book").
		Joins("JOIN books ON books.id = reviews.book_id AND books.status = ? AND books.deleted_at IS NULL", model.BookStatusPublished).
		Order("reviews.likes DESC, reviews.created_at DESC").
		Limit(limit).
		Find(&reviews).Error
	return reviews, err
}

// Search 搜索书评
func (r *ReviewRepository) Search(ctx context.Context, query string, page, pageSize int) ([]model.Review, int64, error) {
	var reviews []model.Review
	var total int64

	q := r.db.WithContext(ctx).Model(&model.Review{}).Where("body ILIKE ?", "%"+query+"%")

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := q.Preload("User").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&reviews).Error; err != nil {
		return nil, 0, err
	}

	return reviews, total, nil
}
