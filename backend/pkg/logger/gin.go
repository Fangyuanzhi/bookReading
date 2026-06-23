package logger

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

const (
	ginRequestIDKey = "request_id"
	ginUserIDKey    = "userID"
)

// HTTPFields 从 Gin 上下文提取常用追踪字段
func HTTPFields(c *gin.Context) []zap.Field {
	fields := []zap.Field{
		String("request_id", RequestID(c)),
		String("method", c.Request.Method),
		String("path", c.FullPath()),
		String("uri", c.Request.RequestURI),
		String("client_ip", c.ClientIP()),
	}

	if path := c.FullPath(); path == "" {
		fields = append(fields, String("raw_path", c.Request.URL.Path))
	}

	if userID, ok := c.Get(ginUserIDKey); ok {
		if s, ok := userID.(string); ok && s != "" {
			fields = append(fields, String("user_id", s))
		}
	}

	if email, ok := c.Get("email"); ok {
		if s, ok := email.(string); ok && s != "" {
			fields = append(fields, String("email", s))
		}
	}

	return fields
}

// RequestID 读取请求 ID（与 middleware 保持一致）
func RequestID(c *gin.Context) string {
	if id, ok := c.Get(ginRequestIDKey); ok {
		if s, ok := id.(string); ok {
			return s
		}
	}
	return c.GetHeader("X-Request-ID")
}
