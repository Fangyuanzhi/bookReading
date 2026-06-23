package middleware

import (
	"github.com/fangyuanzhi/bookreading-backend/pkg/logger"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// ErrorHandler 统一错误处理与日志
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) == 0 {
			return
		}

		err := c.Errors.Last()
		fields := append(logger.HTTPFields(c), logger.Err(err.Err), logger.String("error_type", errTypeName(err.Type)))

		logger.Error("request handler error", fields...)

		if c.Writer.Written() {
			return
		}

		switch err.Type {
		case gin.ErrorTypeBind:
			response.BadRequest(c, "请求格式错误")
		default:
			response.InternalError(c, "服务器内部错误")
		}
	}
}

func errTypeName(t gin.ErrorType) string {
	switch t {
	case gin.ErrorTypeBind:
		return "bind"
	case gin.ErrorTypePublic:
		return "public"
	case gin.ErrorTypePrivate:
		return "private"
	default:
		return "unknown"
	}
}
