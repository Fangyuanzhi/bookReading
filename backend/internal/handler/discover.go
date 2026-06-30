package handler

import (
	"github.com/fangyuanzhi/bookreading-backend/internal/service"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// DiscoverHandler 发现页处理器
type DiscoverHandler struct {
	discoverService *service.DiscoverService
}

// NewDiscoverHandler 创建发现页处理器
func NewDiscoverHandler(discoverService *service.DiscoverService) *DiscoverHandler {
	return &DiscoverHandler{discoverService: discoverService}
}

// Feed 发现页聚合内容
// @Summary 发现页
// @Description 热门段评、书评、新书、活跃读者、今日精选
// @Tags discover
// @Produce json
// @Success 200 {object} response.Response{data=service.DiscoverFeed}
// @Router /discover [get]
func (h *DiscoverHandler) Feed(c *gin.Context) {
	var userID uuid.UUID
	if id, exists := c.Get("userID"); exists {
		userID, _ = uuid.Parse(id.(string))
	}

	feed, err := h.discoverService.GetFeed(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, feed)
}
