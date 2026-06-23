package service

import (
	"context"
	"fmt"
	"time"

	"github.com/fangyuanzhi/bookreading-backend/pkg/centrifugo"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// PresenceService 在场服务
type PresenceService struct {
	redisClient      *redis.Client
	centrifugoClient *centrifugo.Client
}

// NewPresenceService 创建在场服务
func NewPresenceService(redisClient *redis.Client, centrifugoClient *centrifugo.Client) *PresenceService {
	return &PresenceService{
		redisClient:      redisClient,
		centrifugoClient: centrifugoClient,
	}
}

// JoinChapter 加入章节阅读
func (s *PresenceService) JoinChapter(ctx context.Context, chapterID, userID uuid.UUID, displayName string) error {
	// 使用 Redis Set 存储当前章节的用户
	key := fmt.Sprintf("chapter:presence:%s", chapterID.String())

	// 添加用户到集合，设置过期时间
	pipe := s.redisClient.Pipeline()
	pipe.SAdd(ctx, key, userID.String())
	pipe.Expire(ctx, key, 5*time.Minute) // 5分钟过期
	_, err := pipe.Exec(ctx)
	if err != nil {
		return err
	}

	// 获取当前人数
	count, err := s.redisClient.SCard(ctx, key).Result()
	if err != nil {
		return err
	}

	// 推送到 Centrifugo
	if s.centrifugoClient != nil {
		channel := centrifugo.GenerateChannelName("chapter", chapterID.String())
		s.centrifugoClient.Publish(channel, map[string]interface{}{
			"type": "presence_update",
			"data": map[string]interface{}{
				"count":       count,
				"user_joined": displayName,
			},
		})
	}

	return nil
}

// LeaveChapter 离开章节
func (s *PresenceService) LeaveChapter(ctx context.Context, chapterID, userID uuid.UUID, displayName string) error {
	key := fmt.Sprintf("chapter:presence:%s", chapterID.String())

	// 从集合中移除用户
	_, err := s.redisClient.SRem(ctx, key, userID.String()).Result()
	if err != nil {
		return err
	}

	// 获取当前人数
	count, err := s.redisClient.SCard(ctx, key).Result()
	if err != nil {
		return err
	}

	// 推送到 Centrifugo
	if s.centrifugoClient != nil {
		channel := centrifugo.GenerateChannelName("chapter", chapterID.String())
		s.centrifugoClient.Publish(channel, map[string]interface{}{
			"type": "presence_update",
			"data": map[string]interface{}{
				"count":     count,
				"user_left": displayName,
			},
		})
	}

	return nil
}

// GetChapterPresence 获取章节的在场人数
func (s *PresenceService) GetChapterPresence(ctx context.Context, chapterID uuid.UUID) (int64, []string, error) {
	key := fmt.Sprintf("chapter:presence:%s", chapterID.String())

	// 获取人数
	count, err := s.redisClient.SCard(ctx, key).Result()
	if err != nil {
		return 0, nil, err
	}

	// 获取用户列表
	members, err := s.redisClient.SMembers(ctx, key).Result()
	if err != nil {
		return 0, nil, err
	}

	return count, members, nil
}

// UpdateReadingProgress 更新阅读进度
func (s *PresenceService) UpdateReadingProgress(ctx context.Context, userID, bookID, chapterID uuid.UUID, cfi string) error {
	// 使用 Redis Hash 存储阅读进度
	key := fmt.Sprintf("reading:progress:%s", userID.String())
	field := fmt.Sprintf("book:%s:chapter", bookID.String())

	data := fmt.Sprintf("%s|%s", chapterID.String(), cfi)
	return s.redisClient.HSet(ctx, key, field, data).Err()
}

// GetReadingProgress 获取阅读进度
func (s *PresenceService) GetReadingProgress(ctx context.Context, userID, bookID uuid.UUID) (string, string, error) {
	key := fmt.Sprintf("reading:progress:%s", userID.String())
	field := fmt.Sprintf("book:%s:chapter", bookID.String())

	data, err := s.redisClient.HGet(ctx, key, field).Result()
	if err == redis.Nil {
		return "", "", nil
	}
	if err != nil {
		return "", "", err
	}

	// 解析 chapterID|cfi
	var chapterID, cfi string
	fmt.Sscanf(data, "%s|%s", &chapterID, &cfi)
	return chapterID, cfi, nil
}

// Heartbeat 心跳保活
func (s *PresenceService) Heartbeat(ctx context.Context, chapterID, userID uuid.UUID) error {
	key := fmt.Sprintf("chapter:presence:%s", chapterID.String())
	return s.redisClient.Expire(ctx, key, 5*time.Minute).Err()
}
