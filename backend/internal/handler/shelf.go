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

// ShelfHandler 书架处理器
type ShelfHandler struct {
	shelfService *service.ShelfService
}

// NewShelfHandler 创建书架处理器
func NewShelfHandler(shelfService *service.ShelfService) *ShelfHandler {
	return &ShelfHandler{shelfService: shelfService}
}

// List 获取书架列表
func (h *ShelfHandler) List(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("q")

	items, total, err := h.shelfService.List(c.Request.Context(), userID, search, page, pageSize)
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

// Add 加入书架
func (h *ShelfHandler) Add(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	var req service.AddShelfRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	if err := h.shelfService.Add(c.Request.Context(), userID, req.BookID); err != nil {
		if errors.Is(err, service.ErrShelfBookNotFound) {
			response.NotFound(c, "book not found")
			return
		}
		if errors.Is(err, service.ErrShelfBookNotPublished) {
			response.BadRequest(c, "只能收藏已发布的书籍")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{"in_shelf": true})
}

// Remove 移出书架
func (h *ShelfHandler) Remove(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	bookID, err := uuid.Parse(c.Param("bookId"))
	if err != nil {
		response.BadRequest(c, "invalid book id")
		return
	}

	if err := h.shelfService.Remove(c.Request.Context(), userID, bookID); err != nil {
		if errors.Is(err, repository.ErrShelfItemNotFound) {
			response.NotFound(c, "not in shelf")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{"in_shelf": false})
}

// Status 查询是否在书架
func (h *ShelfHandler) Status(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	bookID, err := uuid.Parse(c.Param("bookId"))
	if err != nil {
		response.BadRequest(c, "invalid book id")
		return
	}

	inShelf, err := h.shelfService.Status(c.Request.Context(), userID, bookID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{"in_shelf": inShelf})
}
