package service

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/google/uuid"
)

const autoTakedownThreshold = 3

var (
	ErrInvalidReportTarget = errors.New("invalid report target")
	ErrReportDuplicate     = errors.New("you have already reported this content")
)

// ReportService 内容举报服务
type ReportService struct {
	reportRepo *repository.ReportRepository
	bookRepo   *repository.BookRepository
	noteRepo   *repository.NoteRepository
	reviewRepo *repository.ReviewRepository
}

func NewReportService(
	reportRepo *repository.ReportRepository,
	bookRepo *repository.BookRepository,
	noteRepo *repository.NoteRepository,
	reviewRepo *repository.ReviewRepository,
) *ReportService {
	return &ReportService{
		reportRepo: reportRepo,
		bookRepo:   bookRepo,
		noteRepo:   noteRepo,
		reviewRepo: reviewRepo,
	}
}

// CreateReportRequest 创建举报请求
type CreateReportRequest struct {
	TargetType string `json:"target_type" validate:"required,oneof=book note review"`
	TargetID   string `json:"target_id" validate:"required,uuid"`
	Reason     string `json:"reason" validate:"required,oneof=copyright inappropriate spam other"`
	Detail     string `json:"detail"`
}

// CreateReport 提交举报；累计达阈值时自动下架（避风港）
func (s *ReportService) CreateReport(ctx context.Context, reporterID uuid.UUID, req CreateReportRequest) (*model.Report, error) {
	targetType := model.ReportTargetType(req.TargetType)
	targetID, err := uuid.Parse(req.TargetID)
	if err != nil {
		return nil, ErrInvalidReportTarget
	}

	if err := s.validateTarget(ctx, targetType, targetID); err != nil {
		return nil, err
	}

	exists, err := s.reportRepo.ExistsByReporterAndTarget(ctx, reporterID, targetType, targetID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrReportDuplicate
	}

	report := &model.Report{
		ReporterID: reporterID,
		TargetType: targetType,
		TargetID:   targetID,
		Reason:     model.ReportReason(req.Reason),
		Detail:     req.Detail,
		Status:     model.ReportStatusPending,
	}
	if err := s.reportRepo.Create(ctx, report); err != nil {
		return nil, err
	}

	count, err := s.reportRepo.CountPendingByTarget(ctx, targetType, targetID)
	if err != nil {
		return report, nil
	}
	if count >= autoTakedownThreshold {
		_ = s.takedownTarget(ctx, targetType, targetID)
		_ = s.reportRepo.ResolveByTarget(ctx, targetType, targetID)
	}

	return report, nil
}

func (s *ReportService) validateTarget(ctx context.Context, targetType model.ReportTargetType, targetID uuid.UUID) error {
	switch targetType {
	case model.ReportTargetBook:
		_, err := s.bookRepo.GetByID(ctx, targetID)
		return err
	case model.ReportTargetNote:
		_, err := s.noteRepo.GetByID(ctx, targetID)
		return err
	case model.ReportTargetReview:
		_, err := s.reviewRepo.GetByID(ctx, targetID)
		return err
	default:
		return ErrInvalidReportTarget
	}
}

func (s *ReportService) takedownTarget(ctx context.Context, targetType model.ReportTargetType, targetID uuid.UUID) error {
	switch targetType {
	case model.ReportTargetBook:
		return s.bookRepo.UpdateStatus(ctx, targetID, model.BookStatusRemoved)
	case model.ReportTargetNote:
		return s.noteRepo.Delete(ctx, targetID)
	case model.ReportTargetReview:
		return s.reviewRepo.Delete(ctx, targetID)
	default:
		return ErrInvalidReportTarget
	}
}
