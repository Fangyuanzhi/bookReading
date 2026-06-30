package handler

import (
	"errors"
	"strconv"

	"github.com/fangyuanzhi/bookreading-backend/internal/middleware"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/fangyuanzhi/bookreading-backend/internal/service"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SocialHandler 轻社交处理器
type SocialHandler struct {
	socialService *service.SocialService
}

// NewSocialHandler 创建轻社交处理器
func NewSocialHandler(socialService *service.SocialService) *SocialHandler {
	return &SocialHandler{socialService: socialService}
}

// GetProfile 用户公开主页
func (h *SocialHandler) GetProfile(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	var viewerID *uuid.UUID
	if id, err := middleware.GetCurrentUserIDOptional(c); err == nil {
		viewerID = &id
	}

	profile, err := h.socialService.GetProfile(c.Request.Context(), userID, viewerID)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			response.NotFound(c, "user not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, profile)
}

// Follow 关注用户
func (h *SocialHandler) Follow(c *gin.Context) {
	followerID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	followingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	if err := h.socialService.Follow(c.Request.Context(), followerID, followingID); err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			response.NotFound(c, "user not found")
			return
		}
		if errors.Is(err, repository.ErrCannotFollowSelf) {
			response.BadRequest(c, "不能关注自己")
			return
		}
		if errors.Is(err, repository.ErrAlreadyFollowing) {
			response.Success(c, gin.H{"is_following": true})
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{"is_following": true})
}

// Unfollow 取消关注
func (h *SocialHandler) Unfollow(c *gin.Context) {
	followerID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	followingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	if err := h.socialService.Unfollow(c.Request.Context(), followerID, followingID); err != nil {
		if errors.Is(err, repository.ErrFollowNotFound) {
			response.Success(c, gin.H{"is_following": false})
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{"is_following": false})
}

// FollowStatus 关注状态
func (h *SocialHandler) FollowStatus(c *gin.Context) {
	followerID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	followingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	isFollowing, err := h.socialService.IsFollowing(c.Request.Context(), followerID, followingID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{"is_following": isFollowing})
}

// ListFollowers 粉丝列表
func (h *SocialHandler) ListFollowers(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	var viewerID *uuid.UUID
	if id, err := middleware.GetCurrentUserIDOptional(c); err == nil {
		viewerID = &id
	}

	users, total, err := h.socialService.ListFollowers(c.Request.Context(), userID, viewerID, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"users": users,
		"total": total,
		"page":  page,
	})
}

// ListFollowing 关注列表
func (h *SocialHandler) ListFollowing(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	var viewerID *uuid.UUID
	if id, err := middleware.GetCurrentUserIDOptional(c); err == nil {
		viewerID = &id
	}

	users, total, err := h.socialService.ListFollowing(c.Request.Context(), userID, viewerID, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"users": users,
		"total": total,
		"page":  page,
	})
}

// Feed 关注动态流
func (h *SocialHandler) Feed(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	items, total, err := h.socialService.GetFeed(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"items": items,
		"total": total,
		"page":  page,
	})
}
