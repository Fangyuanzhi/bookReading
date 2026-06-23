package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestParseChapter 测试章节解析
func TestParseChapter(t *testing.T) {
	html := `
		<html>
			<head><title>Test Chapter</title></head>
			<body>
				<h1>Chapter Title</h1>
				<p>This is the content.</p>
			</body>
		</html>
	`

	title, content := parseChapter([]byte(html))

	// 解析器会找到第一个 h1/h2/title
	assert.True(t, title == "Chapter Title" || title == "Test Chapter")
	assert.NotEmpty(t, title)
	assert.Contains(t, content, "This is the content")
}

// TestIsHTML 测试 HTML 文件判断
func TestIsHTML(t *testing.T) {
	tests := []struct {
		href     string
		expected bool
	}{
		{"chapter.html", true},
		{"chapter.xhtml", true},
		{"chapter.htm", true},
		{"chapter.xml", false},
		{"image.jpg", false},
		{"style.css", false},
	}

	for _, tt := range tests {
		t.Run(tt.href, func(t *testing.T) {
			result := isHTML(tt.href)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestParseContainerXML 测试 container.xml 解析
func TestParseContainerXML(t *testing.T) {
	xml := `<?xml version="1.0"?>
	<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
		<rootfiles>
			<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
		</rootfiles>
	</container>`

	path := parseContainerXML([]byte(xml))
	assert.Equal(t, "OEBPS/content.opf", path)
}

// TestParseContainerXML_Empty 测试空 container.xml
func TestParseContainerXML_Empty(t *testing.T) {
	xml := `<?xml version="1.0"?>
	<container version="1.0">
		<rootfiles>
		</rootfiles>
	</container>`

	path := parseContainerXML([]byte(xml))
	assert.Empty(t, path)
}
