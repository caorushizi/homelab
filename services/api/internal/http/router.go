package http

import (
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"

	"github.com/example/api/internal/config"
	"github.com/example/api/internal/http/handlers"
	"github.com/example/api/internal/http/middleware"
)

type Router struct {
	*gin.Engine
}

type Dependencies struct {
	Config  config.Config
	Logger  *zap.Logger
	Handler handlers.Set
}

func NewRouter(deps Dependencies) *Router {
	if deps.Config.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	engine := gin.New()
	engine.Use(
		middleware.RequestID(),
		middleware.Recovery(deps.Logger),
		middleware.Logger(deps.Logger),
		middleware.Metrics(),
		middleware.CORS(deps.Config),
	)

	engine.GET("/", deps.Handler.App.Info)
	engine.GET("/health", deps.Handler.Health.Check)
	engine.GET("/metrics", gin.WrapH(promhttp.Handler()))
	engine.GET("/api/docs", deps.Handler.App.Docs)
	engine.StaticFile("/api/openapi.yaml", "api/openapi.yaml")
	engine.GET("/api/docs/*any", ginSwagger.WrapHandler(
		swaggerFiles.Handler,
		ginSwagger.URL("/api/openapi.yaml"),
	))

	api := engine.Group("/api/v1")
	{
		api.GET("/topology", deps.Handler.Inventory.Topology)

		api.POST("/routers", deps.Handler.Inventory.CreateRouter)
		api.PATCH("/routers/:routerID", deps.Handler.Inventory.UpdateRouter)
		api.DELETE("/routers/:routerID", deps.Handler.Inventory.DeleteRouter)

		api.POST("/routers/:routerID/machines", deps.Handler.Inventory.CreateMachine)
		api.PATCH("/machines/:machineID", deps.Handler.Inventory.UpdateMachine)
		api.DELETE("/machines/:machineID", deps.Handler.Inventory.DeleteMachine)

		api.POST("/machines/:machineID/services", deps.Handler.Inventory.CreateService)
		api.PATCH("/services/:serviceID", deps.Handler.Inventory.UpdateService)
		api.DELETE("/services/:serviceID", deps.Handler.Inventory.DeleteService)
	}

	return &Router{Engine: engine}
}
