package handler

import (
	"errors"

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

	chapter, err := h.bookService.GetChapter(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrChapterNotFound) {
			response.NotFound(c, "chapter not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, chapter)
}
