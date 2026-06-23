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

// ReviewHandler 书评处理器
type ReviewHandler struct {
	reviewService *service.ReviewService
}

// NewReviewHandler 创建书评处理器
func NewReviewHandler(reviewService *service.ReviewService) *ReviewHandler {
	return &ReviewHandler{reviewService: reviewService}
}

// Create 创建书评
// @Summary 创建书评
// @Description 创建书评/章末感想
// @Tags reviews
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body service.CreateReviewRequest true "书评信息"
// @Success 200 {object} response.Response{data=model.Review}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Router /reviews [post]
func (h *ReviewHandler) Create(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	var req service.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	review, err := h.reviewService.CreateReview(c.Request.Context(), &req, userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, review)
}

// Get 获取书评详情
// @Summary 获取书评详情
// @Description 根据ID获取书评详情
// @Tags reviews
// @Accept json
// @Produce json
// @Param id path string true "书评ID"
// @Success 200 {object} response.Response{data=service.ReviewResponse}
// @Failure 404 {object} response.Response
// @Router /reviews/{id} [get]
func (h *ReviewHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid review id")
		return
	}

	// 获取当前用户ID（可选）
	var currentUserID uuid.UUID
	if userIDStr, exists := c.Get("userID"); exists {
		currentUserID, _ = uuid.Parse(userIDStr.(string))
	}

	review, err := h.reviewService.GetReview(c.Request.Context(), id, currentUserID)
	if err != nil {
		if errors.Is(err, service.ErrReviewNotFound) {
			response.NotFound(c, "review not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, review)
}

// ListByBook 获取书籍的书评列表
// @Summary 获取书籍的书评列表
// @Description 获取书籍的所有书评（整本书评）
// @Tags reviews
// @Accept json
// @Produce json
// @Param book_id path string true "书籍ID"
// @Param page query int false "页码，默认1"
// @Param page_size query int false "每页数量，默认20"
// @Success 200 {object} response.Response{data=map[string]interface{}}
// @Failure 400 {object} response.Response
// @Router /books/{book_id}/reviews [get]
func (h *ReviewHandler) ListByBook(c *gin.Context) {
	bookID, err := uuid.Parse(c.Param("book_id"))
	if err != nil {
		response.BadRequest(c, "invalid book id")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	reviews, total, err := h.reviewService.ListReviewsByBook(c.Request.Context(), bookID, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"reviews": reviews,
		"total":   total,
		"page":    page,
	})
}

// ListByChapter 获取章节的书评列表
// @Summary 获取章节的书评列表
// @Description 获取章节的所有书评（章末感想）
// @Tags reviews
// @Accept json
// @Produce json
// @Param id path string true "章节ID"
// @Param page query int false "页码，默认1"
// @Param page_size query int false "每页数量，默认20"
// @Success 200 {object} response.Response{data=map[string]interface{}}
// @Failure 400 {object} response.Response
// @Router /chapters/{id}/reviews [get]
func (h *ReviewHandler) ListByChapter(c *gin.Context) {
	chapterID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid chapter id")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	reviews, total, err := h.reviewService.ListReviewsByChapter(c.Request.Context(), chapterID, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"reviews": reviews,
		"total":   total,
		"page":    page,
	})
}

// ListMine 获取当前用户的书评列表
func (h *ReviewHandler) ListMine(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	reviews, total, err := h.reviewService.ListReviewsByUser(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"reviews": reviews,
		"total":   total,
		"page":    page,
	})
}

// Update 更新书评
// @Summary 更新书评
// @Description 更新书评内容
// @Tags reviews
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "书评ID"
// @Param request body service.UpdateReviewRequest true "书评信息"
// @Success 200 {object} response.Response{data=model.Review}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 403 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /reviews/{id} [put]
func (h *ReviewHandler) Update(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid review id")
		return
	}

	var req service.UpdateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	review, err := h.reviewService.UpdateReview(c.Request.Context(), id, &req, userID)
	if err != nil {
		if errors.Is(err, service.ErrReviewNotFound) {
			response.NotFound(c, "review not found")
			return
		}
		if err.Error() == "unauthorized" {
			response.Forbidden(c, "unauthorized")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, review)
}

// Delete 删除书评
// @Summary 删除书评
// @Description 删除书评
// @Tags reviews
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "书评ID"
// @Success 200 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 403 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /reviews/{id} [delete]
func (h *ReviewHandler) Delete(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid review id")
		return
	}

	if err := h.reviewService.DeleteReview(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, service.ErrReviewNotFound) {
			response.NotFound(c, "review not found")
			return
		}
		if err.Error() == "unauthorized" {
			response.Forbidden(c, "unauthorized")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Like 点赞书评
// @Summary 点赞书评
// @Description 点赞书评
// @Tags reviews
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "书评ID"
// @Success 200 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /reviews/{id}/like [post]
func (h *ReviewHandler) Like(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid review id")
		return
	}

	if err := h.reviewService.LikeReview(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, service.ErrReviewNotFound) {
			response.NotFound(c, "review not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Unlike 取消点赞
// @Summary 取消点赞
// @Description 取消点赞书评
// @Tags reviews
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "书评ID"
// @Success 200 {object} response.Response
// @Failure 401 {object} response.Response
// @Router /reviews/{id}/like [delete]
func (h *ReviewHandler) Unlike(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid review id")
		return
	}

	if err := h.reviewService.UnlikeReview(c.Request.Context(), id, userID); err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, nil)
}
