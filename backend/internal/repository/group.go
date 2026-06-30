package repository

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrGroupNotFound = errors.New("group not found")
	ErrGroupPostNotFound = errors.New("group post not found")
)

// GroupRepository 共读小组数据访问层
type GroupRepository struct {
	db *gorm.DB
}

// NewGroupRepository 创建共读小组仓库
func NewGroupRepository(db *gorm.DB) *GroupRepository {
	return &GroupRepository{db: db}
}

// Create 创建小组
func (r *GroupRepository) Create(ctx context.Context, group *model.ReadingGroup) error {
	return r.db.WithContext(ctx).Create(group).Error
}

// GetByID 根据ID获取小组
func (r *GroupRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.ReadingGroup, error) {
	var group model.ReadingGroup
	if err := r.db.WithContext(ctx).
		Preload("Book").
		Preload("Creator").
		Preload("Members.User").
		First(&group, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrGroupNotFound
		}
		return nil, err
	}
	return &group, nil
}

// List 分页获取小组列表
func (r *GroupRepository) List(ctx context.Context, bookID *uuid.UUID, offset, limit int) ([]model.ReadingGroup, int64, error) {
	var groups []model.ReadingGroup
	var total int64

	query := r.db.WithContext(ctx).Model(&model.ReadingGroup{})
	if bookID != nil {
		query = query.Where("book_id = ?", *bookID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Preload("Book").Preload("Creator").
		Order("created_at DESC").Offset(offset).Limit(limit).
		Find(&groups).Error; err != nil {
		return nil, 0, err
	}

	return groups, total, nil
}

// ListHot 热门共读小组（按成员数，仅已发布书籍）
func (r *GroupRepository) ListHot(ctx context.Context, limit int) ([]model.ReadingGroup, error) {
	if limit < 1 || limit > 50 {
		limit = 10
	}
	var groups []model.ReadingGroup
	err := r.db.WithContext(ctx).
		Preload("Book").
		Preload("Creator").
		Joins("JOIN books ON books.id = reading_groups.book_id AND books.status = ? AND books.deleted_at IS NULL", model.BookStatusPublished).
		Order(`(
			SELECT COUNT(*) FROM group_members gm
			WHERE gm.group_id = reading_groups.id
		) DESC, reading_groups.created_at DESC`).
		Limit(limit).
		Find(&groups).Error
	return groups, err
}

// ListByUser 获取用户加入的小组
func (r *GroupRepository) ListByUser(ctx context.Context, userID uuid.UUID, offset, limit int) ([]model.ReadingGroup, int64, error) {
	var groups []model.ReadingGroup
	var total int64

	subQuery := r.db.WithContext(ctx).Model(&model.GroupMember{}).Select("group_id").Where("user_id = ?", userID)
	query := r.db.WithContext(ctx).Model(&model.ReadingGroup{}).Where("id IN (?)", subQuery)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Preload("Book").Preload("Creator").
		Order("created_at DESC").Offset(offset).Limit(limit).
		Find(&groups).Error; err != nil {
		return nil, 0, err
	}

	return groups, total, nil
}

// Delete 删除小组
func (r *GroupRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.ReadingGroup{}, "id = ?", id).Error
}

// AddMember 加入小组
func (r *GroupRepository) AddMember(ctx context.Context, member *model.GroupMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

// RemoveMember 退出小组
func (r *GroupRepository) RemoveMember(ctx context.Context, groupID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("group_id = ? AND user_id = ?", groupID, userID).
		Delete(&model.GroupMember{}).Error
}

// IsMember 是否已是成员
func (r *GroupRepository) IsMember(ctx context.Context, groupID, userID uuid.UUID) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&model.GroupMember{}).
		Where("group_id = ? AND user_id = ?", groupID, userID).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// MemberCount 成员数量
func (r *GroupRepository) MemberCount(ctx context.Context, groupID uuid.UUID) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&model.GroupMember{}).
		Where("group_id = ?", groupID).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// CreatePost 创建讨论帖
func (r *GroupRepository) CreatePost(ctx context.Context, post *model.GroupPost) error {
	if err := r.db.WithContext(ctx).Create(post).Error; err != nil {
		return err
	}
	return r.db.WithContext(ctx).Preload("User").First(post, "id = ?", post.ID).Error
}

// ListPosts 获取小组讨论帖
func (r *GroupRepository) ListPosts(ctx context.Context, groupID uuid.UUID, offset, limit int) ([]model.GroupPost, int64, error) {
	var posts []model.GroupPost
	var total int64

	query := r.db.WithContext(ctx).Model(&model.GroupPost{}).Where("group_id = ?", groupID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := query.Preload("User").Order("created_at ASC").Offset(offset).Limit(limit).Find(&posts).Error; err != nil {
		return nil, 0, err
	}
	return posts, total, nil
}
