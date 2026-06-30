package repository

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrUserNotFound   = errors.New("user not found")
	ErrEmailExists    = errors.New("email already exists")
	ErrUsernameExists = errors.New("username already exists")
)

// UserRepository 用户数据访问层
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository 创建用户仓库
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create 创建用户
func (r *UserRepository) Create(ctx context.Context, user *model.User) error {
	// 检查邮箱是否已存在
	var count int64
	r.db.WithContext(ctx).Model(&model.User{}).Where("email = ?", user.Email).Count(&count)
	if count > 0 {
		return ErrEmailExists
	}

	// 检查用户名是否已存在
	if user.Username != nil && *user.Username != "" {
		r.db.WithContext(ctx).Model(&model.User{}).Where("username = ?", *user.Username).Count(&count)
		if count > 0 {
			return ErrUsernameExists
		}
	}

	return r.db.WithContext(ctx).Create(user).Error
}

// GetByID 根据ID获取用户
func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	var user model.User
	if err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// GetByEmail 根据邮箱获取用户
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	var user model.User
	if err := r.db.WithContext(ctx).First(&user, "email = ?", email).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// GetByUsername 根据用户名获取用户
func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*model.User, error) {
	var user model.User
	if err := r.db.WithContext(ctx).First(&user, "username = ?", username).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// Update 更新用户信息
func (r *UserRepository) Update(ctx context.Context, user *model.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

// Delete 删除用户
func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.User{}, "id = ?", id).Error
}

// ActiveReaderStat 活跃读者统计
type ActiveReaderStat struct {
	UserID      uuid.UUID `json:"user_id"`
	PublicNotes int64     `json:"public_notes"`
	Reviews     int64     `json:"reviews"`
	TotalLikes  int64     `json:"total_likes"`
}

// ListActiveReaders 按段评/书评活跃度排序的读者
func (r *UserRepository) ListActiveReaders(ctx context.Context, limit int) ([]ActiveReaderStat, error) {
	if limit < 1 || limit > 50 {
		limit = 10
	}
	var stats []ActiveReaderStat
	err := r.db.WithContext(ctx).Raw(`
		SELECT p.id AS user_id,
		       COALESCE(n.note_count, 0) AS public_notes,
		       COALESCE(rv.review_count, 0) AS reviews,
		       COALESCE(n.total_likes, 0) + COALESCE(rv.total_likes, 0) AS total_likes
		FROM profiles p
		LEFT JOIN (
			SELECT user_id, COUNT(*) AS note_count, COALESCE(SUM(likes), 0) AS total_likes
			FROM notes WHERE is_public = true AND deleted_at IS NULL
			GROUP BY user_id
		) n ON n.user_id = p.id
		LEFT JOIN (
			SELECT user_id, COUNT(*) AS review_count, COALESCE(SUM(likes), 0) AS total_likes
			FROM reviews WHERE deleted_at IS NULL
			GROUP BY user_id
		) rv ON rv.user_id = p.id
		WHERE COALESCE(n.note_count, 0) + COALESCE(rv.review_count, 0) > 0
		ORDER BY total_likes DESC, public_notes DESC
		LIMIT ?
	`, limit).Scan(&stats).Error
	return stats, err
}
