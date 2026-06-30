package repository

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrProgressNotFound = errors.New("reading progress not found")

// ProgressRepository 阅读进度数据访问层
type ProgressRepository struct {
	db *gorm.DB
}

// NewProgressRepository 创建阅读进度仓库
func NewProgressRepository(db *gorm.DB) *ProgressRepository {
	return &ProgressRepository{db: db}
}

// Upsert 创建或更新阅读进度
func (r *ProgressRepository) Upsert(ctx context.Context, progress *model.ReadingProgress) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "book_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"chapter_id", "cfi", "updated_at"}),
	}).Create(progress).Error
}

// GetByUserAndBook 获取某本书的阅读进度
func (r *ProgressRepository) GetByUserAndBook(ctx context.Context, userID, bookID uuid.UUID) (*model.ReadingProgress, error) {
	var progress model.ReadingProgress
	err := r.db.WithContext(ctx).
		Preload("Book").
		Preload("Chapter").
		Where("user_id = ? AND book_id = ?", userID, bookID).
		First(&progress).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrProgressNotFound
	}
	if err != nil {
		return nil, err
	}
	return &progress, nil
}

// ListByUser 获取用户最近阅读记录（仅已上架书籍）
func (r *ProgressRepository) ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]model.ReadingProgress, error) {
	if limit <= 0 {
		limit = 10
	}
	var items []model.ReadingProgress
	err := r.db.WithContext(ctx).
		Joins("JOIN books ON books.id = reading_progress.book_id AND books.deleted_at IS NULL AND books.status = ?", model.BookStatusPublished).
		Preload("Book").
		Preload("Chapter").
		Where("reading_progress.user_id = ?", userID).
		Order("reading_progress.updated_at DESC").
		Limit(limit).
		Find(&items).Error
	return items, err
}
