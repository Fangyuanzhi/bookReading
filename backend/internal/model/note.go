package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Note 段评/划线想法模型
type Note struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	BookID    uuid.UUID      `json:"book_id" gorm:"type:uuid;not null;index"`
	Book      *Book          `json:"book,omitempty" gorm:"foreignKey:BookID"`
	ChapterID *uuid.UUID     `json:"chapter_id" gorm:"type:uuid;index"`
	Chapter   *Chapter       `json:"chapter,omitempty" gorm:"foreignKey:ChapterID"`
	UserID    uuid.UUID      `json:"user_id" gorm:"type:uuid;not null;index"`
	User      *User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	CFI       string         `json:"cfi" gorm:"not null;size:500"`        // EPUB CFI 区间 = 锚点（核心）
	TextQuote string         `json:"text_quote" gorm:"type:text"`         // 被划选的原文（展示用 + CFI 失效时兜底定位）
	Body      string         `json:"body" gorm:"not null;type:text"`      // 用户写的想法
	IsPublic  bool           `json:"is_public" gorm:"default:true;index"` // 公开想法 vs 私人笔记
	ParentID  *uuid.UUID     `json:"parent_id" gorm:"type:uuid;index"`    // 盖楼/回复
	Parent    *Note          `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Likes     int            `json:"likes" gorm:"default:0"` // 点赞数（冗余，方便查询）
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (Note) TableName() string {
	return "notes"
}

// BeforeCreate 创建前钩子
func (n *Note) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

// NoteLike 段评点赞模型
type NoteLike struct {
	NoteID    uuid.UUID `json:"note_id" gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;primaryKey"`
	CreatedAt time.Time `json:"created_at"`
}

// TableName 指定表名
func (NoteLike) TableName() string {
	return "note_likes"
}
