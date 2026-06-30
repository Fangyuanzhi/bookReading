package handler

import (
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/middleware"
	"github.com/fangyuanzhi/bookreading-backend/internal/service"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// ReportHandler 内容举报处理器
type ReportHandler struct {
	reportService *service.ReportService
}

func NewReportHandler(reportService *service.ReportService) *ReportHandler {
	return &ReportHandler{reportService: reportService}
}

// Create 提交举报
// @Summary 举报内容
// @Tags reports
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body service.CreateReportRequest true "举报信息"
// @Success 200 {object} response.Response
// @Router /reports [post]
func (h *ReportHandler) Create(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	var req service.CreateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	report, err := h.reportService.CreateReport(c.Request.Context(), userID, req)
	if err != nil {
		if errors.Is(err, service.ErrReportDuplicate) {
			response.BadRequest(c, err.Error())
			return
		}
		if errors.Is(err, service.ErrInvalidReportTarget) {
			response.BadRequest(c, err.Error())
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, report)
}
