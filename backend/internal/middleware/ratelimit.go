package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/fangyuanzhi/bookreading-backend/internal/config"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// IPRateLimiter IP 限流器
type IPRateLimiter struct {
	visitors map[string]*rate.Limiter
	mu       sync.RWMutex
	rate     rate.Limit
	burst    int
}

// NewIPRateLimiter 创建 IP 限流器
func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
	return &IPRateLimiter{
		visitors: make(map[string]*rate.Limiter),
		rate:     r,
		burst:    b,
	}
}

// GetLimiter 获取限流器
func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	i.mu.RLock()
	limiter, exists := i.visitors[ip]
	i.mu.RUnlock()

	if !exists {
		i.mu.Lock()
		limiter = rate.NewLimiter(i.rate, i.burst)
		i.visitors[ip] = limiter
		i.mu.Unlock()
	}

	return limiter
}

// Cleanup 清理过期限流器
func (i *IPRateLimiter) Cleanup() {
	for {
		time.Sleep(time.Minute)
		i.mu.Lock()
		for ip, limiter := range i.visitors {
			// 如果限流器允许所有请求，说明一段时间内没有请求
			if limiter.Allow() {
				delete(i.visitors, ip)
			}
		}
		i.mu.Unlock()
	}
}

// RateLimit 限流中间件
func RateLimit() gin.HandlerFunc {
	cfg := config.Get()
	limiter := NewIPRateLimiter(rate.Limit(cfg.RateLimit.RequestsPerSecond), cfg.RateLimit.Burst)

	// 启动清理协程
	go limiter.Cleanup()

	return func(c *gin.Context) {
		ip := c.ClientIP()
		if !limiter.GetLimiter(ip).Allow() {
			c.JSON(http.StatusTooManyRequests, response.Response{
				Code:    429,
				Message: "too many requests",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// UserRateLimiter 用户限流器（用于已认证接口）
type UserRateLimiter struct {
	visitors map[string]*rate.Limiter
	mu       sync.RWMutex
	rate     rate.Limit
	burst    int
}

// NewUserRateLimiter 创建用户限流器
func NewUserRateLimiter(r rate.Limit, b int) *UserRateLimiter {
	return &UserRateLimiter{
		visitors: make(map[string]*rate.Limiter),
		rate:     r,
		burst:    b,
	}
}

// GetLimiter 获取限流器
func (u *UserRateLimiter) GetLimiter(userID string) *rate.Limiter {
	u.mu.RLock()
	limiter, exists := u.visitors[userID]
	u.mu.RUnlock()

	if !exists {
		u.mu.Lock()
		limiter = rate.NewLimiter(u.rate, u.burst)
		u.visitors[userID] = limiter
		u.mu.Unlock()
	}

	return limiter
}

// AuthRateLimit 认证接口限流中间件
func AuthRateLimit() gin.HandlerFunc {
	// 认证接口限流更严格：每秒2个请求，突发5个
	limiter := NewUserRateLimiter(rate.Limit(2), 5)

	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.Next()
			return
		}

		if !limiter.GetLimiter(userID.(string)).Allow() {
			c.JSON(http.StatusTooManyRequests, response.Response{
				Code:    429,
				Message: "too many requests",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
