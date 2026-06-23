package service

import (
	"context"
	"io"

	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/google/uuid"
)

// ImportBookResult 导入书籍结果
type ImportBookResult struct {
	Book          *BookResponse
	ChaptersCount int
	Converted     bool
	SourceFormat  string
}

// ImportFromEPUB 从 EPUB 二进制导入书籍
func (s *BookService) ImportFromEPUB(
	ctx context.Context,
	userID uuid.UUID,
	fileContent []byte,
	overrides *CreateBookRequest,
) (*ImportBookResult, error) {
	metadata, chapters, err := ParseEPUB(
		&bytesReaderAt{data: fileContent},
		int64(len(fileContent)),
	)
	if err != nil {
		return nil, err
	}

	return s.importParsedBook(ctx, userID, metadata, chapters, overrides, false, "epub")
}

// ImportFromTXT 将 TXT 转为 EPUB 后导入
func (s *BookService) ImportFromTXT(
	ctx context.Context,
	userID uuid.UUID,
	fileContent []byte,
	filename string,
	overrides *CreateBookRequest,
) (*ImportBookResult, error) {
	opts := TXTImportOptions{
		Title:    "",
		Author:   "",
		Language: "",
	}
	if overrides != nil {
		opts.Title = overrides.Title
		opts.Author = overrides.Author
		opts.Language = overrides.Language
	}

	epubBytes, metadata, chapters, err := TXTToEPUB(fileContent, filename, opts)
	if err != nil {
		return nil, err
	}

	// 用生成的 EPUB 再走一遍解析，保证与 EPUB 上传路径一致
	parsedMeta, parsedChapters, err := ParseEPUB(
		&bytesReaderAt{data: epubBytes},
		int64(len(epubBytes)),
	)
	if err != nil {
		// 回退到 TXT 直接解析结果
		parsedMeta = metadata
		parsedChapters = chapters
	}

	return s.importParsedBook(ctx, userID, parsedMeta, parsedChapters, overrides, true, "txt")
}

func (s *BookService) importParsedBook(
	ctx context.Context,
	userID uuid.UUID,
	metadata *EPUBMetadata,
	chapters []EPUBChapter,
	overrides *CreateBookRequest,
	converted bool,
	sourceFormat string,
) (*ImportBookResult, error) {
	bookReq := &CreateBookRequest{
		Title:       metadata.Title,
		Author:      metadata.Author,
		Description: metadata.Description,
		Language:    metadata.Language,
		Source:      model.BookSourcePublicDomain,
	}
	if overrides != nil {
		if overrides.Title != "" {
			bookReq.Title = overrides.Title
		}
		if overrides.Author != "" {
			bookReq.Author = overrides.Author
		}
		if overrides.Description != "" {
			bookReq.Description = overrides.Description
		}
		if overrides.Language != "" {
			bookReq.Language = overrides.Language
		}
		if overrides.Source != "" {
			bookReq.Source = overrides.Source
		}
		if overrides.LicenseNote != "" {
			bookReq.LicenseNote = overrides.LicenseNote
		}
	}
	if bookReq.Language == "" {
		bookReq.Language = "zh"
	}

	book, err := s.CreateBook(ctx, bookReq, userID)
	if err != nil {
		return nil, err
	}

	if len(chapters) > 0 {
		chapterReqs := make([]CreateChapterRequest, len(chapters))
		for i, ch := range chapters {
			chapterReqs[i] = CreateChapterRequest{
				Title:   ch.Title,
				Idx:     ch.Index,
				Href:    ch.Href,
				Content: ch.Content,
			}
		}
		if err := s.CreateChapters(ctx, book.ID, chapterReqs, userID); err != nil {
			return nil, err
		}
	}

	bookDetail, err := s.GetBook(ctx, book.ID)
	if err != nil {
		return nil, err
	}

	return &ImportBookResult{
		Book:          bookDetail,
		ChaptersCount: len(chapters),
		Converted:     converted,
		SourceFormat:  sourceFormat,
	}, nil
}

type bytesReaderAt struct {
	data []byte
}

func (r *bytesReaderAt) ReadAt(p []byte, off int64) (n int, err error) {
	if off >= int64(len(r.data)) {
		return 0, io.EOF
	}
	n = copy(p, r.data[off:])
	if n < len(p) {
		err = io.EOF
	}
	return
}
