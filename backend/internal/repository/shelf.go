package repository

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrShelfItemNotFound = errors.New("shelf item not found")

// ShelfRepository 书架数据访问层
type ShelfRepository struct {
	db *gorm.DB
}

// NewShelfRepository 创建书架仓库
func NewShelfRepository(db *gorm.DB) *ShelfRepository {
	return &ShelfRepository{db: db}
}

// Add 加入书架（已存在则忽略）
func (r *ShelfRepository) Add(ctx context.Context, userID, bookID uuid.UUID) error {
	item := &model.ShelfItem{
		UserID: userID,
		BookID: bookID,
	}
	return r.db.WithContext(ctx).
		Where("user_id = ? AND book_id = ?", userID, bookID).
		FirstOrCreate(item).Error
}

// Remove 移出书架
func (r *ShelfRepository) Remove(ctx context.Context, userID, bookID uuid.UUID) error {
	result := r.db.WithContext(ctx).
		Where("user_id = ? AND book_id = ?", userID, bookID).
		Delete(&model.ShelfItem{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrShelfItemNotFound
	}
	return nil
}

// Exists 是否在书架中
func (r *ShelfRepository) Exists(ctx context.Context, userID, bookID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&model.ShelfItem{}).
		Where("user_id = ? AND book_id = ?", userID, bookID).
		Count(&count).Error
	return count > 0, err
}

// ListByUser 分页获取用户书架
func (r *ShelfRepository) ListByUser(ctx context.Context, userID uuid.UUID, search string, offset, limit int) ([]model.ShelfItem, int64, error) {
	var items []model.ShelfItem
	var total int64

	query := r.db.WithContext(ctx).
		Model(&model.ShelfItem{}).
		Joins("JOIN books ON books.id = shelf_items.book_id AND books.deleted_at IS NULL AND books.status = ?", model.BookStatusPublished).
		Where("shelf_items.user_id = ?", userID)

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("books.title ILIKE ? OR books.author ILIKE ?", like, like)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	listQuery := r.db.WithContext(ctx).
		Preload("Book").
		Joins("JOIN books ON books.id = shelf_items.book_id AND books.deleted_at IS NULL AND books.status = ?", model.BookStatusPublished).
		Where("shelf_items.user_id = ?", userID).
		Order("shelf_items.created_at DESC").
		Offset(offset).
		Limit(limit)

	if search != "" {
		like := "%" + search + "%"
		listQuery = listQuery.Where("books.title ILIKE ? OR books.author ILIKE ?", like, like)
	}

	if err := listQuery.Find(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

// ListBookIDsByUser 获取用户书架中的书籍 ID
func (r *ShelfRepository) ListBookIDsByUser(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	var bookIDs []uuid.UUID
	err := r.db.WithContext(ctx).
		Model(&model.ShelfItem{}).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Pluck("book_id", &bookIDs).Error
	return bookIDs, err
}
