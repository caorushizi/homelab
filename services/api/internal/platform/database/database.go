// Package database opens Homelab's PostgreSQL or local SQLite database.
package database

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/glebarez/sqlite"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/example/api/internal/domain"
)

const (
	postgresDriver = "postgres"
	sqliteDriver   = "sqlite"
)

// Open returns a configured database connection and migrates the inventory schema.
func Open(driver, databaseURL, databasePath string, log *zap.Logger) (*gorm.DB, error) {
	switch strings.ToLower(strings.TrimSpace(driver)) {
	case postgresDriver, "postgresql", "":
		return openPostgres(databaseURL, log)
	case sqliteDriver:
		return openSQLite(databasePath, log)
	default:
		return nil, fmt.Errorf("unsupported database driver %q", driver)
	}
}

func openPostgres(databaseURL string, log *zap.Logger) (*gorm.DB, error) {
	dsn := strings.TrimSpace(databaseURL)
	if dsn == "" {
		return nil, fmt.Errorf("DATABASE_URL is required when database driver is postgres")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Warn),
	})
	if err != nil {
		return nil, fmt.Errorf("opening postgres database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("getting postgres connection pool: %w", err)
	}
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxIdleTime(10 * time.Minute)
	sqlDB.SetConnMaxLifetime(time.Hour)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("pinging postgres database: %w", err)
	}

	if err := migrate(db); err != nil {
		return nil, err
	}

	log.Info("database connected", zap.String("driver", postgresDriver))
	return db, nil
}

func openSQLite(databasePath string, log *zap.Logger) (*gorm.DB, error) {
	path := strings.TrimSpace(databasePath)
	if path == "" {
		path = "data/labmap.db"
	}

	if path != ":memory:" {
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			return nil, fmt.Errorf("creating database directory: %w", err)
		}
	}

	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Warn),
	})
	if err != nil {
		return nil, fmt.Errorf("opening sqlite database: %w", err)
	}

	for statement, label := range map[string]string{
		"PRAGMA foreign_keys = ON":   "foreign keys",
		"PRAGMA busy_timeout = 5000": "busy timeout",
		"PRAGMA journal_mode = WAL":  "WAL journal",
	} {
		if err := db.Exec(statement).Error; err != nil {
			return nil, fmt.Errorf("configuring sqlite %s: %w", label, err)
		}
	}

	if err := migrate(db); err != nil {
		return nil, err
	}

	log.Info("database connected", zap.String("driver", sqliteDriver), zap.String("path", path))
	return db, nil
}

func migrate(db *gorm.DB) error {
	if err := db.AutoMigrate(&domain.Router{}, &domain.Machine{}, &domain.ServiceEndpoint{}, &domain.MachineNote{}); err != nil {
		return fmt.Errorf("migrating inventory schema: %w", err)
	}
	return nil
}
