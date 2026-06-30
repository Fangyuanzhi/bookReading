package repository

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrFollowNotFound   = errors.New("follow not found")
	ErrAlreadyFollowing = errors.New("already following")
	ErrCannotFollowSelf = errors.New("cannot follow yourself")
)

// FollowRepository 关注关系数据访问层
type FollowRepository struct {
	db *gorm.DB
}

// NewFollowRepository 创建关注仓库
func NewFollowRepository(db *gorm.DB) *FollowRepository {
	return &FollowRepository{db: db}
}

// Follow 关注用户
func (r *FollowRepository) Follow(ctx context.Context, followerID, followingID uuid.UUID) error {
	if followerID == followingID {
		return ErrCannotFollowSelf
	}

	var count int64
	if err := r.db.WithContext(ctx).Model(&model.UserFollow{}).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return ErrAlreadyFollowing
	}

	return r.db.WithContext(ctx).Create(&model.UserFollow{
		FollowerID:  followerID,
		FollowingID: followingID,
	}).Error
}

// Unfollow 取消关注
func (r *FollowRepository) Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error {
	result := r.db.WithContext(ctx).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Delete(&model.UserFollow{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrFollowNotFound
	}
	return nil
}

// IsFollowing 是否已关注
func (r *FollowRepository) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.UserFollow{}).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Count(&count).Error
	return count > 0, err
}

// CountFollowers 粉丝数
func (r *FollowRepository) CountFollowers(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.UserFollow{}).
		Where("following_id = ?", userID).
		Count(&count).Error
	return count, err
}

// CountFollowing 关注数
func (r *FollowRepository) CountFollowing(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.UserFollow{}).
		Where("follower_id = ?", userID).
		Count(&count).Error
	return count, err
}

// ListFollowingIDs 获取用户关注的人 ID 列表
func (r *FollowRepository) ListFollowingIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	err := r.db.WithContext(ctx).Model(&model.UserFollow{}).
		Where("follower_id = ?", userID).
		Order("created_at DESC").
		Pluck("following_id", &ids).Error
	return ids, err
}

// ListFollowers 粉丝列表
func (r *FollowRepository) ListFollowers(ctx context.Context, userID uuid.UUID, offset, limit int) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	base := r.db.WithContext(ctx).Model(&model.UserFollow{}).Where("following_id = ?", userID)
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).
		Table("profiles").
		Joins("JOIN user_follows ON user_follows.follower_id = profiles.id").
		Where("user_follows.following_id = ?", userID).
		Order("user_follows.created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&users).Error
	return users, total, err
}

// ListFollowing 关注列表
func (r *FollowRepository) ListFollowing(ctx context.Context, userID uuid.UUID, offset, limit int) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	base := r.db.WithContext(ctx).Model(&model.UserFollow{}).Where("follower_id = ?", userID)
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).
		Table("profiles").
		Joins("JOIN user_follows ON user_follows.following_id = profiles.id").
		Where("user_follows.follower_id = ?", userID).
		Order("user_follows.created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&users).Error
	return users, total, err
}
