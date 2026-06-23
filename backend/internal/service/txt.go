package service

import (
	"archive/zip"
	"bytes"
	"fmt"
	"html"
	"io"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
)

var txtChapterPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^[ \t]*第[ \t]*[0-9一二三四五六七八九十百千零〇两]+[ \t]*章[ \t]*.*$`),
	regexp.MustCompile(`(?m)^[ \t]*Chapter[ \t]+[0-9IVXLCivxlc]+[ \t]*.*$`),
	regexp.MustCompile(`(?m)^[ \t]*BOOK[ \t]+[0-9IVXLCivxlc]+[ \t]*.*$`),
	regexp.MustCompile(`(?m)^[ \t]*第[ \t]*[0-9]+[ \t]*节[ \t]*.*$`),
}

// TXTImportOptions TXT 导入时的可选元数据
type TXTImportOptions struct {
	Title    string
	Author   string
	Language string
}

// ParseTXT 将 TXT 文本拆分为章节
func ParseTXT(data []byte, filename string, opts TXTImportOptions) (*EPUBMetadata, []EPUBChapter, error) {
	text, err := decodeText(data)
	if err != nil {
		return nil, nil, fmt.Errorf("decode text: %w", err)
	}

	text = normalizeText(text)
	chapters := splitTXTChapters(text, filename)
	if len(chapters) == 0 {
		return nil, nil, fmt.Errorf("empty text file")
	}

	meta := &EPUBMetadata{
		Title:    opts.Title,
		Author:   opts.Author,
		Language: opts.Language,
	}
	if meta.Title == "" {
		meta.Title = strings.TrimSuffix(filepath.Base(filename), filepath.Ext(filename))
	}
	if meta.Language == "" {
		meta.Language = detectLanguage(text)
	}

	return meta, chapters, nil
}

// BuildEPUB 从章节数据生成 EPUB 二进制
func BuildEPUB(meta *EPUBMetadata, chapters []EPUBChapter) ([]byte, error) {
	if meta == nil {
		meta = &EPUBMetadata{}
	}
	if meta.Title == "" {
		meta.Title = "Untitled"
	}
	if meta.Language == "" {
		meta.Language = "zh"
	}

	buf := new(bytes.Buffer)
	zw := zip.NewWriter(buf)

	if err := writeEPUBFile(zw, "mimetype", []byte("application/epub+zip"), true); err != nil {
		return nil, err
	}

	container := `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
	if err := writeEPUBFile(zw, "META-INF/container.xml", []byte(container), false); err != nil {
		return nil, err
	}

	manifestItems := strings.Builder{}
	spineItems := strings.Builder{}
	navPoints := strings.Builder{}

	for i, ch := range chapters {
		idx := i + 1
		fileName := fmt.Sprintf("chapter%03d.xhtml", idx)
		itemID := fmt.Sprintf("chapter%d", idx)
		href := fileName

		title := ch.Title
		if title == "" {
			title = fmt.Sprintf("Chapter %d", idx)
		}

		xhtml := buildChapterXHTML(title, ch.Content)
		if err := writeEPUBFile(zw, "OEBPS/"+fileName, []byte(xhtml), false); err != nil {
			return nil, err
		}

		manifestItems.WriteString(fmt.Sprintf(
			`<item id="%s" href="%s" media-type="application/xhtml+xml"/>`,
			itemID, href,
		))
		spineItems.WriteString(fmt.Sprintf(`<itemref idref="%s"/>`, itemID))
		navPoints.WriteString(fmt.Sprintf(
			`<navPoint id="nav%d" playOrder="%d"><navLabel><text>%s</text></navLabel><content src="%s"/></navPoint>`,
			idx, idx, html.EscapeString(title), href,
		))
	}

	opf := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>%s</dc:title>
    <dc:creator>%s</dc:creator>
    <dc:language>%s</dc:language>
    <dc:description>%s</dc:description>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    %s
  </manifest>
  <spine toc="ncx">
    %s
  </spine>
</package>`,
		html.EscapeString(meta.Title),
		html.EscapeString(meta.Author),
		html.EscapeString(meta.Language),
		html.EscapeString(meta.Description),
		manifestItems.String(),
		spineItems.String(),
	)
	if err := writeEPUBFile(zw, "OEBPS/content.opf", []byte(opf), false); err != nil {
		return nil, err
	}

	ncx := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="bookreading-txt"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>%s</text></docTitle>
  <navMap>%s</navMap>
</ncx>`, html.EscapeString(meta.Title), navPoints.String())
	if err := writeEPUBFile(zw, "OEBPS/toc.ncx", []byte(ncx), false); err != nil {
		return nil, err
	}

	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// TXTToEPUB 解析 TXT 并生成 EPUB
