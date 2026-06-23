package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// Timeout 请求超时中间件
func Timeout(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		c.Request = c.Request.WithContext(ctx)

		// 使用 channel 检测超时
		finish := make(chan struct{})
		go func() {
			c.Next()
			close(finish)
		}()

		select {
		case <-finish:
			// 正常完成
		case <-ctx.Done():
			// 超时
			c.Abort()
			response.Error(c, http.StatusGatewayTimeout, "request timeout")
		}
	}
}
