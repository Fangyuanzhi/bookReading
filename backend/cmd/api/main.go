package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/fangyuanzhi/bookreading-backend/internal/config"
	"github.com/fangyuanzhi/bookreading-backend/internal/database"
	"github.com/fangyuanzhi/bookreading-backend/internal/handler"
	"github.com/fangyuanzhi/bookreading-backend/internal/middleware"
	"github.com/fangyuanzhi/bookreading-backend/internal/repository"
	"github.com/fangyuanzhi/bookreading-backend/internal/service"
	"github.com/fangyuanzhi/bookreading-backend/pkg/centrifugo"
	"github.com/fangyuanzhi/bookreading-backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// 版本信息
var (
	Version   = "1.0.0"
	BuildTime = "2026-06-20"
)

func main() {
	// 加载配置
	cfg, err := config.Load("config.yaml")
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// 初始化日志
	if err := logger.Init(logger.Config{
		Level:  cfg.Log.Level,
		Format: cfg.Log.Format,
		File:   cfg.Log.File,
	}); err != nil {
		fmt.Printf("Failed to init logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	logger.Info("starting server",
		logger.String("name", cfg.App.Name),
		logger.String("version", cfg.App.Version),
		logger.Int("port", cfg.App.Port),
	)

	if cfg.App.Mode == "release" && (cfg.JWT.Secret == "" || cfg.JWT.Secret == "your-secret-key-change-in-production") {
		logger.Warn("JWT secret is using default value; set JWT_SECRET in production")
	}

	// 初始化数据库
	if err := database.Init(&cfg.Database, cfg.Log.Level); err != nil {
		logger.Fatal("failed to init database", logger.Err(err))
	}
	defer database.Close()

	// 自动迁移
	if err := database.AutoMigrate(); err != nil {
		logger.Fatal("failed to migrate database", logger.Err(err))
	}

	// 初始化仓库
	userRepo := repository.NewUserRepository(database.GetDB())
	bookRepo := repository.NewBookRepository(database.GetDB())
	noteRepo := repository.NewNoteRepository(database.GetDB())
	reviewRepo := repository.NewReviewRepository(database.GetDB())
	paymentRepo := repository.NewPaymentRepository(database.GetDB())
	progressRepo := repository.NewProgressRepository(database.GetDB())
	reportRepo := repository.NewReportRepository(database.GetDB())
	groupRepo := repository.NewGroupRepository(database.GetDB())
	shelfRepo := repository.NewShelfRepository(database.GetDB())
	followRepo := repository.NewFollowRepository(database.GetDB())

	// 初始化 Redis 客户端
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Addr(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})

	// 初始化 Centrifugo 客户端
	centrifugoClient := centrifugo.NewClient(&cfg.Centrifugo)

	// 初始化服务
	authService := service.NewAuthService(userRepo, &cfg.JWT)
	paymentService := service.NewPaymentService(paymentRepo, bookRepo)
	bookService := service.NewBookService(bookRepo, paymentService)
	noteService := service.NewNoteService(noteRepo, centrifugoClient)
	reviewService := service.NewReviewService(reviewRepo, centrifugoClient)
	presenceService := service.NewPresenceService(rdb, centrifugoClient)
	searchService := service.NewSearchService(bookRepo, noteRepo, reviewRepo)
	recommendService := service.NewRecommendService(bookRepo, userRepo)
	discoverService := service.NewDiscoverService(bookRepo, noteRepo, reviewRepo, userRepo, groupRepo, recommendService)
	progressService := service.NewProgressService(progressRepo, bookRepo)
	reportService := service.NewReportService(reportRepo, bookRepo, noteRepo, reviewRepo)
	groupService := service.NewGroupService(groupRepo, bookRepo)
	shelfService := service.NewShelfService(shelfRepo, bookRepo, progressRepo, paymentService)
	socialService := service.NewSocialService(followRepo, userRepo, noteRepo, reviewRepo)

	// 初始化处理器
	authHandler := handler.NewAuthHandler(authService)
	bookHandler := handler.NewBookHandler(bookService)
	chapterHandler := handler.NewChapterHandler(bookService)
	noteHandler := handler.NewNoteHandler(noteService)
	reviewHandler := handler.NewReviewHandler(reviewService)
	presenceHandler := handler.NewPresenceHandler(presenceService)
	uploadHandler := handler.NewUploadHandler(bookService)
	searchHandler := handler.NewSearchHandler(searchService)
	recommendHandler := handler.NewRecommendHandler(recommendService)
	discoverHandler := handler.NewDiscoverHandler(discoverService)
	paymentHandler := handler.NewPaymentHandler(paymentService)
	progressHandler := handler.NewProgressHandler(progressService)
	reportHandler := handler.NewReportHandler(reportService)
	profileHandler := handler.NewProfileHandler(noteRepo, reviewRepo, bookRepo)
	groupHandler := handler.NewGroupHandler(groupService)
	shelfHandler := handler.NewShelfHandler(shelfService)
	socialHandler := handler.NewSocialHandler(socialService)

	// 设置 Gin 模式
	gin.SetMode(cfg.App.Mode)

	// 创建路由
	r := gin.New()
	r.Use(middleware.RequestID())
	r.Use(middleware.Recovery())
	r.Use(middleware.AccessLog())
	r.Use(middleware.CORS())
	r.Use(middleware.RateLimit())
	r.Use(middleware.ErrorHandler())
	r.Use(middleware.Timeout(30 * time.Second))

	// 注册路由
	registerRoutes(r, authHandler, bookHandler, chapterHandler, noteHandler, reviewHandler, presenceHandler, uploadHandler, searchHandler, recommendHandler, discoverHandler, paymentHandler, progressHandler, reportHandler, profileHandler, groupHandler, shelfHandler, socialHandler)

	// 创建 HTTP 服务器
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.App.Port),
		Handler: r,
	}

	// 优雅关闭
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("failed to start server", logger.Err(err))
		}
	}()

	logger.Info("server started", logger.Int("port", cfg.App.Port))

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("server forced to shutdown", logger.Err(err))
	}

	logger.Info("server exited")
}

