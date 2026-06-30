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

// ProgressHandler 阅读进度处理器
type ProgressHandler struct {
	progressService *service.ProgressService
}

// NewProgressHandler 创建阅读进度处理器
func NewProgressHandler(progressService *service.ProgressService) *ProgressHandler {
	return &ProgressHandler{progressService: progressService}
}

// ListRecent 获取最近阅读
// @Summary 获取最近阅读
// @Tags reading
// @Produce json
// @Security Bearer
// @Param limit query int false "条数，默认 10"
// @Success 200 {object} response.Response
// @Router /reading/progress [get]
func (h *ProgressHandler) ListRecent(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	items, err := h.progressService.ListRecent(c.Request.Context(), userID, limit)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{"items": items})
}

// GetBookProgress 获取某本书阅读进度
// @Summary 获取书籍阅读进度
// @Tags reading
// @Produce json
// @Security Bearer
// @Param id path string true "书籍ID"
// @Success 200 {object} response.Response
// @Router /books/{id}/progress [get]
func (h *ProgressHandler) GetBookProgress(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	bookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid book id")
		return
	}

	progress, err := h.progressService.GetProgress(c.Request.Context(), userID, bookID)
	if err != nil {
		if errors.Is(err, repository.ErrProgressNotFound) {
			response.Success(c, nil)
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, progress)
}

// SaveBookProgress 保存书籍阅读进度
// @Summary 保存书籍阅读进度
// @Tags reading
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "书籍ID"
// @Param request body service.SaveProgressRequest true "进度"
// @Success 200 {object} response.Response
// @Router /books/{id}/progress [put]
func (h *ProgressHandler) SaveBookProgress(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	bookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid book id")
		return
	}

	var req service.SaveProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	progress, err := h.progressService.SaveProgress(c.Request.Context(), userID, bookID, req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, progress)
}
