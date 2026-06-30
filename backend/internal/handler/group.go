package handler

import (
	"errors"
	"strconv"

	"github.com/fangyuanzhi/bookreading-backend/internal/middleware"
	"github.com/fangyuanzhi/bookreading-backend/internal/service"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GroupHandler 共读小组处理器
type GroupHandler struct {
	groupService *service.GroupService
}

// NewGroupHandler 创建共读小组处理器
func NewGroupHandler(groupService *service.GroupService) *GroupHandler {
	return &GroupHandler{groupService: groupService}
}

func viewerIDFromContext(c *gin.Context) uuid.UUID {
	if userIDStr, exists := c.Get("userID"); exists {
		id, _ := uuid.Parse(userIDStr.(string))
		return id
	}
	return uuid.Nil
}

// Create 创建共读小组
func (h *GroupHandler) Create(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	var req service.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	group, err := h.groupService.Create(c.Request.Context(), &req, userID)
	if err != nil {
		if errors.Is(err, service.ErrBookNotFound) {
			response.NotFound(c, "book not found")
			return
		}
		if errors.Is(err, service.ErrBookNotPublished) {
			response.BadRequest(c, "只能为已发布的书籍创建共读小组")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, group)
}

// List 获取小组列表
func (h *GroupHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	var bookID *uuid.UUID
	if bookIDStr := c.Query("book_id"); bookIDStr != "" {
		id, err := uuid.Parse(bookIDStr)
		if err != nil {
			response.BadRequest(c, "invalid book_id")
			return
		}
		bookID = &id
	}

	groups, total, err := h.groupService.List(c.Request.Context(), bookID, page, pageSize, viewerIDFromContext(c))
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"groups": groups,
		"total":  total,
		"page":   page,
	})
}

// ListMine 我加入的小组
func (h *GroupHandler) ListMine(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	groups, total, err := h.groupService.ListMine(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"groups": groups,
		"total":  total,
		"page":   page,
	})
}

// Get 获取小组详情
func (h *GroupHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	group, err := h.groupService.Get(c.Request.Context(), id, viewerIDFromContext(c))
	if err != nil {
		if errors.Is(err, service.ErrGroupNotFound) {
			response.NotFound(c, "group not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, group)
}

// Join 加入小组
func (h *GroupHandler) Join(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	if err := h.groupService.Join(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, service.ErrGroupNotFound) {
			response.NotFound(c, "group not found")
			return
		}
		if errors.Is(err, service.ErrAlreadyMember) {
			response.BadRequest(c, "already a member")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Leave 退出小组
func (h *GroupHandler) Leave(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	if err := h.groupService.Leave(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, service.ErrGroupNotFound) {
			response.NotFound(c, "group not found")
			return
		}
		if errors.Is(err, service.ErrNotMember) {
			response.BadRequest(c, "not a member")
			return
		}
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Delete 解散小组
func (h *GroupHandler) Delete(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	if err := h.groupService.Delete(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, service.ErrGroupNotFound) {
			response.NotFound(c, "group not found")
			return
		}
		if errors.Is(err, service.ErrUnauthorized) {
			response.Forbidden(c, "unauthorized")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// CreatePost 发表讨论
func (h *GroupHandler) CreatePost(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	var req service.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	post, err := h.groupService.CreatePost(c.Request.Context(), id, &req, userID)
	if err != nil {
		if errors.Is(err, service.ErrGroupNotFound) {
			response.NotFound(c, "group not found")
			return
		}
		if errors.Is(err, service.ErrNotMember) {
			response.Forbidden(c, "not a member")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, post)
}

// ListPosts 获取讨论列表
func (h *GroupHandler) ListPosts(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid group id")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	posts, total, err := h.groupService.ListPosts(c.Request.Context(), id, page, pageSize)
	if err != nil {
		if errors.Is(err, service.ErrGroupNotFound) {
			response.NotFound(c, "group not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"posts": posts,
		"total": total,
		"page":  page,
	})
}
