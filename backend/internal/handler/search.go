package handler

import (
	"strconv"

	"github.com/fangyuanzhi/bookreading-backend/internal/service"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// SearchHandler 搜索处理器
type SearchHandler struct {
	searchService *service.SearchService
}

// NewSearchHandler 创建搜索处理器
func NewSearchHandler(searchService *service.SearchService) *SearchHandler {
	return &SearchHandler{searchService: searchService}
}

// Search 全局搜索
// @Summary 全局搜索
// @Description 搜索书籍、段评、书评
// @Tags search
// @Accept json
// @Produce json
// @Param q query string true "搜索关键词"
// @Param type query string false "搜索类型: all, book, note, review"
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Success 200 {object} response.Response{data=service.SearchResult}
// @Router /search [get]
func (h *SearchHandler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		response.BadRequest(c, "search query is required")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	searchType := c.DefaultQuery("type", "all")

	req := &service.SearchRequest{
		Query:    query,
		Type:     searchType,
		Page:     page,
		PageSize: pageSize,
	}

	result, err := h.searchService.Search(c.Request.Context(), req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, result)
}

// Suggest 搜索建议
// @Summary 搜索建议
// @Description 获取搜索建议
// @Tags search
// @Accept json
// @Produce json
// @Param q query string true "搜索关键词"
// @Param limit query int false "建议数量"
// @Success 200 {object} response.Response{data=[]string}
// @Router /search/suggest [get]
func (h *SearchHandler) Suggest(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		response.Success(c, []string{})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))

	suggestions, err := h.searchService.Suggest(c.Request.Context(), query, limit)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, suggestions)
}

// HotBooks 热门书籍
// @Summary 热门书籍
// @Description 获取热门书籍
// @Tags search
// @Accept json
// @Produce json
// @Param limit query int false "数量"
// @Success 200 {object} response.Response{data=[]model.Book}
// @Router /books/hot [get]
func (h *SearchHandler) HotBooks(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	books, err := h.searchService.GetHotBooks(c.Request.Context(), limit)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, books)
}

// NewBooks 新书
// @Summary 新书
// @Description 获取新书
// @Tags search
// @Accept json
// @Produce json
// @Param limit query int false "数量"
// @Success 200 {object} response.Response{data=[]model.Book}
// @Router /books/new [get]
func (h *SearchHandler) NewBooks(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	books, err := h.searchService.GetNewBooks(c.Request.Context(), limit)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, books)
}
