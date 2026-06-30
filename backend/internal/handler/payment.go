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

// PaymentHandler 支付处理器
type PaymentHandler struct {
	paymentService *service.PaymentService
}

// NewPaymentHandler 创建支付处理器
func NewPaymentHandler(paymentService *service.PaymentService) *PaymentHandler {
	return &PaymentHandler{paymentService: paymentService}
}

// CreatePayment 创建支付订单
// @Summary 创建支付订单
// @Description 创建购买书籍或VIP的支付订单
// @Tags payment
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body service.CreatePaymentRequest true "支付信息"
// @Success 200 {object} response.Response{data=service.PaymentResponse}
// @Failure 400 {object} response.Response
// @Router /payments [post]
func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	var req service.CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	resp, err := h.paymentService.CreatePayment(c.Request.Context(), &req, userID)
	if err != nil {
		if errors.Is(err, service.ErrInvalidPaymentAmount) {
			response.BadRequest(c, "invalid payment amount")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, resp)
}

// GetPricing 获取定价方案
func (h *PaymentHandler) GetPricing(c *gin.Context) {
	response.Success(c, h.paymentService.GetPricing())
}

// ConfirmPayment 模拟支付确认
func (h *PaymentHandler) ConfirmPayment(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid payment id")
		return
	}

	payment, err := h.paymentService.ConfirmPayment(c.Request.Context(), paymentID, userID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrPaymentNotFound):
			response.NotFound(c, "payment not found")
		case errors.Is(err, service.ErrPaymentUnauthorized):
			response.Forbidden(c, "payment unauthorized")
		case errors.Is(err, service.ErrPaymentExpired):
			response.BadRequest(c, "payment expired")
		default:
			response.InternalError(c, err.Error())
		}
		return
	}

	response.Success(c, payment)
}

// GetPaymentStatus 获取支付状态
// @Summary 获取支付状态
// @Description 查询支付订单状态
// @Tags payment
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "支付ID"
// @Success 200 {object} response.Response{data=model.Payment}
// @Failure 404 {object} response.Response
// @Router /payments/{id} [get]
func (h *PaymentHandler) GetPaymentStatus(c *gin.Context) {
	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid payment id")
		return
	}

	payment, err := h.paymentService.GetPaymentStatus(c.Request.Context(), paymentID)
	if err != nil {
		if errors.Is(err, service.ErrPaymentNotFound) {
			response.NotFound(c, "payment not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, payment)
}

// ListPayments 获取支付记录列表
// @Summary 获取支付记录
// @Description 获取当前用户的支付记录
// @Tags payment
// @Accept json
// @Produce json
// @Security Bearer
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Success 200 {object} response.Response{data=map[string]interface{}}
// @Router /payments [get]
func (h *PaymentHandler) ListPayments(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	payments, total, err := h.paymentService.ListUserPayments(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"payments": payments,
		"total":    total,
		"page":     page,
	})
}

// PaymentCallback 支付回调
// @Summary 支付回调
// @Description 第三方支付回调接口
// @Tags payment
// @Accept json
// @Produce json
// @Param provider path string true "支付渠道: alipay, wechat"
// @Param request body map[string]interface{} true "回调数据"
// @Success 200 {object} response.Response
// @Router /payments/callback/{provider} [post]
func (h *PaymentHandler) PaymentCallback(c *gin.Context) {
	provider := c.Param("provider")
	if provider != "alipay" && provider != "wechat" {
		response.BadRequest(c, "invalid provider")
		return
	}

	// 解析回调数据（简化实现）
	var callbackData struct {
		OrderID string `json:"order_id"`
		Status  string `json:"status"`
	}
	if err := c.ShouldBindJSON(&callbackData); err != nil {
		response.BadRequest(c, "invalid callback data")
		return
	}

	success := callbackData.Status == "success"
	if err := h.paymentService.ProcessPaymentCallback(c.Request.Context(), provider, callbackData.OrderID, success); err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// CheckVIP 检查VIP状态
// @Summary 检查VIP状态
// @Description 检查当前用户的VIP订阅状态
// @Tags payment
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} response.Response{data=model.VIPSubscription}
// @Router /vip/status [get]
func (h *PaymentHandler) CheckVIP(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	vip, err := h.paymentService.CheckUserVIP(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	if vip == nil {
		response.Success(c, gin.H{
			"is_vip": false,
		})
		return
	}

	response.Success(c, gin.H{
		"is_vip":   true,
		"level":    vip.Level,
		"start_at": vip.StartAt,
		"end_at":   vip.EndAt,
	})
}

// CheckBookAccess 检查书籍访问权限
// @Summary 检查书籍访问权限
// @Description 检查用户是否有权限访问某本书
// @Tags payment
// @Accept json
// @Produce json
// @Security Bearer
// @Param book_id query string true "书籍ID"
// @Success 200 {object} response.Response{data=map[string]bool}
// @Router /books/access [get]
func (h *PaymentHandler) CheckBookAccess(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	bookIDStr := c.Query("book_id")
	if bookIDStr == "" {
		response.BadRequest(c, "book_id is required")
		return
	}

	bookID, err := uuid.Parse(bookIDStr)
	if err != nil {
		response.BadRequest(c, "invalid book_id")
		return
	}

	info, err := h.paymentService.GetBookAccessInfo(c.Request.Context(), userID, bookID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, info)
}
