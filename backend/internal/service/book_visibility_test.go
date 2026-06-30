package service

import (
	"testing"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestCanViewBook(t *testing.T) {
	s := &BookService{}
	authorID := uuid.New()
	otherID := uuid.New()

	published := &model.Book{Status: model.BookStatusPublished}
	draft := &model.Book{Status: model.BookStatusDraft, CreatedBy: &authorID}

	assert.True(t, s.canViewBook(published, uuid.Nil))
	assert.True(t, s.canViewBook(published, otherID))

	assert.False(t, s.canViewBook(draft, uuid.Nil))
	assert.False(t, s.canViewBook(draft, otherID))
	assert.True(t, s.canViewBook(draft, authorID))
}
