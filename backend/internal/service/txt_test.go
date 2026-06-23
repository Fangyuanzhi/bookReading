package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseTXT_ChineseChapters(t *testing.T) {
	text := `序章内容在这里。

第一章 开端
这是第一章正文。

第二章 发展
这是第二章正文。`

	meta, chapters, err := ParseTXT([]byte(text), "demo.txt", TXTImportOptions{})
	require.NoError(t, err)
	assert.Equal(t, "demo", meta.Title)
	assert.GreaterOrEqual(t, len(chapters), 2)
}

func TestParseTXT_SingleChapter(t *testing.T) {
	text := "这是一本没有章节标记的书。\n\n第二段内容。"
	meta, chapters, err := ParseTXT([]byte(text), "plain.txt", TXTImportOptions{Title: "测试书"})
	require.NoError(t, err)
	assert.Equal(t, "测试书", meta.Title)
	assert.Len(t, chapters, 1)
}

func TestBuildEPUB_RoundTrip(t *testing.T) {
	meta := &EPUBMetadata{Title: "The Republic", Author: "Plato", Language: "en"}
	chapters := []EPUBChapter{
		{Title: "Book I", Content: "First chapter content.", Href: "chapter001.xhtml", Index: 0},
		{Title: "Book II", Content: "Second chapter content.", Href: "chapter002.xhtml", Index: 1},
	}

	epubBytes, err := BuildEPUB(meta, chapters)
	require.NoError(t, err)
	require.NotEmpty(t, epubBytes)

	parsedMeta, parsedChapters, err := ParseEPUB(&bytesReaderAt{data: epubBytes}, int64(len(epubBytes)))
	require.NoError(t, err)
	assert.Equal(t, "The Republic", parsedMeta.Title)
	assert.GreaterOrEqual(t, len(parsedChapters), 2)
}

func TestTXTToEPUB(t *testing.T) {
	text := "第一章 测试\n\n段落一。\n\n段落二。"
	epubBytes, meta, chapters, err := TXTToEPUB([]byte(text), "book.txt", TXTImportOptions{Author: "Anonymous"})
	require.NoError(t, err)
	assert.NotEmpty(t, epubBytes)
	assert.Equal(t, "book", meta.Title)
	assert.NotEmpty(t, chapters)
}
