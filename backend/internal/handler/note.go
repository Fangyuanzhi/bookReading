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

// NoteHandler 段评处理器
type NoteHandler struct {
	noteService *service.NoteService
}

// NewNoteHandler 创建段评处理器
func NewNoteHandler(noteService *service.NoteService) *NoteHandler {
	return &NoteHandler{noteService: noteService}
}

// Create 创建段评
// @Summary 创建段评
// @Description 在指定位置创建段评/想法
// @Tags notes
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body service.CreateNoteRequest true "段评信息"
// @Success 200 {object} response.Response{data=model.Note}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Router /notes [post]
func (h *NoteHandler) Create(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	var req service.CreateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	note, err := h.noteService.CreateNote(c.Request.Context(), &req, userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, note)
}

// Get 获取段评详情
// @Summary 获取段评详情
// @Description 根据ID获取段评详情
// @Tags notes
// @Accept json
// @Produce json
// @Param id path string true "段评ID"
// @Success 200 {object} response.Response{data=service.NoteResponse}
// @Failure 404 {object} response.Response
// @Router /notes/{id} [get]
func (h *NoteHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid note id")
		return
	}

	// 获取当前用户ID（可选）
	var currentUserID uuid.UUID
	if userIDStr, exists := c.Get("userID"); exists {
		currentUserID, _ = uuid.Parse(userIDStr.(string))
	}

	note, err := h.noteService.GetNote(c.Request.Context(), id, currentUserID)
	if err != nil {
		if errors.Is(err, service.ErrNoteNotFound) {
			response.NotFound(c, "note not found")
			return
		}
		if errors.Is(err, service.ErrUnauthorized) {
			response.Forbidden(c, "unauthorized")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, note)
}

// ListByChapter 获取章节的段评列表
// @Summary 获取章节的段评列表
// @Description 获取指定章节的所有段评
// @Tags notes
// @Accept json
// @Produce json
// @Param id path string true "章节ID"
// @Success 200 {object} response.Response{data=[]model.Note}
// @Failure 400 {object} response.Response
// @Router /chapters/{id}/notes [get]
func (h *NoteHandler) ListByChapter(c *gin.Context) {
	chapterID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid chapter id")
		return
	}

	// 获取当前用户ID（可选）
	var currentUserID uuid.UUID
	if userIDStr, exists := c.Get("userID"); exists {
		currentUserID, _ = uuid.Parse(userIDStr.(string))
	}

	notes, err := h.noteService.ListNotesByChapter(c.Request.Context(), chapterID, currentUserID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, notes)
}

// ListMine 获取当前用户的段评列表
func (h *NoteHandler) ListMine(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if ps := c.Query("page_size"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 {
			pageSize = v
		}
	}

	notes, total, err := h.noteService.ListNotesByUser(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"notes": notes,
		"page":  page,
		"total": total,
	})
}

// Update 更新段评
// @Summary 更新段评
// @Description 更新段评内容
// @Tags notes
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "段评ID"
// @Param request body service.UpdateNoteRequest true "段评信息"
// @Success 200 {object} response.Response{data=model.Note}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 403 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /notes/{id} [put]
func (h *NoteHandler) Update(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid note id")
		return
	}

	var req service.UpdateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	note, err := h.noteService.UpdateNote(c.Request.Context(), id, &req, userID)
	if err != nil {
		if errors.Is(err, service.ErrNoteNotFound) {
			response.NotFound(c, "note not found")
			return
		}
		if errors.Is(err, service.ErrUnauthorized) {
			response.Forbidden(c, "unauthorized")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, note)
}

// Delete 删除段评
// @Summary 删除段评
// @Description 删除段评
// @Tags notes
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "段评ID"
// @Success 200 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 403 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /notes/{id} [delete]
func (h *NoteHandler) Delete(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid note id")
		return
	}

	if err := h.noteService.DeleteNote(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, service.ErrNoteNotFound) {
			response.NotFound(c, "note not found")
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

// Like 点赞段评
// @Summary 点赞段评
// @Description 点赞段评
// @Tags notes
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "段评ID"
// @Success 200 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /notes/{id}/like [post]
func (h *NoteHandler) Like(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid note id")
		return
	}

	if err := h.noteService.LikeNote(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, service.ErrNoteNotFound) {
			response.NotFound(c, "note not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Unlike 取消点赞
// @Summary 取消点赞
// @Description 取消点赞段评
// @Tags notes
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "段评ID"
// @Success 200 {object} response.Response
// @Failure 401 {object} response.Response
// @Router /notes/{id}/like [delete]
func (h *NoteHandler) Unlike(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid note id")
		return
	}

	if err := h.noteService.UnlikeNote(c.Request.Context(), id, userID); err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, nil)
}
