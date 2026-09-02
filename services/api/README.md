# Homelab API

Homelab 的 Go HTTP API，负责持久化路由器、机器和机器上的服务。PostgreSQL 是默认数据库，SQLite 仅作为显式开启的本地轻量测试选项。

## Commands

```bash
go mod tidy
task run
task check
task build
```

## API

- `GET /health`：服务和数据库健康检查
- `GET /api/v1/topology`：返回完整路由器—机器—服务层级
- `/api/v1/routers`：路由器 CRUD
- `/api/v1/machines`：机器 CRUD
- `/api/v1/services`：服务 CRUD

Swagger UI 在服务启动后可通过 `http://localhost:3000/api/docs` 访问。

## Environment

```bash
PORT=3000
DATABASE_DRIVER=postgres
DATABASE_URL=postgresql://labmap:labmap@127.0.0.1:5432/labmap?sslmode=disable
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://tauri.localhost,tauri://localhost
```

需要 SQLite 时改用：

```bash
DATABASE_DRIVER=sqlite
DATABASE_PATH=data/labmap.db
```

## NAS deployment

```bash
cd deployments/nas
cp .env.example .env
docker compose up -d --build
```

可选变量：

- `LABMAP_PORT`：宿主机端口，默认 `3000`
- `LABMAP_DB_PASSWORD`：PostgreSQL 密码，部署前必须替换示例值
- `LABMAP_ALLOWED_ORIGINS`：额外允许的桌面客户端来源

## Layout

```text
cmd/server/            # executable entrypoint
internal/app/          # application wiring
internal/http/         # Gin routes, handlers, middleware, responses
internal/domain/       # router, machine, service models
internal/repository/   # the only Gorm/SQL layer
internal/service/      # validation and business operations
internal/platform/     # SQLite and logging adapters
api/                   # OpenAPI spec
configs/               # config examples
migrations/            # database SQL migrations
build/package/         # container image
deployments/nas/       # NAS Docker Compose
```
