package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Review 书评/章末感想模型
type Review struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	BookID    uuid.UUID      `json:"book_id" gorm:"type:uuid;not null;index"`
	Book      *Book          `json:"book,omitempty" gorm:"foreignKey:BookID"`
	ChapterID *uuid.UUID     `json:"chapter_id" gorm:"type:uuid;index"` // 为空 = 整本书评
	Chapter   *Chapter       `json:"chapter,omitempty" gorm:"foreignKey:ChapterID"`
	UserID    uuid.UUID      `json:"user_id" gorm:"type:uuid;not null;index"`
	User      *User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Body      string         `json:"body" gorm:"not null;type:text"`
	Likes     int            `json:"likes" gorm:"default:0"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (Review) TableName() string {
	return "reviews"
}

// BeforeCreate 创建前钩子
func (r *Review) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// ReviewLike 书评点赞模型
type ReviewLike struct {
	ReviewID  uuid.UUID `json:"review_id" gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;primaryKey"`
	CreatedAt time.Time `json:"created_at"`
}

// TableName 指定表名
func (ReviewLike) TableName() string {
	return "review_likes"
}
