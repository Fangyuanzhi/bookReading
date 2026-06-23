package service

import (
	"context"
	"errors"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/fangyuanzhi/bookreading-backend/pkg/centrifugo"
	"github.com/google/uuid"
)

var (
	ErrNoteNotFound = errors.New("note not found")
)

// NoteService 段评服务
type NoteService struct {
	noteRepo         *repository.NoteRepository
	centrifugoClient *centrifugo.Client
}

// NewNoteService 创建段评服务
func NewNoteService(noteRepo *repository.NoteRepository, centrifugoClient *centrifugo.Client) *NoteService {
	return &NoteService{
		noteRepo:         noteRepo,
		centrifugoClient: centrifugoClient,
	}
}

// CreateNoteRequest 创建段评请求
type CreateNoteRequest struct {
	BookID    string `json:"book_id" validate:"required,uuid"`
	ChapterID string `json:"chapter_id" validate:"omitempty,uuid"`
	CFI       string `json:"cfi" validate:"required"`
	TextQuote string `json:"text_quote" validate:"required"`
	Body      string `json:"body" validate:"required,max=1000"`
	IsPublic  bool   `json:"is_public"`
	ParentID  string `json:"parent_id" validate:"omitempty,uuid"`
}

// UpdateNoteRequest 更新段评请求
type UpdateNoteRequest struct {
	Body     string `json:"body" validate:"omitempty,max=1000"`
	IsPublic *bool  `json:"is_public"`
}

// NoteResponse 段评响应
type NoteResponse struct {
	model.Note
	HasLiked bool `json:"has_liked"`
}

// CreateNote 创建段评
func (s *NoteService) CreateNote(ctx context.Context, req *CreateNoteRequest, userID uuid.UUID) (*model.Note, error) {
	bookID, err := uuid.Parse(req.BookID)
	if err != nil {
		return nil, err
	}

	note := &model.Note{
		BookID:    bookID,
		UserID:    userID,
		CFI:       req.CFI,
		TextQuote: req.TextQuote,
		Body:      req.Body,
		IsPublic:  req.IsPublic,
	}

	if req.ChapterID != "" {
		chapterID, err := uuid.Parse(req.ChapterID)
		if err != nil {
			return nil, err
		}
		note.ChapterID = &chapterID
	}

	if req.ParentID != "" {
		parentID, err := uuid.Parse(req.ParentID)
		if err != nil {
			return nil, err
		}
		note.ParentID = &parentID
	}

	if err := s.noteRepo.Create(ctx, note); err != nil {
		return nil, err
	}

	// 实时推送到章节频道
	if note.ChapterID != nil && s.centrifugoClient != nil {
		channel := centrifugo.GenerateChannelName("chapter", note.ChapterID.String())
		s.centrifugoClient.Publish(channel, map[string]interface{}{
			"type": "note_created",
			"data": note,
		})
	}

	return note, nil
}

// GetNote 获取段评详情
func (s *NoteService) GetNote(ctx context.Context, id uuid.UUID, currentUserID uuid.UUID) (*NoteResponse, error) {
	note, err := s.noteRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNoteNotFound) {
			return nil, ErrNoteNotFound
		}
		return nil, err
	}

	// 检查权限：私人笔记只能自己查看
	if !note.IsPublic && note.UserID != currentUserID {
		return nil, errors.New("unauthorized")
	}

	hasLiked, _ := s.noteRepo.HasLiked(ctx, id, currentUserID)

	return &NoteResponse{
		Note:     *note,
		HasLiked: hasLiked,
	}, nil
}

// ListNotesByChapter 获取章节的段评列表
func (s *NoteService) ListNotesByChapter(ctx context.Context, chapterID uuid.UUID, currentUserID uuid.UUID) ([]model.Note, error) {
	// 获取公开的段评
	notes, err := s.noteRepo.ListByChapter(ctx, chapterID, true)
	if err != nil {
		return nil, err
	}

	// 如果用户已登录，也获取该用户的私人笔记
	if currentUserID != uuid.Nil {
		privateNotes, err := s.noteRepo.ListByChapter(ctx, chapterID, false)
		if err != nil {
			return nil, err
		}
		// 过滤出当前用户的私人笔记
		for _, note := range privateNotes {
			if note.UserID == currentUserID {
				notes = append(notes, note)
			}
		}
	}

	return notes, nil
}

// ListNotesByUser 获取当前用户的段评列表
func (s *NoteService) ListNotesByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]model.Note, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	return s.noteRepo.ListByUser(ctx, userID, offset, pageSize)
}

// UpdateNote 更新段评
func (s *NoteService) UpdateNote(ctx context.Context, id uuid.UUID, req *UpdateNoteRequest, userID uuid.UUID) (*model.Note, error) {
	note, err := s.noteRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNoteNotFound) {
			return nil, ErrNoteNotFound
		}
		return nil, err
	}

	// 检查权限
	if note.UserID != userID {
		return nil, errors.New("unauthorized")
	}

	if req.Body != "" {
		note.Body = req.Body
	}
	if req.IsPublic != nil {
		note.IsPublic = *req.IsPublic
	}

	if err := s.noteRepo.Update(ctx, note); err != nil {
		return nil, err
	}

	return note, nil
}

// DeleteNote 删除段评
func (s *NoteService) DeleteNote(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	note, err := s.noteRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNoteNotFound) {
			return ErrNoteNotFound
		}
		return err
	}

	// 检查权限
	if note.UserID != userID {
		return errors.New("unauthorized")
	}

	return s.noteRepo.Delete(ctx, id)
}

// LikeNote 点赞段评
func (s *NoteService) LikeNote(ctx context.Context, noteID, userID uuid.UUID) error {
	// 检查段评是否存在
	_, err := s.noteRepo.GetByID(ctx, noteID)
	if err != nil {
		if errors.Is(err, repository.ErrNoteNotFound) {
			return ErrNoteNotFound
		}
		return err
	}

	// 检查是否已点赞
	hasLiked, err := s.noteRepo.HasLiked(ctx, noteID, userID)
	if err != nil {
		return err
	}
	if hasLiked {
		return nil // 已点赞，幂等
	}

	// 创建点赞记录
	like := &model.NoteLike{
		NoteID: noteID,
		UserID: userID,
	}
	if err := s.noteRepo.CreateLike(ctx, like); err != nil {
		return err
	}

	// 增加点赞数
	return s.noteRepo.IncrementLikes(ctx, noteID)
}

// UnlikeNote 取消点赞
func (s *NoteService) UnlikeNote(ctx context.Context, noteID, userID uuid.UUID) error {
	// 检查是否已点赞
	hasLiked, err := s.noteRepo.HasLiked(ctx, noteID, userID)
	if err != nil {
		return err
	}
	if !hasLiked {
		return nil // 未点赞，幂等
	}

	// 删除点赞记录
	if err := s.noteRepo.DeleteLike(ctx, noteID, userID); err != nil {
		return err
	}

	// 减少点赞数
	return s.noteRepo.DecrementLikes(ctx, noteID)
}
