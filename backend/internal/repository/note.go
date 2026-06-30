package repository

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrNoteNotFound = errors.New("note not found")
)

// NoteRepository 段评数据访问层
type NoteRepository struct {
	db *gorm.DB
}

// NewNoteRepository 创建段评仓库
func NewNoteRepository(db *gorm.DB) *NoteRepository {
	return &NoteRepository{db: db}
}

// Create 创建段评
func (r *NoteRepository) Create(ctx context.Context, note *model.Note) error {
	return r.db.WithContext(ctx).Create(note).Error
}

// GetByID 根据ID获取段评
func (r *NoteRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Note, error) {
	var note model.Note
	if err := r.db.WithContext(ctx).Preload("User").First(&note, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoteNotFound
		}
		return nil, err
	}
	return &note, nil
}

// ListByChapter 获取章节的段评列表
func (r *NoteRepository) ListByChapter(ctx context.Context, chapterID uuid.UUID, isPublic bool) ([]model.Note, error) {
	var notes []model.Note
	query := r.db.WithContext(ctx).Preload("User").Where("chapter_id = ?", chapterID)
	if isPublic {
		query = query.Where("is_public = ?", true)
	}
	if err := query.Order("created_at DESC").Find(&notes).Error; err != nil {
		return nil, err
	}
	return notes, nil
}

// ListByBook 获取书籍的段评列表
func (r *NoteRepository) ListByBook(ctx context.Context, bookID uuid.UUID, isPublic bool) ([]model.Note, error) {
	var notes []model.Note
	query := r.db.WithContext(ctx).Preload("User").Where("book_id = ?", bookID)
	if isPublic {
		query = query.Where("is_public = ?", true)
	}
	if err := query.Order("created_at DESC").Find(&notes).Error; err != nil {
		return nil, err
	}
	return notes, nil
}

// ListByUser 获取用户的段评列表
func (r *NoteRepository) ListByUser(ctx context.Context, userID uuid.UUID, offset, limit int) ([]model.Note, int64, error) {
	var notes []model.Note
	var total int64

	query := r.db.WithContext(ctx).Model(&model.Note{}).Where("user_id = ?", userID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&notes).Error; err != nil {
		return nil, 0, err
	}

	return notes, total, nil
}

// Update 更新段评
func (r *NoteRepository) Update(ctx context.Context, note *model.Note) error {
	return r.db.WithContext(ctx).Save(note).Error
}

// Delete 删除段评
func (r *NoteRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.Note{}, "id = ?", id).Error
}

// CreateLike 创建点赞
func (r *NoteRepository) CreateLike(ctx context.Context, like *model.NoteLike) error {
	return r.db.WithContext(ctx).Create(like).Error
}

// DeleteLike 取消点赞
func (r *NoteRepository) DeleteLike(ctx context.Context, noteID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.NoteLike{}, "note_id = ? AND user_id = ?", noteID, userID).Error
}

// HasLiked 检查是否已点赞
func (r *NoteRepository) HasLiked(ctx context.Context, noteID, userID uuid.UUID) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&model.NoteLike{}).Where("note_id = ? AND user_id = ?", noteID, userID).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// IncrementLikes 增加点赞数
func (r *NoteRepository) IncrementLikes(ctx context.Context, noteID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&model.Note{}).Where("id = ?", noteID).UpdateColumn("likes", gorm.Expr("likes + 1")).Error
}

// DecrementLikes 减少点赞数
func (r *NoteRepository) DecrementLikes(ctx context.Context, noteID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&model.Note{}).Where("id = ?", noteID).UpdateColumn("likes", gorm.Expr("likes - 1")).Error
}

// SumLikesByUser 统计用户段评收到的总点亮数
func (r *NoteRepository) SumLikesByUser(ctx context.Context, userID uuid.UUID) (int64, error) {
	var total int64
	err := r.db.WithContext(ctx).Model(&model.Note{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(likes), 0)").
		Scan(&total).Error
	return total, err
}

// CountPublicByUser 统计用户公开段评数（仅已发布书籍）
func (r *NoteRepository) CountPublicByUser(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Note{}).
		Joins("JOIN books ON books.id = notes.book_id AND books.status = ? AND books.deleted_at IS NULL", model.BookStatusPublished).
		Where("notes.user_id = ? AND notes.is_public = ?", userID, true).
		Count(&count).Error
	return count, err
}

// ListPublicByUser 获取用户公开段评（仅已发布书籍）
func (r *NoteRepository) ListPublicByUser(ctx context.Context, userID uuid.UUID, offset, limit int) ([]model.Note, error) {
	var notes []model.Note
	err := r.db.WithContext(ctx).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id AND books.status = ? AND books.deleted_at IS NULL", model.BookStatusPublished).
		Where("notes.user_id = ? AND notes.is_public = ?", userID, true).
		Order("notes.created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&notes).Error
	return notes, err
}

// ListRecentByUserIDs 获取关注用户的最新公开段评
func (r *NoteRepository) ListRecentByUserIDs(ctx context.Context, userIDs []uuid.UUID, limit int) ([]model.Note, error) {
	if len(userIDs) == 0 {
		return []model.Note{}, nil
	}
	if limit < 1 || limit > 100 {
		limit = 30
	}
	var notes []model.Note
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id AND books.status = ? AND books.deleted_at IS NULL", model.BookStatusPublished).
		Where("notes.user_id IN ? AND notes.is_public = ?", userIDs, true).
		Order("notes.created_at DESC").
		Limit(limit).
		Find(&notes).Error
	return notes, err
}

// ListHot 热门公开段评（按点亮数）
func (r *NoteRepository) ListHot(ctx context.Context, limit int) ([]model.Note, error) {
	if limit < 1 || limit > 50 {
		limit = 10
	}
	var notes []model.Note
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id AND books.status = ? AND books.deleted_at IS NULL", model.BookStatusPublished).
		Where("notes.is_public = ?", true).
		Order("notes.likes DESC, notes.created_at DESC").
		Limit(limit).
		Find(&notes).Error
	return notes, err
}

// Search 搜索段评
func (r *NoteRepository) Search(ctx context.Context, query string, page, pageSize int) ([]model.Note, int64, error) {
	var notes []model.Note
	var total int64

	q := r.db.WithContext(ctx).Model(&model.Note{}).Where("is_public = ?", true).
		Where("body ILIKE ? OR text_quote ILIKE ?", "%"+query+"%", "%"+query+"%")

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := q.Preload("User").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&notes).Error; err != nil {
		return nil, 0, err
	}

	return notes, total, nil
}
