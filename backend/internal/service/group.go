package service

import (
	"context"
	"errors"
	"time"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrGroupNotFound     = errors.New("group not found")
	ErrAlreadyMember     = errors.New("already a member")
	ErrNotMember         = errors.New("not a member")
	ErrBookNotPublished  = errors.New("book not published")
)

// GroupService 共读小组服务
type GroupService struct {
	groupRepo *repository.GroupRepository
	bookRepo  *repository.BookRepository
}

// NewGroupService 创建共读小组服务
func NewGroupService(groupRepo *repository.GroupRepository, bookRepo *repository.BookRepository) *GroupService {
	return &GroupService{groupRepo: groupRepo, bookRepo: bookRepo}
}

// CreateGroupRequest 创建小组请求
type CreateGroupRequest struct {
	BookID      uuid.UUID `json:"book_id" validate:"required"`
	Name        string    `json:"name" validate:"required,max=100"`
	Description string    `json:"description"`
	Pace        string    `json:"pace"`
}

// CreatePostRequest 创建讨论帖请求
type CreatePostRequest struct {
	Content string `json:"content" validate:"required,max=2000"`
}

// GroupResponse 小组响应
type GroupResponse struct {
	model.ReadingGroup
	MemberCount int  `json:"member_count"`
	IsMember    bool `json:"is_member,omitempty"`
}

// Create 创建共读小组
func (s *GroupService) Create(ctx context.Context, req *CreateGroupRequest, userID uuid.UUID) (*GroupResponse, error) {
	book, err := s.bookRepo.GetByID(ctx, req.BookID)
	if err != nil {
		if errors.Is(err, repository.ErrBookNotFound) {
			return nil, ErrBookNotFound
		}
		return nil, err
	}
	if book.Status != model.BookStatusPublished {
		return nil, ErrBookNotPublished
	}

	group := &model.ReadingGroup{
		BookID:      req.BookID,
		Name:        req.Name,
		Description: req.Description,
		Pace:        req.Pace,
		CreatedBy:   &userID,
	}
	if err := s.groupRepo.Create(ctx, group); err != nil {
		return nil, err
	}

	member := &model.GroupMember{
		GroupID:  group.ID,
		UserID:   userID,
		JoinedAt: time.Now(),
	}
	if err := s.groupRepo.AddMember(ctx, member); err != nil {
		return nil, err
	}

	created, err := s.groupRepo.GetByID(ctx, group.ID)
	if err != nil {
		return nil, err
	}
	return s.toResponse(ctx, created, userID)
}

// Get 获取小组详情
func (s *GroupService) Get(ctx context.Context, id uuid.UUID, viewerID uuid.UUID) (*GroupResponse, error) {
	group, err := s.groupRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrGroupNotFound) {
			return nil, ErrGroupNotFound
		}
		return nil, err
	}
	return s.toResponse(ctx, group, viewerID)
}

// List 获取小组列表
func (s *GroupService) List(ctx context.Context, bookID *uuid.UUID, page, pageSize int, viewerID uuid.UUID) ([]GroupResponse, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	groups, total, err := s.groupRepo.List(ctx, bookID, offset, pageSize)
	if err != nil {
		return nil, 0, err
	}

	result := make([]GroupResponse, len(groups))
	for i := range groups {
		resp, err := s.toResponse(ctx, &groups[i], viewerID)
		if err != nil {
			return nil, 0, err
		}
		result[i] = *resp
	}
	return result, total, nil
}

// ListMine 获取我加入的小组
func (s *GroupService) ListMine(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]GroupResponse, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	groups, total, err := s.groupRepo.ListByUser(ctx, userID, offset, pageSize)
	if err != nil {
		return nil, 0, err
	}

	result := make([]GroupResponse, len(groups))
	for i := range groups {
		resp, err := s.toResponse(ctx, &groups[i], userID)
		if err != nil {
			return nil, 0, err
		}
		result[i] = *resp
	}
	return result, total, nil
}

