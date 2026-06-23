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
