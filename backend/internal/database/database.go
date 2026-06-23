package database

import (
	"fmt"
	"time"

	"github.com/fangyuanzhi/bookreading-backend/internal/config"
	"github.com/fangyuanzhi/bookreading-backend/internal/model"
	"github.com/fangyuanzhi/bookreading-backend/pkg/logger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

var db *gorm.DB

// Init 初始化数据库连接
func Init(cfg *config.DatabaseConfig, logLevel string) error {
	dsn := cfg.DSN()

	gormConfig := &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "",
			SingularTable: false,
		},
		DisableForeignKeyConstraintWhenMigrating: true,
		Logger:                                   logger.NewGormAdapter(logLevel),
	}

	var err error
	db, err = gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// 配置连接池
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get sql db: %w", err)
	}

	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(time.Hour)

	logger.Info("database connected")
	return nil
}

// AutoMigrate 自动迁移数据库表结构
func AutoMigrate() error {
	models := []interface{}{
		&model.User{},
		&model.Book{},
		&model.Chapter{},
		&model.Note{},
		&model.NoteLike{},
		&model.Review{},
		&model.ReviewLike{},
		&model.ReadingProgress{},
		&model.ReadingGroup{},
		&model.GroupMember{},
		&model.Payment{},
		&model.VIPSubscription{},
		&model.UserBookPurchase{},
	}

	if err := db.AutoMigrate(models...); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	if err := fixLegacyProfileData(); err != nil {
		return fmt.Errorf("failed to fix legacy profile data: %w", err)
	}

	logger.Info("database migrated")
	return nil
}

// fixLegacyProfileData 修复历史数据（空 username 会导致唯一约束冲突）
func fixLegacyProfileData() error {
	result := db.Exec("UPDATE profiles SET username = NULL WHERE username = '' OR username IS NULL")
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected > 0 {
		logger.Info("fixed empty profile usernames", logger.Int("count", int(result.RowsAffected)))
	}
	return nil
}

// GetDB 获取数据库连接
func GetDB() *gorm.DB {
	return db
}

// Close 关闭数据库连接
func Close() error {
	if db == nil {
		return nil
	}

	sqlDB, err := db.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}
