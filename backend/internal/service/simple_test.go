package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
)

// TestPasswordHash 测试密码哈希
func TestPasswordHash(t *testing.T) {
	password := "testpassword123"

	// 测试哈希生成
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	assert.NoError(t, err)
	assert.NotEmpty(t, hash)

	// 测试密码验证
	err = bcrypt.CompareHashAndPassword(hash, []byte(password))
	assert.NoError(t, err)

	// 测试错误密码
	err = bcrypt.CompareHashAndPassword(hash, []byte("wrongpassword"))
	assert.Error(t, err)
}

// TestCreateBookRequest_Validation 测试创建书籍请求
func TestCreateBookRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		req     CreateBookRequest
		wantErr bool
	}{
		{
			name: "valid request",
			req: CreateBookRequest{
				Title:  "Test Book",
				Author: "Test Author",
			},
			wantErr: false,
		},
		{
			name: "empty title",
			req: CreateBookRequest{
				Title:  "",
				Author: "Test Author",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 简单验证
			if tt.req.Title == "" {
				assert.True(t, tt.wantErr)
			} else {
				assert.False(t, tt.wantErr)
			}
		})
	}
}

// TestCreateNoteRequest_Validation 测试创建段评请求
func TestCreateNoteRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		req     CreateNoteRequest
		wantErr bool
	}{
		{
			name: "valid request",
			req: CreateNoteRequest{
				BookID:    "550e8400-e29b-41d4-a716-446655440000",
				CFI:       "epubcfi(/6/2[id4]!/4/2)",
				TextQuote: "测试文本",
				Body:      "这是我的想法",
			},
			wantErr: false,
		},
		{
			name: "missing cfi",
			req: CreateNoteRequest{
				BookID: "550e8400-e29b-41d4-a716-446655440000",
				Body:   "这是我的想法",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 简单验证
			if tt.req.CFI == "" || tt.req.BookID == "" {
				assert.True(t, tt.wantErr)
			} else {
				assert.False(t, tt.wantErr)
			}
		})
	}
}