func TXTToEPUB(data []byte, filename string, opts TXTImportOptions) ([]byte, *EPUBMetadata, []EPUBChapter, error) {
	meta, chapters, err := ParseTXT(data, filename, opts)
	if err != nil {
		return nil, nil, nil, err
	}

	epubBytes, err := BuildEPUB(meta, chapters)
	if err != nil {
		return nil, nil, nil, err
	}
	return epubBytes, meta, chapters, nil
}

func writeEPUBFile(zw *zip.Writer, name string, data []byte, store bool) error {
	method := zip.Deflate
	if store {
		method = zip.Store
	}
	h := &zip.FileHeader{
		Name:   name,
		Method: uint16(method),
	}
	h.SetModTime(time.Now())
	w, err := zw.CreateHeader(h)
	if err != nil {
		return err
	}
	_, err = w.Write(data)
	return err
}

func buildChapterXHTML(title, content string) string {
	paragraphs := strings.Split(content, "\n")
	var body strings.Builder
	for _, p := range paragraphs {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		body.WriteString("<p>")
		body.WriteString(html.EscapeString(p))
		body.WriteString("</p>\n")
	}
	if body.Len() == 0 {
		body.WriteString("<p>")
		body.WriteString(html.EscapeString(strings.TrimSpace(content)))
		body.WriteString("</p>")
	}

	return fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>%s</title></head>
<body>
<h1>%s</h1>
%s
</body>
</html>`, html.EscapeString(title), html.EscapeString(title), body.String())
}

func decodeText(data []byte) (string, error) {
	if len(data) >= 3 && data[0] == 0xEF && data[1] == 0xBB && data[2] == 0xBF {
		data = data[3:]
	}
	if utf8.Valid(data) {
		return string(data), nil
	}

	reader := transform.NewReader(bytes.NewReader(data), simplifiedchinese.GBK.NewDecoder())
	decoded, err := io.ReadAll(reader)
	if err != nil {
		return "", err
	}
	if !utf8.Valid(decoded) {
		return "", fmt.Errorf("unsupported text encoding")
	}
	return string(decoded), nil
}

func normalizeText(text string) string {
	text = strings.ReplaceAll(text, "\r\n", "\n")
	text = strings.ReplaceAll(text, "\r", "\n")
	return strings.TrimSpace(text)
}

func splitTXTChapters(text, filename string) []EPUBChapter {
	for _, pattern := range txtChapterPatterns {
		locs := pattern.FindAllStringIndex(text, -1)
		if len(locs) >= 2 {
			return buildChaptersFromMarkers(text, locs, pattern)
		}
		if len(locs) == 1 {
			// 只有一个章节标记时，把前文作为序章
			return buildChaptersFromSingleMarker(text, locs[0], pattern)
		}
	}

	title := strings.TrimSuffix(filepath.Base(filename), filepath.Ext(filename))
	if title == "" {
		title = "正文"
	}
	return []EPUBChapter{{
		Title:   title,
		Content: text,
		Href:    "chapter001.xhtml",
		Index:   0,
	}}
}

func buildChaptersFromMarkers(text string, locs [][]int, pattern *regexp.Regexp) []EPUBChapter {
	chapters := make([]EPUBChapter, 0, len(locs))
	for i, loc := range locs {
		start := loc[0]
		end := len(text)
		if i+1 < len(locs) {
			end = locs[i+1][0]
		}

		block := strings.TrimSpace(text[start:end])
		titleLine := strings.TrimSpace(pattern.FindString(block))
		content := strings.TrimSpace(strings.TrimPrefix(block, titleLine))
		if content == "" {
			content = block
		}

		chapters = append(chapters, EPUBChapter{
			Title:   titleLine,
			Content: content,
			Href:    fmt.Sprintf("chapter%03d.xhtml", i+1),
			Index:   i,
		})
	}
	return chapters
}

func buildChaptersFromSingleMarker(text string, loc []int, pattern *regexp.Regexp) []EPUBChapter {
	chapters := make([]EPUBChapter, 0, 2)

	prefix := strings.TrimSpace(text[:loc[0]])
	if prefix != "" {
		chapters = append(chapters, EPUBChapter{
			Title:   "序",
			Content: prefix,
			Href:    "chapter001.xhtml",
			Index:   0,
		})
	}

	block := strings.TrimSpace(text[loc[0]:])
	titleLine := strings.TrimSpace(pattern.FindString(block))
	content := strings.TrimSpace(strings.TrimPrefix(block, titleLine))
	chapters = append(chapters, EPUBChapter{
		Title:   titleLine,
		Content: content,
		Href:    fmt.Sprintf("chapter%03d.xhtml", len(chapters)+1),
		Index:   len(chapters),
	})
	return chapters
}

func detectLanguage(text string) string {
	for _, r := range text {
		if r >= 0x4E00 && r <= 0x9FFF {
			return "zh"
		}
	}
	return "en"
}
