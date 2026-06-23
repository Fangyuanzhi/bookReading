package logger

import (
	"fmt"
	"os"
	"path/filepath"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// Config 日志配置
type Config struct {
	Level  string
	Format string // json | console
	File   string // 可选，写入文件（与 stdout 同时输出）
}

var log *zap.Logger

// Init 初始化全局 logger
func Init(cfg Config) error {
	level := parseLevel(cfg.Level)
	encoder := buildEncoder(cfg.Format)

	var cores []zapcore.Core
	cores = append(cores, zapcore.NewCore(encoder, zapcore.AddSync(os.Stdout), level))

	if cfg.File != "" {
		if err := os.MkdirAll(filepath.Dir(cfg.File), 0o755); err != nil {
			return fmt.Errorf("create log dir: %w", err)
		}
		file, err := os.OpenFile(cfg.File, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
		if err != nil {
			return fmt.Errorf("open log file: %w", err)
		}
		// 文件侧统一用 JSON，便于 grep / 采集
		fileEncoder := buildEncoder("json")
		cores = append(cores, zapcore.NewCore(fileEncoder, zapcore.AddSync(file), level))
	}

	core := zapcore.NewTee(cores...)
	log = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))
	return nil
}

func parseLevel(level string) zapcore.Level {
	switch level {
	case "debug":
		return zapcore.DebugLevel
	case "warn":
		return zapcore.WarnLevel
	case "error":
		return zapcore.ErrorLevel
	default:
		return zapcore.InfoLevel
	}
}

func buildEncoder(format string) zapcore.Encoder {
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.StringDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}
	if format == "console" {
		encoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		return zapcore.NewConsoleEncoder(encoderConfig)
	}
	return zapcore.NewJSONEncoder(encoderConfig)
}

// Sync 刷盘（进程退出前调用）
func Sync() {
	if log != nil {
		_ = log.Sync()
	}
}

func Get() *zap.Logger {
	if log == nil {
		log, _ = zap.NewProduction()
	}
	return log
}

func Debug(msg string, fields ...zap.Field) { Get().Debug(msg, fields...) }
func Info(msg string, fields ...zap.Field)  { Get().Info(msg, fields...) }
func Warn(msg string, fields ...zap.Field)  { Get().Warn(msg, fields...) }
func Error(msg string, fields ...zap.Field) { Get().Error(msg, fields...) }
func Fatal(msg string, fields ...zap.Field) { Get().Fatal(msg, fields...) }

func String(key, val string) zap.Field       { return zap.String(key, val) }
func Int(key string, val int) zap.Field      { return zap.Int(key, val) }
func Int64(key string, val int64) zap.Field  { return zap.Int64(key, val) }
func Bool(key string, val bool) zap.Field    { return zap.Bool(key, val) }
func Err(err error) zap.Field                { return zap.Error(err) }
func Any(key string, val interface{}) zap.Field { return zap.Any(key, val) }
