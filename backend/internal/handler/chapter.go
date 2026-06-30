package handler

import (
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/middleware"
	"github.com/fangyuanzhi/bookreading-backend/internal/service"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ChapterHandler 章节处理器
type ChapterHandler struct {
	bookService *service.BookService
}

// NewChapterHandler 创建章节处理器
func NewChapterHandler(bookService *service.BookService) *ChapterHandler {
	return &ChapterHandler{bookService: bookService}
}

// Get 获取章节详情
// @Summary 获取章节详情
// @Description 根据ID获取章节详情
// @Tags chapters
// @Accept json
// @Produce json
// @Param id path string true "章节ID"
// @Success 200 {object} response.Response{data=model.Chapter}
// @Failure 404 {object} response.Response
// @Router /chapters/{id} [get]
func (h *ChapterHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid chapter id")
		return
	}

	var viewerID uuid.UUID
	if userIDStr, exists := c.Get("userID"); exists {
		viewerID, _ = uuid.Parse(userIDStr.(string))
	}

	chapter, err := h.bookService.GetChapterForUser(c.Request.Context(), id, viewerID)
	if err != nil {
		var payErr *service.PaymentRequiredDetail
		if errors.As(err, &payErr) {
			response.PaymentRequired(c, "需要购买或开通 VIP 才能阅读", gin.H{
				"book_id":     payErr.BookID.String(),
				"access_type": payErr.AccessType,
				"price":       payErr.Price,
				"reason":      payErr.Reason,
			})
			return
		}
		if errors.Is(err, service.ErrChapterNotFound) {
			response.NotFound(c, "chapter not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, chapter)
}

// Update 更新章节
func (h *ChapterHandler) Update(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid chapter id")
		return
	}

	var req service.UpdateChapterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	chapter, err := h.bookService.UpdateChapter(c.Request.Context(), id, &req, userID)
	if err != nil {
		if errors.Is(err, service.ErrChapterNotFound) {
			response.NotFound(c, "chapter not found")
			return
		}
		if errors.Is(err, service.ErrUnauthorized) {
			response.Forbidden(c, "unauthorized")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, chapter)
}

// Delete 删除章节
func (h *ChapterHandler) Delete(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid chapter id")
		return
	}

	if err := h.bookService.DeleteChapter(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, service.ErrChapterNotFound) {
			response.NotFound(c, "chapter not found")
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
