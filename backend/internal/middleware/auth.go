package middleware

import (
	"errors"
	"strings"

	"github.com/fangyuanzhi/bookreading-backend/internal/config"
	"github.com/fangyuanzhi/bookreading-backend/pkg/jwt"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	UserIDKey = "userID"
	EmailKey  = "email"
)

// Auth JWT 认证中间件
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "missing authorization header")
			c.Abort()
			return
		}

		// Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Unauthorized(c, "invalid authorization header format")
			c.Abort()
			return
		}

		tokenString := parts[1]

		cfg := config.Get()
		jwtUtil := jwt.New(&jwt.Config{
			Secret:      cfg.JWT.Secret,
			ExpireHours: cfg.JWT.ExpireHours,
		})

		claims, err := jwtUtil.ParseToken(tokenString)
		if err != nil {
			if err == jwt.ErrExpiredToken {
				response.Unauthorized(c, "token has expired")
			} else {
				response.Unauthorized(c, "invalid token")
			}
			c.Abort()
			return
		}

		// 将用户信息存入上下文
		c.Set(UserIDKey, claims.UserID.String())
		c.Set(EmailKey, claims.Email)

		c.Next()
	}
}

// GetUserID 从上下文中获取用户ID
func GetUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get(UserIDKey)
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// OptionalAuth 可选 JWT 认证：有合法 token 则写入 userID，否则继续
func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.Next()
			return
		}

		cfg := config.Get()
		jwtUtil := jwt.New(&jwt.Config{
			Secret:      cfg.JWT.Secret,
			ExpireHours: cfg.JWT.ExpireHours,
		})

		claims, err := jwtUtil.ParseToken(parts[1])
		if err != nil {
			c.Next()
			return
		}

		c.Set(UserIDKey, claims.UserID.String())
		c.Set(EmailKey, claims.Email)
		c.Next()
	}
}

// GetCurrentUserID 从上下文中获取用户UUID
func GetCurrentUserID(c *gin.Context) (uuid.UUID, error) {
	userIDStr, exists := c.Get(UserIDKey)
	if !exists {
		return uuid.Nil, errors.New("unauthorized")
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return uuid.Nil, errors.New("invalid user id")
	}

	return userID, nil
}

// GetCurrentUserIDOptional 从上下文中获取用户UUID（未登录时返回错误）
func GetCurrentUserIDOptional(c *gin.Context) (uuid.UUID, error) {
	userIDStr, exists := c.Get(UserIDKey)
	if !exists {
		return uuid.Nil, errors.New("not logged in")
	}
	return uuid.Parse(userIDStr.(string))
}
