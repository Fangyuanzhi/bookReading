package service

import (
	"context"
	"errors"
	"strings"

	"github.com/fangyuanzhi/bookreading-backend/internal/config"
	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/fangyuanzhi/bookreading-backend/internal/validator"
	"github.com/fangyuanzhi/bookreading-backend/pkg/jwt"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserExists         = errors.New("user already exists")
	ErrInvalidInput       = errors.New("invalid input")
)

// AuthService 认证服务
type AuthService struct {
	userRepo  *repository.UserRepository
	jwtConfig *config.JWTConfig
}

// NewAuthService 创建认证服务
func NewAuthService(userRepo *repository.UserRepository, jwtConfig *config.JWTConfig) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtConfig: jwtConfig,
	}
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=6,max=32"`
	Username    string `json:"username" validate:"omitempty,min=2,max=20"`
	DisplayName string `json:"display_name" validate:"omitempty,max=20"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// AuthResponse 认证响应
type AuthResponse struct {
	Token string             `json:"token"`
	User  model.UserResponse `json:"user"`
}

// Register 用户注册
func (s *AuthService) Register(ctx context.Context, req *RegisterRequest) (*AuthResponse, error) {
	// 验证密码复杂度
	if err := validator.ValidatePassword(req.Password); err != nil {
		return nil, err
	}

	// 检查邮箱是否已存在
	_, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err == nil {
		return nil, ErrUserExists
	}
	if !errors.Is(err, repository.ErrUserNotFound) {
		return nil, err
	}

	// 密码哈希
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 创建用户
	user := &model.User{
		Email:       req.Email,
		Password:    string(hashedPassword),
		DisplayName: req.DisplayName,
	}

	if trimmed := strings.TrimSpace(req.Username); trimmed != "" {
		user.Username = &trimmed
	}

	// 如果没有设置显示名，使用默认昵称
	if user.DisplayName == "" {
		user.DisplayName = "读者"
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	// 生成 JWT
	token, err := s.generateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	}, nil
}

// Login 用户登录
func (s *AuthService) Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error) {
	// 查找用户
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	// 生成 JWT
	token, err := s.generateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	}, nil
}

// GetUserByID 根据ID获取用户
func (s *AuthService) GetUserByID(ctx context.Context, userID uuid.UUID) (*model.UserResponse, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	resp := user.ToResponse()
	return &resp, nil
}

// generateToken 生成 JWT Token
func (s *AuthService) generateToken(userID uuid.UUID, email string) (string, error) {
	jwtUtil := jwt.New(&jwt.Config{
		Secret:      s.jwtConfig.Secret,
		ExpireHours: s.jwtConfig.ExpireHours,
	})
	return jwtUtil.GenerateToken(userID, email)
}
