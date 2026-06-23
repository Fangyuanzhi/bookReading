package logger

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// GormAdapter GORM 日志适配器
type GormAdapter struct {
	level gormlogger.LogLevel
}

// NewGormAdapter 创建 GORM 日志适配器
func NewGormAdapter(level string) *GormAdapter {
	l := gormlogger.Warn
	switch level {
	case "debug", "info":
		l = gormlogger.Info
	case "error":
		l = gormlogger.Error
	case "silent":
		l = gormlogger.Silent
	}
	return &GormAdapter{level: l}
}

func (l *GormAdapter) LogMode(level gormlogger.LogLevel) gormlogger.Interface {
	nl := *l
	nl.level = level
	return &nl
}

func (l *GormAdapter) Info(ctx context.Context, msg string, data ...interface{}) {
	if l.level >= gormlogger.Info {
		Info("gorm", String("detail", fmt.Sprintf(msg, data...)))
	}
}

func (l *GormAdapter) Warn(ctx context.Context, msg string, data ...interface{}) {
	if l.level >= gormlogger.Warn {
		Warn("gorm", String("detail", fmt.Sprintf(msg, data...)))
	}
}

func (l *GormAdapter) Error(ctx context.Context, msg string, data ...interface{}) {
	if l.level >= gormlogger.Error {
		Error("gorm", String("detail", fmt.Sprintf(msg, data...)))
	}
}

func (l *GormAdapter) Trace(ctx context.Context, begin time.Time, fc func() (string, int64), err error) {
	if l.level <= gormlogger.Silent {
		return
	}

	elapsed := time.Since(begin)
	sql, rows := fc()

	fields := []zap.Field{
		String("sql", sql),
		Int64("rows", rows),
		Int64("elapsed_ms", elapsed.Milliseconds()),
	}

	switch {
	case err != nil && l.level >= gormlogger.Error && !errors.Is(err, gorm.ErrRecordNotFound):
		Error("gorm query failed", append(fields, Err(err))...)
	case elapsed > 200*time.Millisecond && l.level >= gormlogger.Warn:
		Warn("gorm slow query", fields...)
	case l.level >= gormlogger.Info:
		Debug("gorm query", fields...)
	}
}
