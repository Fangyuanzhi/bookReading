package repository

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrBookNotFound = errors.New("book not found")
)

// BookRepository 书籍数据访问层
type BookRepository struct {
	db *gorm.DB
}

// NewBookRepository 创建书籍仓库
func NewBookRepository(db *gorm.DB) *BookRepository {
	return &BookRepository{db: db}
}

// Create 创建书籍
func (r *BookRepository) Create(ctx context.Context, book *model.Book) error {
	return r.db.WithContext(ctx).Create(book).Error
}

// GetByID 根据ID获取书籍
func (r *BookRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Book, error) {
	var book model.Book
	if err := r.db.WithContext(ctx).Preload("Chapters").First(&book, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBookNotFound
		}
		return nil, err
	}
	return &book, nil
}

// List 获取书籍列表
func (r *BookRepository) List(ctx context.Context, offset, limit int, search string, source string) ([]model.Book, int64, error) {
	var books []model.Book
	var total int64

	query := r.db.WithContext(ctx).Model(&model.Book{}).Where("status = ?", model.BookStatusPublished)

	if source != "" {
		query = query.Where("source = ?", source)
	}

	if search != "" {
		query = query.Where("title ILIKE ? OR author ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&books).Error; err != nil {
		return nil, 0, err
	}

	return books, total, nil
}

// Update 更新书籍
func (r *BookRepository) Update(ctx context.Context, book *model.Book) error {
	return r.db.WithContext(ctx).Save(book).Error
}

// UpdateStatus 更新书籍状态（避风港下架）
func (r *BookRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status model.BookStatus) error {
	result := r.db.WithContext(ctx).Model(&model.Book{}).Where("id = ?", id).Update("status", status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrBookNotFound
	}
	return nil
}

// Delete 删除书籍
func (r *BookRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.Book{}, "id = ?", id).Error
}

// CreateChapters 批量创建章节
func (r *BookRepository) CreateChapters(ctx context.Context, chapters []model.Chapter) error {
	return r.db.WithContext(ctx).Create(&chapters).Error
}

// GetChapterByID 根据ID获取章节
func (r *BookRepository) GetChapterByID(ctx context.Context, id uuid.UUID) (*model.Chapter, error) {
	var chapter model.Chapter
	if err := r.db.WithContext(ctx).Preload("Book").First(&chapter, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBookNotFound
		}
		return nil, err
	}
	return &chapter, nil
}

// GetChaptersByBookID 获取书籍的所有章节
func (r *BookRepository) GetChaptersByBookID(ctx context.Context, bookID uuid.UUID) ([]model.Chapter, error) {
	var chapters []model.Chapter
	if err := r.db.WithContext(ctx).Where("book_id = ?", bookID).Order("idx ASC").Find(&chapters).Error; err != nil {
		return nil, err
	}
	return chapters, nil
}

// ListByCreator 获取用户创建的书籍（含草稿）
func (r *BookRepository) ListByCreator(ctx context.Context, userID uuid.UUID, offset, limit int) ([]model.Book, int64, error) {
	var books []model.Book
	var total int64

	query := r.db.WithContext(ctx).Model(&model.Book{}).Where("created_by = ?", userID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := query.Order("updated_at DESC").Offset(offset).Limit(limit).Find(&books).Error; err != nil {
		return nil, 0, err
	}
	return books, total, nil
}

// UpdateChapter 更新章节
func (r *BookRepository) UpdateChapter(ctx context.Context, chapter *model.Chapter) error {
	return r.db.WithContext(ctx).Save(chapter).Error
}

// DeleteChapter 删除章节
func (r *BookRepository) DeleteChapter(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.Chapter{}, "id = ?", id).Error
}

// MaxChapterIdx 获取书籍最大章节序号
func (r *BookRepository) MaxChapterIdx(ctx context.Context, bookID uuid.UUID) (int, error) {
	var maxIdx *int
	if err := r.db.WithContext(ctx).Model(&model.Chapter{}).Where("book_id = ?", bookID).Select("MAX(idx)").Scan(&maxIdx).Error; err != nil {
		return 0, err
	}
	if maxIdx == nil {
		return 0, nil
	}
	return *maxIdx, nil
}
