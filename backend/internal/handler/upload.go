package handler

import (
	"io"
	"path/filepath"
	"strings"

	"github.com/fangyuanzhi/bookreading-backend/internal/middleware"
	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/internal/service"
	"github.com/fangyuanzhi/bookreading-backend/pkg/logger"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

const maxUploadSize = 50 * 1024 * 1024

// UploadHandler 文件上传处理器
type UploadHandler struct {
	bookService *service.BookService
}

// NewUploadHandler 创建上传处理器
func NewUploadHandler(bookService *service.BookService) *UploadHandler {
	return &UploadHandler{bookService: bookService}
}

// UploadBook 上传 EPUB / TXT 并导入书籍（TXT 会自动转为 EPUB）
// @Summary 上传书籍文件
// @Tags upload
// @Accept multipart/form-data
// @Produce json
// @Security Bearer
// @Param file formData file true "EPUB 或 TXT 文件"
// @Param title formData string false "书名（可选，覆盖文件内元数据）"
// @Param author formData string false "作者（可选）"
// @Param language formData string false "语言（可选，如 zh / en）"
// @Param license_note formData string false "版权说明"
// @Router /upload/book [post]
func (h *UploadHandler) UploadBook(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "请选择要上传的文件")
		return
	}
	defer file.Close()

	if header.Size > maxUploadSize {
		response.BadRequest(c, "文件大小不能超过 50MB")
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".epub" && ext != ".txt" {
		response.BadRequest(c, "仅支持 .epub 和 .txt 格式")
		return
	}

	fileContent, err := io.ReadAll(file)
	if err != nil {
		response.InternalError(c, "读取文件失败")
		return
	}

	overrides := buildUploadOverrides(c)

	var result *service.ImportBookResult
	switch ext {
	case ".epub":
		result, err = h.bookService.ImportFromEPUB(c.Request.Context(), userID, fileContent, overrides)
	case ".txt":
		result, err = h.bookService.ImportFromTXT(c.Request.Context(), userID, fileContent, header.Filename, overrides)
	}
	if err != nil {
		logger.Warn("book upload failed",
			append(logger.HTTPFields(c),
				logger.String("filename", header.Filename),
				logger.String("format", ext),
				logger.Err(err),
			)...,
		)
		response.BadRequest(c, err.Error())
		return
	}

	logger.Info("book uploaded",
		append(logger.HTTPFields(c),
			logger.String("book_id", result.Book.ID.String()),
			logger.String("format", result.SourceFormat),
			logger.Bool("converted", result.Converted),
			logger.Int("chapters", result.ChaptersCount),
		)...,
	)

	response.Success(c, gin.H{
		"book":           result.Book,
		"chapters_count": result.ChaptersCount,
		"source_format":  result.SourceFormat,
		"converted":      result.Converted,
	})
}

// UploadEPUB 兼容旧接口
func (h *UploadHandler) UploadEPUB(c *gin.Context) {
	h.UploadBook(c)
}

func buildUploadOverrides(c *gin.Context) *service.CreateBookRequest {
	title := strings.TrimSpace(c.PostForm("title"))
	author := strings.TrimSpace(c.PostForm("author"))
	language := strings.TrimSpace(c.PostForm("language"))
	licenseNote := strings.TrimSpace(c.PostForm("license_note"))

	if title == "" && author == "" && language == "" && licenseNote == "" {
		return nil
	}

	req := &service.CreateBookRequest{
		Title:       title,
		Author:      author,
		Language:    language,
		LicenseNote: licenseNote,
		Source:      model.BookSourcePublicDomain,
	}
	return req
}
