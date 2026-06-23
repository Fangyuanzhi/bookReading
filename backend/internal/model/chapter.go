package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Chapter 章节模型
type Chapter struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	BookID    uuid.UUID      `json:"book_id" gorm:"type:uuid;not null;index"`
	Book      *Book          `json:"book,omitempty" gorm:"foreignKey:BookID"`
	Idx       int            `json:"idx" gorm:"not null"` // 章节顺序
	Title     string         `json:"title" gorm:"size:200"`
	Href      string         `json:"href" gorm:"size:500"`               // EPUB 内 spine item 的 href
	Content   string         `json:"content,omitempty" gorm:"type:text"` // 章节内容（可选存储）
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (Chapter) TableName() string {
	return "chapters"
}

// BeforeCreate 创建前钩子
func (c *Chapter) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
