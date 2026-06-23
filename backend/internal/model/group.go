package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReadingGroup 共读小组模型
type ReadingGroup struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	BookID      uuid.UUID      `json:"book_id" gorm:"type:uuid;not null;index"`
	Book        *Book          `json:"book,omitempty" gorm:"foreignKey:BookID"`
	Name        string         `json:"name" gorm:"not null;size:100"`
	Description string         `json:"description" gorm:"type:text"`
	Pace        string         `json:"pace" gorm:"type:jsonb"` // 共读节奏/计划
	CreatedBy   *uuid.UUID     `json:"created_by" gorm:"type:uuid"`
	Creator     *User          `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Members     []GroupMember  `json:"members,omitempty" gorm:"foreignKey:GroupID"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (ReadingGroup) TableName() string {
	return "reading_groups"
}

// BeforeCreate 创建前钩子
func (g *ReadingGroup) BeforeCreate(tx *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	return nil
}

// GroupMember 小组成员模型
type GroupMember struct {
	GroupID  uuid.UUID `json:"group_id" gorm:"type:uuid;primaryKey"`
	UserID   uuid.UUID `json:"user_id" gorm:"type:uuid;primaryKey"`
	User     *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	JoinedAt time.Time `json:"joined_at"`
}

// TableName 指定表名
func (GroupMember) TableName() string {
	return "group_members"
}
