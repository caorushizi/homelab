package app

import (
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/example/api/internal/config"
	apihttp "github.com/example/api/internal/http"
	"github.com/example/api/internal/http/handlers"
	"github.com/example/api/internal/platform/database"
	"github.com/example/api/internal/repository"
	"github.com/example/api/internal/service"
)

type App struct {
	cfg    config.Config
	log    *zap.Logger
	db     *gorm.DB
	router *apihttp.Router
}

func New(cfg config.Config, log *zap.Logger) (*App, error) {
	db, err := database.Open(cfg.DatabaseDriver, cfg.DatabaseURL, cfg.DatabasePath, log)
	if err != nil {
		return nil, err
	}

	inventoryRepo := repository.NewInventoryRepository(db)
	inventoryService := service.NewInventoryService(inventoryRepo)

	handlerSet := handlers.Set{
		App:       handlers.NewAppHandler(cfg),
		Health:    handlers.NewHealthHandler(db),
		Inventory: handlers.NewInventoryHandler(inventoryService),
	}

	return &App{
		cfg: cfg,
		log: log,
		db:  db,
		router: apihttp.NewRouter(apihttp.Dependencies{
			Config:  cfg,
			Logger:  log,
			Handler: handlerSet,
		}),
	}, nil
}

func (a *App) Router() *apihttp.Router {
	return a.router
}
