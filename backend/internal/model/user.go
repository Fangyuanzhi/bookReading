package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User 用户模型 (对应 profiles 表)
type User struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Username    *string        `json:"username,omitempty" gorm:"uniqueIndex;size:50"`
	DisplayName string         `json:"display_name" gorm:"size:50"`
	AvatarURL   string         `json:"avatar_url"`
	Email       string         `json:"email" gorm:"uniqueIndex;size:100"`
	Password    string         `json:"-" gorm:"size:255"` // 不序列化
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (User) TableName() string {
	return "profiles"
}

// BeforeCreate 创建前钩子
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// UserResponse 用户响应（脱敏）
type UserResponse struct {
	ID          uuid.UUID `json:"id"`
	Username    string    `json:"username,omitempty"`
	DisplayName string    `json:"display_name"`
	AvatarURL   string    `json:"avatar_url"`
	Email       string    `json:"email"`
	CreatedAt   time.Time `json:"created_at"`
}

// ToResponse 转换为响应格式
func (u *User) ToResponse() UserResponse {
	resp := UserResponse{
		ID:          u.ID,
		DisplayName: u.DisplayName,
		AvatarURL:   u.AvatarURL,
		Email:       u.Email,
		CreatedAt:   u.CreatedAt,
	}
	if u.Username != nil {
		resp.Username = *u.Username
	}
	return resp
}
