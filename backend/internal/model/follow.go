package model

import (
	"time"

	"github.com/google/uuid"
)

// UserFollow 用户关注关系
type UserFollow struct {
	FollowerID  uuid.UUID `json:"follower_id" gorm:"type:uuid;primaryKey"`
	Follower    *User     `json:"follower,omitempty" gorm:"foreignKey:FollowerID"`
	FollowingID uuid.UUID `json:"following_id" gorm:"type:uuid;primaryKey"`
	Following   *User     `json:"following,omitempty" gorm:"foreignKey:FollowingID"`
	CreatedAt   time.Time `json:"created_at"`
}

// TableName 指定表名
func (UserFollow) TableName() string {
	return "user_follows"
}
