package model

import (
	"time"

	"github.com/google/uuid"
)

// ShelfItem 书架条目
type ShelfItem struct {
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;primaryKey"`
	User      *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	BookID    uuid.UUID `json:"book_id" gorm:"type:uuid;primaryKey"`
	Book      *Book     `json:"book,omitempty" gorm:"foreignKey:BookID"`
	CreatedAt time.Time `json:"created_at"`
}

// TableName 指定表名
func (ShelfItem) TableName() string {
	return "shelf_items"
}