// Join 加入小组
func (s *GroupService) Join(ctx context.Context, groupID, userID uuid.UUID) error {
	if _, err := s.groupRepo.GetByID(ctx, groupID); err != nil {
		if errors.Is(err, repository.ErrGroupNotFound) {
			return ErrGroupNotFound
		}
		return err
	}

	isMember, err := s.groupRepo.IsMember(ctx, groupID, userID)
	if err != nil {
		return err
	}
	if isMember {
		return ErrAlreadyMember
	}

	return s.groupRepo.AddMember(ctx, &model.GroupMember{
		GroupID:  groupID,
		UserID:   userID,
		JoinedAt: time.Now(),
	})
}

// Leave 退出小组
func (s *GroupService) Leave(ctx context.Context, groupID, userID uuid.UUID) error {
	group, err := s.groupRepo.GetByID(ctx, groupID)
	if err != nil {
		if errors.Is(err, repository.ErrGroupNotFound) {
			return ErrGroupNotFound
		}
		return err
	}

	isMember, err := s.groupRepo.IsMember(ctx, groupID, userID)
	if err != nil {
		return err
	}
	if !isMember {
		return ErrNotMember
	}

	// 创建者退出时，若还有其他成员则允许；若是最后一人则删除小组
	count, err := s.groupRepo.MemberCount(ctx, groupID)
	if err != nil {
		return err
	}
	if count <= 1 {
		return s.groupRepo.Delete(ctx, groupID)
	}

	if group.CreatedBy != nil && *group.CreatedBy == userID {
		return errors.New("创建者需先转让小组或解散后再退出")
	}

	return s.groupRepo.RemoveMember(ctx, groupID, userID)
}

// Delete 解散小组（仅创建者）
func (s *GroupService) Delete(ctx context.Context, groupID, userID uuid.UUID) error {
	group, err := s.groupRepo.GetByID(ctx, groupID)
	if err != nil {
		if errors.Is(err, repository.ErrGroupNotFound) {
			return ErrGroupNotFound
		}
		return err
	}
	if group.CreatedBy == nil || *group.CreatedBy != userID {
		return ErrUnauthorized
	}
	return s.groupRepo.Delete(ctx, groupID)
}

// CreatePost 发表讨论
func (s *GroupService) CreatePost(ctx context.Context, groupID uuid.UUID, req *CreatePostRequest, userID uuid.UUID) (*model.GroupPost, error) {
	isMember, err := s.groupRepo.IsMember(ctx, groupID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrNotMember
	}

	post := &model.GroupPost{
		GroupID: groupID,
		UserID:  userID,
		Content: req.Content,
	}
	if err := s.groupRepo.CreatePost(ctx, post); err != nil {
		return nil, err
	}
	return post, nil
}

// ListPosts 获取讨论列表
func (s *GroupService) ListPosts(ctx context.Context, groupID uuid.UUID, page, pageSize int) ([]model.GroupPost, int64, error) {
	if _, err := s.groupRepo.GetByID(ctx, groupID); err != nil {
		if errors.Is(err, repository.ErrGroupNotFound) {
			return nil, 0, ErrGroupNotFound
		}
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}
	offset := (page - 1) * pageSize
	return s.groupRepo.ListPosts(ctx, groupID, offset, pageSize)
}

func (s *GroupService) toResponse(ctx context.Context, group *model.ReadingGroup, viewerID uuid.UUID) (*GroupResponse, error) {
	count, err := s.groupRepo.MemberCount(ctx, group.ID)
	if err != nil {
		return nil, err
	}
	resp := &GroupResponse{
		ReadingGroup: *group,
		MemberCount:  int(count),
	}
	if viewerID != uuid.Nil {
		isMember, err := s.groupRepo.IsMember(ctx, group.ID, viewerID)
		if err != nil {
			return nil, err
		}
		resp.IsMember = isMember
	}
	return resp, nil
}
