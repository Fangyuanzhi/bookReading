package service

import (
	"context"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/google/uuid"
)

// DiscoverService 发现页服务
type DiscoverService struct {
	bookRepo     *repository.BookRepository
	noteRepo     *repository.NoteRepository
	reviewRepo   *repository.ReviewRepository
	userRepo     *repository.UserRepository
	groupRepo    *repository.GroupRepository
	recommendSvc *RecommendService
}

// NewDiscoverService 创建发现页服务
func NewDiscoverService(
	bookRepo *repository.BookRepository,
	noteRepo *repository.NoteRepository,
	reviewRepo *repository.ReviewRepository,
	userRepo *repository.UserRepository,
	groupRepo *repository.GroupRepository,
	recommendSvc *RecommendService,
) *DiscoverService {
	return &DiscoverService{
		bookRepo:     bookRepo,
		noteRepo:     noteRepo,
		reviewRepo:   reviewRepo,
		userRepo:     userRepo,
		groupRepo:    groupRepo,
		recommendSvc: recommendSvc,
	}
}

// ActiveReader 活跃读者
type ActiveReader struct {
	User        model.UserResponse `json:"user"`
	PublicNotes int64              `json:"public_notes"`
	Reviews     int64              `json:"reviews"`
	TotalLikes  int64              `json:"total_likes"`
}

// HotGroup 热门共读小组摘要
type HotGroup struct {
	model.ReadingGroup
	MemberCount int `json:"member_count"`
}

// DiscoverFeed 发现页聚合数据
type DiscoverFeed struct {
	HotNotes      []model.Note   `json:"hot_notes"`
	HotReviews    []model.Review `json:"hot_reviews"`
	NewBooks      []model.Book   `json:"new_books"`
	OriginalBooks []model.Book   `json:"original_books"`
	ActiveReaders []ActiveReader `json:"active_readers"`
	DailyPicks    []model.Book   `json:"daily_picks"`
	HotGroups     []HotGroup     `json:"hot_groups"`
}

// GetFeed 获取发现页内容
func (s *DiscoverService) GetFeed(ctx context.Context, userID uuid.UUID) (*DiscoverFeed, error) {
	feed := &DiscoverFeed{}

	hotNotes, err := s.noteRepo.ListHot(ctx, 8)
	if err != nil {
		return nil, err
	}
	feed.HotNotes = hotNotes

	hotReviews, err := s.reviewRepo.ListHot(ctx, 6)
	if err != nil {
		return nil, err
	}
	feed.HotReviews = hotReviews

	newBooks, _, err := s.bookRepo.List(ctx, 0, 6, "", "")
	if err != nil {
		return nil, err
	}
	feed.NewBooks = newBooks

	originalBooks, _, err := s.bookRepo.List(ctx, 0, 6, "", "original")
	if err != nil {
		return nil, err
	}
	feed.OriginalBooks = originalBooks

	stats, err := s.userRepo.ListActiveReaders(ctx, 8)
	if err != nil {
		return nil, err
	}
	feed.ActiveReaders = make([]ActiveReader, 0, len(stats))
	for _, stat := range stats {
		user, err := s.userRepo.GetByID(ctx, stat.UserID)
		if err != nil {
			continue
		}
		feed.ActiveReaders = append(feed.ActiveReaders, ActiveReader{
			User:        user.ToResponse(),
			PublicNotes: stat.PublicNotes,
			Reviews:     stat.Reviews,
			TotalLikes:  stat.TotalLikes,
		})
	}

	if s.groupRepo != nil {
		groups, err := s.groupRepo.ListHot(ctx, 6)
		if err != nil {
			return nil, err
		}
		feed.HotGroups = make([]HotGroup, 0, len(groups))
		for i := range groups {
			count, err := s.groupRepo.MemberCount(ctx, groups[i].ID)
			if err != nil {
				continue
			}
			feed.HotGroups = append(feed.HotGroups, HotGroup{
				ReadingGroup: groups[i],
				MemberCount:  int(count),
			})
		}
	}

	if s.recommendSvc != nil {
		daily, err := s.recommendSvc.GetDailyRecommend(ctx, userID)
		if err == nil && daily != nil {
			feed.DailyPicks = daily.Books
		}
	}

	return feed, nil
}
