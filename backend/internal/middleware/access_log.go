package middleware

import (
	"time"

	"github.com/fangyuanzhi/bookreading-backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// AccessLog 结构化 HTTP 访问日志（替代 gin.Logger）
func AccessLog() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		status := c.Writer.Status()
		latency := time.Since(start)
		size := c.Writer.Size()

		fields := append(logger.HTTPFields(c),
			logger.Int("status", status),
			logger.Int64("latency_ms", latency.Milliseconds()),
			logger.Int("response_bytes", size),
		)

		if len(c.Errors) > 0 {
			fields = append(fields, logger.Err(c.Errors.Last()))
		}

		msg := "http access"
		switch {
		case status >= 500:
			logger.Error(msg, fields...)
		case status >= 400:
			logger.Warn(msg, fields...)
		default:
			logger.Info(msg, fields...)
		}
	}
}

// Recovery panic 恢复并记录堆栈
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if rec := recover(); rec != nil {
				fields := append(logger.HTTPFields(c), zap.Any("panic", rec))
				logger.Error("panic recovered", fields...)
				c.AbortWithStatus(500)
			}
		}()
		c.Next()
	}
}
