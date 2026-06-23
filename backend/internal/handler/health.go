package handler

import (
	"net/http"

	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// HealthHandler 健康检查处理器
type HealthHandler struct{}

// NewHealthHandler 创建健康检查处理器
func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

// Health 健康检查
// @Summary 健康检查
// @Description 检查服务是否正常运行
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} response.Response{data=map[string]string}
// @Router /health [get]
func (h *HealthHandler) Health(c *gin.Context) {
	response.Success(c, gin.H{
		"status":  "ok",
		"service": "bookreading-backend",
	})
}

// Ping 简单 ping 检查
// @Summary Ping 检查
// @Description 最简单的存活检查
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {string} string "pong"
// @Router /ping [get]
func (h *HealthHandler) Ping(c *gin.Context) {
	c.String(http.StatusOK, "pong")
}
