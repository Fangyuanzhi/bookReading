package handler

import (
	"errors"
	"strconv"

	"github.com/fangyuanzhi/bookreading-backend/internal/middleware"
	"github.com/fangyuanzhi/bookreading-backend/internal/service"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// BookHandler 书籍处理器
type BookHandler struct {
	bookService *service.BookService
}

// NewBookHandler 创建书籍处理器
func NewBookHandler(bookService *service.BookService) *BookHandler {
	return &BookHandler{bookService: bookService}
}

// Create 创建书籍
// @Summary 创建书籍
// @Description 创建新书籍
// @Tags books
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body service.CreateBookRequest true "书籍信息"
// @Success 200 {object} response.Response{data=model.Book}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Router /books [post]
func (h *BookHandler) Create(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	var req service.CreateBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	book, err := h.bookService.CreateBook(c.Request.Context(), &req, userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, book)
}

// Get 获取书籍详情
// @Summary 获取书籍详情
// @Description 根据ID获取书籍详情
// @Tags books
// @Accept json
// @Produce json
// @Param id path string true "书籍ID"
// @Success 200 {object} response.Response{data=service.BookResponse}
// @Failure 404 {object} response.Response
// @Router /books/{id} [get]
func (h *BookHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid book id")
		return
	}

	book, err := h.bookService.GetBook(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrBookNotFound) {
			response.NotFound(c, "book not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, book)
}

// List 获取书籍列表
// @Summary 获取书籍列表
// @Description 分页获取书籍列表，支持搜索
// @Tags books
// @Accept json
// @Produce json
// @Param page query int false "页码，默认1"
// @Param page_size query int false "每页数量，默认20"
// @Param search query string false "搜索关键词"
// @Success 200 {object} response.Response{data=map[string]interface{}}
// @Router /books [get]
func (h *BookHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")

	books, total, err := h.bookService.ListBooks(c.Request.Context(), page, pageSize, search)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"books": books,
		"total": total,
		"page":  page,
	})
}

// Update 更新书籍
// @Summary 更新书籍
// @Description 更新书籍信息
// @Tags books
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "书籍ID"
// @Param request body service.UpdateBookRequest true "书籍信息"
// @Success 200 {object} response.Response{data=model.Book}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 403 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /books/{id} [put]
func (h *BookHandler) Update(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid book id")
		return
	}

	var req service.UpdateBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	book, err := h.bookService.UpdateBook(c.Request.Context(), id, &req, userID)
	if err != nil {
		if errors.Is(err, service.ErrBookNotFound) {
			response.NotFound(c, "book not found")
			return
		}
		if errors.Is(err, service.ErrUnauthorized) {
			response.Forbidden(c, "unauthorized")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, book)
}

// Delete 删除书籍
// @Summary 删除书籍
// @Description 删除书籍
// @Tags books
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "书籍ID"
// @Success 200 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 403 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /books/{id} [delete]
func (h *BookHandler) Delete(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid book id")
		return
	}

	if err := h.bookService.DeleteBook(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, service.ErrBookNotFound) {
			response.NotFound(c, "book not found")
			return
		}
		if errors.Is(err, service.ErrUnauthorized) {
			response.Forbidden(c, "unauthorized")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// GetChapters 获取书籍章节列表
// @Summary 获取书籍章节列表
// @Description 获取书籍的所有章节
// @Tags books
// @Accept json
// @Produce json
// @Param id path string true "书籍ID"
// @Success 200 {object} response.Response{data=[]model.Chapter}
// @Failure 404 {object} response.Response
// @Router /books/{id}/chapters [get]
func (h *BookHandler) GetChapters(c *gin.Context) {
	bookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid book id")
		return
	}

	chapters, err := h.bookService.GetChaptersByBook(c.Request.Context(), bookID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, chapters)
}

// CreateChapters 批量创建章节
// @Summary 批量创建章节
// @Description 为书籍批量创建章节
// @Tags books
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "书籍ID"
// @Param request body []service.CreateChapterRequest true "章节列表"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 403 {object} response.Response
// @Router /books/{id}/chapters [post]
func (h *BookHandler) CreateChapters(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	bookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid book id")
		return
	}

	var reqs []service.CreateChapterRequest
	if err := c.ShouldBindJSON(&reqs); err != nil {
		response.BadRequest(c, "invalid request: "+err.Error())
		return
	}

	if err := h.bookService.CreateChapters(c.Request.Context(), bookID, reqs, userID); err != nil {
		if errors.Is(err, service.ErrBookNotFound) {
			response.NotFound(c, "book not found")
			return
		}
		if errors.Is(err, service.ErrUnauthorized) {
			response.Forbidden(c, "unauthorized")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, nil)
}
