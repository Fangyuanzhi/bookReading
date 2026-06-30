package service

import (
	"context"
	"errors"
	"sort"
	"time"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/google/uuid"
)

var ErrUserNotFound = errors.New("user not found")

// SocialService 轻社交服务
type SocialService struct {
	followRepo *repository.FollowRepository
	userRepo   *repository.UserRepository
	noteRepo   *repository.NoteRepository
	reviewRepo *repository.ReviewRepository
}

// NewSocialService 创建轻社交服务
func NewSocialService(
	followRepo *repository.FollowRepository,
	userRepo *repository.UserRepository,
	noteRepo *repository.NoteRepository,
	reviewRepo *repository.ReviewRepository,
) *SocialService {
	return &SocialService{
		followRepo: followRepo,
		userRepo:   userRepo,
		noteRepo:   noteRepo,
		reviewRepo: reviewRepo,
	}
}

// UserSocialStats 用户社交统计
type UserSocialStats struct {
	Followers   int64 `json:"followers"`
	Following   int64 `json:"following"`
	PublicNotes int64 `json:"public_notes"`
	Reviews     int64 `json:"reviews"`
}

// UserProfileResponse 用户公开主页
type UserProfileResponse struct {
	User          model.UserResponse `json:"user"`
	Stats         UserSocialStats    `json:"stats"`
	IsFollowing   bool               `json:"is_following"`
	IsSelf        bool               `json:"is_self"`
	RecentNotes   []model.Note       `json:"recent_notes"`
	RecentReviews []model.Review     `json:"recent_reviews"`
}

// UserSummary 用户摘要（列表用）
type UserSummary struct {
	User        model.UserResponse `json:"user"`
	IsFollowing bool               `json:"is_following,omitempty"`
}

// FeedItem 动态流条目
type FeedItem struct {
	Type      string         `json:"type"`
	CreatedAt time.Time      `json:"created_at"`
	Note      *model.Note    `json:"note,omitempty"`
	Review    *model.Review  `json:"review,omitempty"`
}

// Follow 关注用户
func (s *SocialService) Follow(ctx context.Context, followerID, followingID uuid.UUID) error {
	if _, err := s.userRepo.GetByID(ctx, followingID); err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return ErrUserNotFound
		}
		return err
	}
	return s.followRepo.Follow(ctx, followerID, followingID)
}

// Unfollow 取消关注
func (s *SocialService) Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error {
	return s.followRepo.Unfollow(ctx, followerID, followingID)
}

// IsFollowing 是否已关注
func (s *SocialService) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	return s.followRepo.IsFollowing(ctx, followerID, followingID)
}

// GetProfile 获取用户公开主页
func (s *SocialService) GetProfile(ctx context.Context, userID uuid.UUID, viewerID *uuid.UUID) (*UserProfileResponse, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	stats, err := s.buildStats(ctx, userID)
	if err != nil {
		return nil, err
	}

	notes, err := s.noteRepo.ListPublicByUser(ctx, userID, 0, 10)
	if err != nil {
		return nil, err
	}
	reviews, err := s.reviewRepo.ListPublicByUser(ctx, userID, 0, 10)
	if err != nil {
		return nil, err
	}

	resp := &UserProfileResponse{
		User:          user.ToResponse(),
		Stats:         stats,
		RecentNotes:   notes,
		RecentReviews: reviews,
	}

	if viewerID != nil {
		resp.IsSelf = *viewerID == userID
		if !resp.IsSelf {
			following, err := s.followRepo.IsFollowing(ctx, *viewerID, userID)
			if err != nil {
				return nil, err
			}
			resp.IsFollowing = following
		}
	}

	return resp, nil
}

// ListFollowers 粉丝列表
func (s *SocialService) ListFollowers(ctx context.Context, userID uuid.UUID, viewerID *uuid.UUID, page, pageSize int) ([]UserSummary, int64, error) {
	offset, limit := paginate(page, pageSize)
	users, total, err := s.followRepo.ListFollowers(ctx, userID, offset, limit)
	if err != nil {
		return nil, 0, err
	}
	summaries, _, err := s.toUserSummaries(ctx, users, viewerID)
	return summaries, total, err
}

// ListFollowing 关注列表
func (s *SocialService) ListFollowing(ctx context.Context, userID uuid.UUID, viewerID *uuid.UUID, page, pageSize int) ([]UserSummary, int64, error) {
	offset, limit := paginate(page, pageSize)
	users, total, err := s.followRepo.ListFollowing(ctx, userID, offset, limit)
	if err != nil {
		return nil, 0, err
	}
	summaries, _, err := s.toUserSummaries(ctx, users, viewerID)
	return summaries, total, err
}

// GetFeed 关注动态流
func (s *SocialService) GetFeed(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]FeedItem, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 20
	}

	followingIDs, err := s.followRepo.ListFollowingIDs(ctx, userID)
	if err != nil {
		return nil, 0, err
	}
	if len(followingIDs) == 0 {
		return []FeedItem{}, 0, nil
	}

	fetchLimit := page * pageSize * 2
	if fetchLimit > 200 {
		fetchLimit = 200
	}

	notes, err := s.noteRepo.ListRecentByUserIDs(ctx, followingIDs, fetchLimit)
	if err != nil {
		return nil, 0, err
	}
	reviews, err := s.reviewRepo.ListRecentByUserIDs(ctx, followingIDs, fetchLimit)
	if err != nil {
		return nil, 0, err
	}

	items := make([]FeedItem, 0, len(notes)+len(reviews))
	for i := range notes {
		n := notes[i]
		items = append(items, FeedItem{
			Type:      "note",
			CreatedAt: n.CreatedAt,
			Note:      &n,
		})
	}
	for i := range reviews {
		r := reviews[i]
		items = append(items, FeedItem{
			Type:      "review",
			CreatedAt: r.CreatedAt,
			Review:    &r,
		})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].CreatedAt.After(items[j].CreatedAt)
	})

	total := int64(len(items))
	offset := (page - 1) * pageSize
	if offset >= len(items) {
		return []FeedItem{}, total, nil
	}
	end := offset + pageSize
	if end > len(items) {
		end = len(items)
	}

	return items[offset:end], total, nil
}

func (s *SocialService) buildStats(ctx context.Context, userID uuid.UUID) (UserSocialStats, error) {
	stats := UserSocialStats{}
	var err error

	stats.Followers, err = s.followRepo.CountFollowers(ctx, userID)
	if err != nil {
		return stats, err
	}
	stats.Following, err = s.followRepo.CountFollowing(ctx, userID)
	if err != nil {
		return stats, err
	}
	stats.PublicNotes, err = s.noteRepo.CountPublicByUser(ctx, userID)
	if err != nil {
		return stats, err
	}
	stats.Reviews, err = s.reviewRepo.CountByUser(ctx, userID)
	if err != nil {
		return stats, err
	}
	return stats, nil
}

func (s *SocialService) toUserSummaries(ctx context.Context, users []model.User, viewerID *uuid.UUID) ([]UserSummary, int64, error) {
	summaries := make([]UserSummary, 0, len(users))
	for _, u := range users {
		item := UserSummary{User: u.ToResponse()}
		if viewerID != nil && *viewerID != u.ID {
			following, err := s.followRepo.IsFollowing(ctx, *viewerID, u.ID)
			if err != nil {
				return nil, 0, err
			}
			item.IsFollowing = following
		}
		summaries = append(summaries, item)
	}
	return summaries, int64(len(summaries)), nil
}

func paginate(page, pageSize int) (offset, limit int) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 20
	}
	return (page - 1) * pageSize, pageSize
}
