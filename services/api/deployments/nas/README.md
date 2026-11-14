# 群晖：从私有仓库部署

这份配置用于新部署，独立于原有 compose.yaml，不会复用旧的 labmap 数据卷。

1. 在群晖创建目录（例如 /volume1/docker/homelab），将 compose.registry.yaml 上传并命名为 compose.yaml。
2. 同目录创建 .env，设置 HOMELAB_DB_PASSWORD 为随机的 32 位以上字母数字密码，避免 URL 特殊字符。可用 `openssl rand -hex 24` 生成。可选设置 HOMELAB_PORT=3000。
3. 确认群晖 Docker 允许 HTTP 仓库 192.168.100.196:5080，并登录该仓库。镜像引用不包含 http://。
4. 在 Container Manager 的「项目」中创建 homelab，选择上述目录和 compose.yaml，构建并启动。也可以通过 SSH 在该目录执行：

```sh
docker login 192.168.100.196:5080
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail=100 homelab-api
```

访问 http://群晖IP:3000/health 检查状态，桌面应用填写 http://群晖IP:3000。

PostgreSQL 数据存放在项目的 homelab-postgres-data 命名卷中。更新容器保留数据；不要执行 `docker compose down -v`，它会删除数据卷。

更新镜像版本时，修改 compose.yaml 中的标签，再执行 pull 和 up -d。数据库端口不映射到宿主机。
