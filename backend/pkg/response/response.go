package response

import (
	"net/http"

	"github.com/fangyuanzhi/bookreading-backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

// 注意：此处不能 import middleware，避免循环依赖；字段键与 middleware 保持一致
const (
	ctxRequestID = "request_id"
)

// Response 统一响应结构
type Response struct {
	Code      int         `json:"code"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	RequestID string      `json:"request_id,omitempty"`
}

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:      200,
		Message:   "success",
		Data:      data,
		RequestID: requestID(c),
	})
}

// SuccessWithMessage 成功响应带自定义消息
func SuccessWithMessage(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:      200,
		Message:   message,
		Data:      data,
		RequestID: requestID(c),
	})
}

// Error 错误响应
func Error(c *gin.Context, code int, message string) {
	logHTTPError(c, code, message)
	c.JSON(code, Response{
		Code:      code,
		Message:   message,
		Data:      nil,
		RequestID: requestID(c),
	})
}

// BadRequest 400 错误
func BadRequest(c *gin.Context, message string) {
	Error(c, http.StatusBadRequest, message)
}

// Unauthorized 401 错误
func Unauthorized(c *gin.Context, message string) {
	if message == "" {
		message = "unauthorized"
	}
	Error(c, http.StatusUnauthorized, message)
}

// Forbidden 403 错误
func Forbidden(c *gin.Context, message string) {
	if message == "" {
		message = "forbidden"
	}
	Error(c, http.StatusForbidden, message)
}

// PaymentRequired 402 需要付费
func PaymentRequired(c *gin.Context, message string, data interface{}) {
	if message == "" {
		message = "payment required"
	}
	logHTTPError(c, http.StatusPaymentRequired, message)
	c.JSON(http.StatusPaymentRequired, Response{
		Code:      http.StatusPaymentRequired,
		Message:   message,
		Data:      data,
		RequestID: requestID(c),
	})
}

// NotFound 404 错误
func NotFound(c *gin.Context, message string) {
	if message == "" {
		message = "not found"
	}
	Error(c, http.StatusNotFound, message)
}

// InternalError 500 错误
func InternalError(c *gin.Context, message string) {
	if message == "" {
		message = "internal server error"
	}
	Error(c, http.StatusInternalServerError, message)
}

func requestID(c *gin.Context) string {
	if id, ok := c.Get(ctxRequestID); ok {
		if s, ok := id.(string); ok {
			return s
		}
	}
	return c.GetHeader("X-Request-ID")
}

func logHTTPError(c *gin.Context, status int, message string) {
	fields := append(logger.HTTPFields(c),
		logger.Int("status", status),
		logger.String("message", message),
	)

	switch {
	case status >= 500:
		logger.Error("http error response", fields...)
	case status >= 400:
		logger.Warn("http error response", fields...)
	}
}
