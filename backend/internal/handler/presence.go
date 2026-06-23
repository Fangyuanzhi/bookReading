package handler

import (
	"github.com/fangyuanzhi/bookreading-backend/internal/middleware"
	"github.com/fangyuanzhi/bookreading-backend/internal/service"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PresenceHandler 在场处理器
type PresenceHandler struct {
	presenceService *service.PresenceService
}

// NewPresenceHandler 创建在场处理器
func NewPresenceHandler(presenceService *service.PresenceService) *PresenceHandler {
	return &PresenceHandler{presenceService: presenceService}
}

// JoinChapterRequest 加入章节请求
type JoinChapterRequest struct {
	DisplayName string `json:"display_name" validate:"max=50"`
}

// JoinChapter 加入章节阅读
// @Summary 加入章节阅读
// @Description 用户进入某个章节阅读，更新在场状态
// @Tags presence
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "章节ID"
// @Param request body JoinChapterRequest false "显示名称"
// @Success 200 {object} response.Response{data=map[string]interface{}}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Router /chapters/{id}/join [post]
func (h *PresenceHandler) JoinChapter(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	chapterID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid chapter id")
		return
	}

	var req JoinChapterRequest
	c.ShouldBindJSON(&req) // 可选参数

	displayName := req.DisplayName
	if displayName == "" {
		displayName = "读者" // 默认名称
	}

	if err := h.presenceService.JoinChapter(c.Request.Context(), chapterID, userID, displayName); err != nil {
		response.InternalError(c, err.Error())
		return
	}

	// 获取当前在场人数
	count, _, err := h.presenceService.GetChapterPresence(c.Request.Context(), chapterID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"message": "joined chapter",
		"count":   count,
	})
}

// LeaveChapter 离开章节
// @Summary 离开章节阅读
// @Description 用户离开某个章节
// @Tags presence
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "章节ID"
// @Success 200 {object} response.Response{data=map[string]interface{}}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Router /chapters/{id}/leave [post]
func (h *PresenceHandler) LeaveChapter(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	chapterID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid chapter id")
		return
	}

	var req JoinChapterRequest
	c.ShouldBindJSON(&req)

	displayName := req.DisplayName
	if displayName == "" {
		displayName = "读者"
	}

	if err := h.presenceService.LeaveChapter(c.Request.Context(), chapterID, userID, displayName); err != nil {
		response.InternalError(c, err.Error())
		return
	}

	// 获取当前在场人数
	count, _, err := h.presenceService.GetChapterPresence(c.Request.Context(), chapterID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"message": "left chapter",
		"count":   count,
	})
}

// GetChapterPresence 获取章节在场人数
// @Summary 获取章节在场人数
// @Description 获取当前章节的在线阅读人数
// @Tags presence
// @Accept json
// @Produce json
// @Param id path string true "章节ID"
// @Success 200 {object} response.Response{data=map[string]interface{}}
// @Failure 400 {object} response.Response
// @Router /chapters/{id}/presence [get]
func (h *PresenceHandler) GetChapterPresence(c *gin.Context) {
	chapterID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid chapter id")
		return
	}

	count, users, err := h.presenceService.GetChapterPresence(c.Request.Context(), chapterID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"count": count,
		"users": users,
	})
}

// HeartbeatRequest 心跳请求
type HeartbeatRequest struct {
	ChapterID string `json:"chapter_id" validate:"required,uuid"`
}

// Heartbeat 心跳保活
// @Summary 心跳保活
// @Description 发送心跳保持在线状态
// @Tags presence
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body HeartbeatRequest true "章节ID"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Router /presence/heartbeat [post]
func (h *PresenceHandler) Heartbeat(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	var req HeartbeatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	chapterID, err := uuid.Parse(req.ChapterID)
	if err != nil {
		response.BadRequest(c, "invalid chapter id")
		return
	}

	if err := h.presenceService.Heartbeat(c.Request.Context(), chapterID, userID); err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, nil)
}