// registerRoutes 注册路由
func registerRoutes(r *gin.Engine, authHandler *handler.AuthHandler, bookHandler *handler.BookHandler, chapterHandler *handler.ChapterHandler, noteHandler *handler.NoteHandler, reviewHandler *handler.ReviewHandler, presenceHandler *handler.PresenceHandler, uploadHandler *handler.UploadHandler, searchHandler *handler.SearchHandler, recommendHandler *handler.RecommendHandler, discoverHandler *handler.DiscoverHandler, paymentHandler *handler.PaymentHandler, progressHandler *handler.ProgressHandler, reportHandler *handler.ReportHandler, profileHandler *handler.ProfileHandler, groupHandler *handler.GroupHandler, shelfHandler *handler.ShelfHandler, socialHandler *handler.SocialHandler) {
	// 健康检查
	healthHandler := handler.NewHealthHandler()
	r.GET("/health", healthHandler.Health)
	r.GET("/ping", healthHandler.Ping)

	// API 版本前缀
	api := r.Group("/api/v1")
	{
		// 认证相关 (Phase 2)
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.Auth(), authHandler.Me)
			auth.GET("/me/stats", middleware.Auth(), profileHandler.Stats)
		}

		// 书籍相关 (Phase 3 & 5)
		books := api.Group("/books")
		{
			books.GET("/mine", middleware.Auth(), bookHandler.ListMine)
			books.GET("", bookHandler.List)
			books.GET("/:id", middleware.OptionalAuth(), bookHandler.Get)
			books.POST("", middleware.Auth(), bookHandler.Create)
			books.PUT("/:id", middleware.Auth(), bookHandler.Update)
			books.PATCH("/:id/status", middleware.Auth(), bookHandler.UpdateStatus)
			books.DELETE("/:id", middleware.Auth(), bookHandler.Delete)
			books.GET("/:id/chapters", middleware.OptionalAuth(), bookHandler.GetChapters)
			books.POST("/:id/chapters", middleware.Auth(), bookHandler.CreateChapters)
			books.POST("/:id/chapter", middleware.Auth(), bookHandler.CreateSingleChapter)
			books.GET("/:id/reviews", reviewHandler.ListByBook)
			books.GET("/:id/progress", middleware.Auth(), progressHandler.GetBookProgress)
			books.PUT("/:id/progress", middleware.Auth(), progressHandler.SaveBookProgress)
		}

		// 阅读进度
		reading := api.Group("/reading")
		{
			reading.GET("/progress", middleware.Auth(), progressHandler.ListRecent)
		}

		// 书架
		shelf := api.Group("/shelf")
		{
			shelf.GET("", middleware.Auth(), shelfHandler.List)
			shelf.POST("", middleware.Auth(), shelfHandler.Add)
			shelf.GET("/:bookId/status", middleware.Auth(), shelfHandler.Status)
			shelf.DELETE("/:bookId", middleware.Auth(), shelfHandler.Remove)
		}

		// 章节相关 (Phase 3, 4, 5 & 6)
		chapters := api.Group("/chapters")
		{
			chapters.GET("/:id", middleware.OptionalAuth(), chapterHandler.Get)
			chapters.PUT("/:id", middleware.Auth(), chapterHandler.Update)
			chapters.DELETE("/:id", middleware.Auth(), chapterHandler.Delete)
			chapters.GET("/:id/notes", noteHandler.ListByChapter)
			chapters.GET("/:id/reviews", reviewHandler.ListByChapter)
			chapters.GET("/:id/presence", presenceHandler.GetChapterPresence)
			chapters.POST("/:id/join", middleware.Auth(), presenceHandler.JoinChapter)
			chapters.POST("/:id/leave", middleware.Auth(), presenceHandler.LeaveChapter)
		}

		// 在场相关 (Phase 6)
		presence := api.Group("/presence")
		{
			presence.POST("/heartbeat", middleware.Auth(), presenceHandler.Heartbeat)
		}

		// 上传相关
		upload := api.Group("/upload")
		{
			upload.POST("/book", middleware.Auth(), uploadHandler.UploadBook)
			upload.POST("/epub", middleware.Auth(), uploadHandler.UploadEPUB)
		}

		// 段评相关 (Phase 4)
		notes := api.Group("/notes")
		{
			notes.POST("", middleware.Auth(), noteHandler.Create)
			notes.GET("/mine", middleware.Auth(), noteHandler.ListMine)
			notes.GET("/:id", noteHandler.Get)
			notes.PUT("/:id", middleware.Auth(), noteHandler.Update)
			notes.DELETE("/:id", middleware.Auth(), noteHandler.Delete)
			notes.POST("/:id/like", middleware.Auth(), noteHandler.Like)
			notes.DELETE("/:id/like", middleware.Auth(), noteHandler.Unlike)
		}

		// 书评相关 (Phase 5)
		reviews := api.Group("/reviews")
		{
			reviews.POST("", middleware.Auth(), reviewHandler.Create)
			reviews.GET("/mine", middleware.Auth(), reviewHandler.ListMine)
			reviews.GET("/:id", reviewHandler.Get)
			reviews.PUT("/:id", middleware.Auth(), reviewHandler.Update)
			reviews.DELETE("/:id", middleware.Auth(), reviewHandler.Delete)
			reviews.POST("/:id/like", middleware.Auth(), reviewHandler.Like)
			reviews.DELETE("/:id/like", middleware.Auth(), reviewHandler.Unlike)
		}

		// 搜索相关
		api.GET("/search", searchHandler.Search)
		api.GET("/search/suggest", searchHandler.Suggest)
		api.GET("/books/hot", searchHandler.HotBooks)
		api.GET("/books/new", searchHandler.NewBooks)

		// 推荐相关
		api.GET("/recommend", recommendHandler.Recommend)
		api.GET("/recommend/daily", recommendHandler.DailyRecommend)
		api.GET("/recommend/trending", recommendHandler.Trending)
		api.GET("/recommend/editor", recommendHandler.EditorPicks)

		// 发现页 (M3)
		api.GET("/discover", middleware.OptionalAuth(), discoverHandler.Feed)

		// 轻社交 (M2 P1)
		api.GET("/feed", middleware.Auth(), socialHandler.Feed)
		users := api.Group("/users")
		{
			users.GET("/:id", middleware.OptionalAuth(), socialHandler.GetProfile)
			users.POST("/:id/follow", middleware.Auth(), socialHandler.Follow)
			users.DELETE("/:id/follow", middleware.Auth(), socialHandler.Unfollow)
			users.GET("/:id/follow/status", middleware.Auth(), socialHandler.FollowStatus)
			users.GET("/:id/followers", middleware.OptionalAuth(), socialHandler.ListFollowers)
			users.GET("/:id/following", middleware.OptionalAuth(), socialHandler.ListFollowing)
		}

		// 支付相关
		api.GET("/pricing", paymentHandler.GetPricing)
		api.GET("/payments", middleware.Auth(), paymentHandler.ListPayments)
		api.POST("/payments", middleware.Auth(), paymentHandler.CreatePayment)
		api.GET("/payments/:id", middleware.Auth(), paymentHandler.GetPaymentStatus)
		api.POST("/payments/:id/confirm", middleware.Auth(), paymentHandler.ConfirmPayment)
		api.POST("/payments/callback/:provider", paymentHandler.PaymentCallback)
		api.GET("/vip/status", middleware.Auth(), paymentHandler.CheckVIP)
		api.GET("/books/access", middleware.Auth(), paymentHandler.CheckBookAccess)

		// 内容举报（避风港）
		reports := api.Group("/reports")
		{
			reports.POST("", middleware.Auth(), reportHandler.Create)
		}

		// 共读小组 (M3)
		groups := api.Group("/groups")
		{
			groups.GET("", middleware.OptionalAuth(), groupHandler.List)
			groups.GET("/mine", middleware.Auth(), groupHandler.ListMine)
			groups.POST("", middleware.Auth(), groupHandler.Create)
			groups.GET("/:id", middleware.OptionalAuth(), groupHandler.Get)
			groups.POST("/:id/join", middleware.Auth(), groupHandler.Join)
			groups.POST("/:id/leave", middleware.Auth(), groupHandler.Leave)
			groups.DELETE("/:id", middleware.Auth(), groupHandler.Delete)
			groups.GET("/:id/posts", groupHandler.ListPosts)
			groups.POST("/:id/posts", middleware.Auth(), groupHandler.CreatePost)
		}
	}
}
