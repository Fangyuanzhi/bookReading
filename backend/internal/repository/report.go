package repository

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrReportDuplicate = errors.New("already reported")

// ReportRepository 举报数据访问层
type ReportRepository struct {
	db *gorm.DB
}

func NewReportRepository(db *gorm.DB) *ReportRepository {
	return &ReportRepository{db: db}
}

func (r *ReportRepository) Create(ctx context.Context, report *model.Report) error {
	return r.db.WithContext(ctx).Create(report).Error
}

func (r *ReportRepository) ExistsByReporterAndTarget(
	ctx context.Context,
	reporterID uuid.UUID,
	targetType model.ReportTargetType,
	targetID uuid.UUID,
) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Report{}).
		Where("reporter_id = ? AND target_type = ? AND target_id = ? AND status = ?",
			reporterID, targetType, targetID, model.ReportStatusPending).
		Count(&count).Error
	return count > 0, err
}

func (r *ReportRepository) CountPendingByTarget(
	ctx context.Context,
	targetType model.ReportTargetType,
	targetID uuid.UUID,
) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Report{}).
		Where("target_type = ? AND target_id = ? AND status = ?",
			targetType, targetID, model.ReportStatusPending).
		Count(&count).Error
	return count, err
}

func (r *ReportRepository) ResolveByTarget(
	ctx context.Context,
	targetType model.ReportTargetType,
	targetID uuid.UUID,
) error {
	return r.db.WithContext(ctx).Model(&model.Report{}).
		Where("target_type = ? AND target_id = ? AND status = ?",
			targetType, targetID, model.ReportStatusPending).
		Update("status", model.ReportStatusResolved).Error
}
