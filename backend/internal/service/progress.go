package service

import (
	"context"
	"errors"
	"time"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/google/uuid"
)

// ProgressService 阅读进度服务
type ProgressService struct {
	progressRepo *repository.ProgressRepository
	bookRepo     *repository.BookRepository
}

// NewProgressService 创建阅读进度服务
func NewProgressService(progressRepo *repository.ProgressRepository, bookRepo *repository.BookRepository) *ProgressService {
	return &ProgressService{
		progressRepo: progressRepo,
		bookRepo:     bookRepo,
	}
}

// SaveProgressRequest 保存阅读进度请求
type SaveProgressRequest struct {
	ChapterID string `json:"chapter_id" validate:"required,uuid"`
	CFI       string `json:"cfi"`
}

// SaveProgress 保存阅读进度
func (s *ProgressService) SaveProgress(ctx context.Context, userID, bookID uuid.UUID, req SaveProgressRequest) (*model.ReadingProgress, error) {
	chapterID, err := uuid.Parse(req.ChapterID)
	if err != nil {
		return nil, errors.New("invalid chapter id")
	}

	chapter, err := s.bookRepo.GetChapterByID(ctx, chapterID)
	if err != nil {
		return nil, err
	}
	if chapter.BookID != bookID {
		return nil, errors.New("chapter does not belong to book")
	}

	progress := &model.ReadingProgress{
		UserID:    userID,
		BookID:    bookID,
		ChapterID: &chapterID,
		CFI:       req.CFI,
		UpdatedAt: time.Now(),
	}
	if err := s.progressRepo.Upsert(ctx, progress); err != nil {
		return nil, err
	}

	return s.progressRepo.GetByUserAndBook(ctx, userID, bookID)
}

// GetProgress 获取单本书阅读进度
func (s *ProgressService) GetProgress(ctx context.Context, userID, bookID uuid.UUID) (*model.ReadingProgress, error) {
	return s.progressRepo.GetByUserAndBook(ctx, userID, bookID)
}

// ListRecent 获取最近阅读列表
func (s *ProgressService) ListRecent(ctx context.Context, userID uuid.UUID, limit int) ([]model.ReadingProgress, error) {
	return s.progressRepo.ListByUser(ctx, userID, limit)
}
