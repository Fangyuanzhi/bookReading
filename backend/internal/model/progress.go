package model

import (
	"time"

	"github.com/google/uuid"
)

// ReadingProgress 阅读进度模型
type ReadingProgress struct {
	UserID    uuid.UUID  `json:"user_id" gorm:"type:uuid;primaryKey"`
	User      *User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	BookID    uuid.UUID  `json:"book_id" gorm:"type:uuid;primaryKey"`
	Book      *Book      `json:"book,omitempty" gorm:"foreignKey:BookID"`
	ChapterID *uuid.UUID `json:"chapter_id" gorm:"type:uuid;index"`
	Chapter   *Chapter   `json:"chapter,omitempty" gorm:"foreignKey:ChapterID"`
	CFI       string     `json:"cfi" gorm:"size:500"` // 最后阅读位置
	UpdatedAt time.Time  `json:"updated_at"`
}

// TableName 指定表名
func (ReadingProgress) TableName() string {
	return "reading_progress"
}
