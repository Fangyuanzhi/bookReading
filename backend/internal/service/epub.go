package service

import (
	"archive/zip"
	"encoding/xml"
	"fmt"
	"io"
	"path/filepath"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// EPUBParser EPUB 解析器
type EPUBParser struct {
	reader *zip.ReadCloser
}

// EPUBMetadata EPUB 元数据
type EPUBMetadata struct {
	Title       string `json:"title"`
	Author      string `json:"author"`
	Description string `json:"description"`
	Language    string `json:"language"`
	Cover       string `json:"cover"`
}

// EPUBChapter EPUB 章节
type EPUBChapter struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Href    string `json:"href"`
	Content string `json:"content"`
	Index   int    `json:"index"`
}

// ParseEPUB 解析 EPUB 文件
func ParseEPUB(r io.ReaderAt, size int64) (*EPUBMetadata, []EPUBChapter, error) {
	// 打开 ZIP
	zr, err := zip.NewReader(r, size)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to open epub: %w", err)
	}

	// 找到 container.xml
	containerFile, err := findFile(zr, "META-INF/container.xml")
	if err != nil {
		return nil, nil, fmt.Errorf("container.xml not found: %w", err)
	}

	// 解析 container.xml 找到 OPF 路径
	containerData, err := readFile(containerFile)
	if err != nil {
		return nil, nil, err
	}

	opfPath := parseContainerXML(containerData)
	if opfPath == "" {
		return nil, nil, fmt.Errorf("opf path not found")
	}

	// 解析 OPF
	opfFile, err := findFile(zr, opfPath)
	if err != nil {
		return nil, nil, fmt.Errorf("opf file not found: %w", err)
	}

	opfData, err := readFile(opfFile)
	if err != nil {
		return nil, nil, err
	}

	metadata, spine, manifest, err := parseOPF(opfData)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse opf: %w", err)
	}

	// 获取 OPF 所在目录
	opfDir := filepath.Dir(opfPath)

	// 解析章节
	chapters := make([]EPUBChapter, 0)
	for i, itemRef := range spine {
		item, ok := manifest[itemRef]
		if !ok {
			continue
		}

		// 只处理 HTML/XHTML
		if !isHTML(item.Href) {
			continue
		}

		// 读取章节内容
		chapterPath := filepath.Join(opfDir, item.Href)
		chapterFile, err := findFile(zr, chapterPath)
		if err != nil {
			continue
		}

		chapterData, err := readFile(chapterFile)
		if err != nil {
			continue
		}

		// 解析章节标题和内容
		title, content := parseChapter(chapterData)

		chapters = append(chapters, EPUBChapter{
			ID:      item.ID,
			Title:   title,
			Href:    item.Href,
			Content: content,
			Index:   i,
		})
	}

	return metadata, chapters, nil
}

// findFile 在 ZIP 中查找文件
func findFile(zr *zip.Reader, name string) (*zip.File, error) {
	for _, f := range zr.File {
		if f.Name == name {
			return f, nil
		}
	}
	return nil, fmt.Errorf("file not found: %s", name)
}

// readFile 读取文件内容
func readFile(f *zip.File) ([]byte, error) {
	rc, err := f.Open()
	if err != nil {
		return nil, err
	}
	defer rc.Close()

	return io.ReadAll(rc)
}

// parseContainerXML 解析 container.xml
func parseContainerXML(data []byte) string {
	type Container struct {
		Rootfiles struct {
			Rootfile []struct {
				FullPath string `xml:"full-path,attr"`
			} `xml:"rootfile"`
		} `xml:"rootfiles"`
	}

	var container Container
	if err := xml.Unmarshal(data, &container); err != nil {
		return ""
	}

	if len(container.Rootfiles.Rootfile) > 0 {
		return container.Rootfiles.Rootfile[0].FullPath
	}
	return ""
}

// OPFItem OPF manifest item
type OPFItem struct {
	ID        string `xml:"id,attr"`
	Href      string `xml:"href,attr"`
	MediaType string `xml:"media-type,attr"`
}

// OPFItemRef OPF spine itemref
type OPFItemRef struct {
	IDRef string `xml:"idref,attr"`
}

// parseOPF 解析 OPF 文件
func parseOPF(data []byte) (*EPUBMetadata, []string, map[string]OPFItem, error) {
	type OPF struct {
		Metadata struct {
			Title       []string `xml:"title"`
			Creator     []string `xml:"creator"`
			Description []string `xml:"description"`
			Language    []string `xml:"language"`
		} `xml:"metadata"`
		Manifest struct {
			Items []OPFItem `xml:"item"`
		} `xml:"manifest"`
		Spine struct {
			ItemRefs []OPFItemRef `xml:"itemref"`
		} `xml:"spine"`
	}

	var opf OPF
	if err := xml.Unmarshal(data, &opf); err != nil {
		return nil, nil, nil, err
	}

	metadata := &EPUBMetadata{}
	if len(opf.Metadata.Title) > 0 {
		metadata.Title = opf.Metadata.Title[0]
	}
	if len(opf.Metadata.Creator) > 0 {
		metadata.Author = opf.Metadata.Creator[0]
	}
	if len(opf.Metadata.Description) > 0 {
		metadata.Description = opf.Metadata.Description[0]
	}
	if len(opf.Metadata.Language) > 0 {
		metadata.Language = opf.Metadata.Language[0]
	}

	// 构建 manifest map
	manifest := make(map[string]OPFItem)
	for _, item := range opf.Manifest.Items {
		manifest[item.ID] = item
	}

	// 构建 spine
	spine := make([]string, 0)
	for _, ref := range opf.Spine.ItemRefs {
		spine = append(spine, ref.IDRef)
	}

	return metadata, spine, manifest, nil
}

// isHTML 检查是否是 HTML 文件
func isHTML(href string) bool {
	ext := strings.ToLower(filepath.Ext(href))
	return ext == ".html" || ext == ".xhtml" || ext == ".htm"
}

// parseChapter 解析章节内容
func parseChapter(data []byte) (string, string) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(data)))
	if err != nil {
		return "", string(data)
	}

	// 提取标题
	title := doc.Find("h1, h2, title").First().Text()

	// 提取正文内容
	content := doc.Find("body").Text()
	if content == "" {
		content = doc.Text()
	}

	// 清理空白
	content = strings.TrimSpace(content)

	return title, content
}
