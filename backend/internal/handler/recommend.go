package handler

import (
	"strconv"

	"github.com/fangyuanzhi/bookreading-backend/internal/service"
	"github.com/fangyuanzhi/bookreading-backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RecommendHandler 推荐处理器
type RecommendHandler struct {
	recommendService *service.RecommendService
}

// NewRecommendHandler 创建推荐处理器
func NewRecommendHandler(recommendService *service.RecommendService) *RecommendHandler {
	return &RecommendHandler{recommendService: recommendService}
}

// Recommend 获取推荐
// @Summary 获取推荐
// @Description 获取个性化推荐书籍
// @Tags recommend
// @Accept json
// @Produce json
// @Security Bearer
// @Param type query string false "推荐类型: personalized, popular, similar, new"
// @Param limit query int false "数量"
// @Success 200 {object} response.Response{data=service.RecommendResult}
// @Router /recommend [get]
func (h *RecommendHandler) Recommend(c *gin.Context) {
	// 获取用户ID（可选）
	var userID uuid.UUID
	if id, exists := c.Get("userID"); exists {
		userID, _ = uuid.Parse(id.(string))
	}

	recommendType := c.DefaultQuery("type", "personalized")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	req := &service.RecommendRequest{
		UserID: userID,
		Type:   recommendType,
		Limit:  limit,
	}

	result, err := h.recommendService.Recommend(c.Request.Context(), req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, result)
}

// DailyRecommend 每日推荐
// @Summary 每日推荐
// @Description 获取每日推荐（每天结果一致）
// @Tags recommend
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} response.Response{data=service.RecommendResult}
// @Router /recommend/daily [get]
func (h *RecommendHandler) DailyRecommend(c *gin.Context) {
	var userID uuid.UUID
	if id, exists := c.Get("userID"); exists {
		userID, _ = uuid.Parse(id.(string))
	}

	result, err := h.recommendService.GetDailyRecommend(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, result)
}

// Trending 趋势书籍
// @Summary 趋势书籍
// @Description 获取趋势上升的书籍
// @Tags recommend
// @Accept json
// @Produce json
// @Param limit query int false "数量"
// @Success 200 {object} response.Response{data=service.RecommendResult}
// @Router /recommend/trending [get]
func (h *RecommendHandler) Trending(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	result, err := h.recommendService.GetTrendingBooks(c.Request.Context(), limit)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, result)
}

// EditorPicks 编辑精选
// @Summary 编辑精选
// @Description 获取编辑精选书籍
// @Tags recommend
// @Accept json
// @Produce json
// @Param limit query int false "数量"
// @Success 200 {object} response.Response{data=service.RecommendResult}
// @Router /recommend/editor [get]
func (h *RecommendHandler) EditorPicks(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	result, err := h.recommendService.GetEditorPicks(c.Request.Context(), limit)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, result)
}
