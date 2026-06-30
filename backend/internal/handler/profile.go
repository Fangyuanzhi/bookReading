package handler

import (
	"github.com/fangyuanzhi/bookreading-backend/internal/middleware"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// ProfileHandler 个人主页统计
type ProfileHandler struct {
	noteRepo   *repository.NoteRepository
	reviewRepo *repository.ReviewRepository
	bookRepo   *repository.BookRepository
}

// NewProfileHandler 创建个人主页处理器
func NewProfileHandler(noteRepo *repository.NoteRepository, reviewRepo *repository.ReviewRepository, bookRepo *repository.BookRepository) *ProfileHandler {
	return &ProfileHandler{
		noteRepo:   noteRepo,
		reviewRepo: reviewRepo,
		bookRepo:   bookRepo,
	}
}

// Stats 获取当前用户的互动统计
func (h *ProfileHandler) Stats(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	ctx := c.Request.Context()

	noteLikes, err := h.noteRepo.SumLikesByUser(ctx, userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	reviewLikes, err := h.reviewRepo.SumLikesByUser(ctx, userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	_, bookCount, err := h.bookRepo.ListByCreator(ctx, userID, 0, 1)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"note_likes":    noteLikes,
		"review_likes":  reviewLikes,
		"total_likes":   noteLikes + reviewLikes,
		"books_created": bookCount,
	})
}
