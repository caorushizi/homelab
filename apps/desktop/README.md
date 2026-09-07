# Homelab Desktop

Homelab 的 Tauri 2 桌面客户端。界面使用 React + Vite，原生容器位于 `src-tauri/`。

## Features

- 首次启动验证并保存 NAS 服务器地址
- 从主界面退出当前服务器并重新连接
- 路由器总览与机器卡片浏览，记住上次工作位置
- 独立设置页集中新增、编辑和删除路由器、机器及服务
- 设置页编辑 Markdown 维护备注，浏览页仅展示已保存的备注
- 查看机器下的所有服务入口
- 通过 Tauri Opener 打开路由器和服务管理页
- 暗黑空间化界面与设备搜索

## Development

先启动 Go API：

```bash
cd ../../services/api
go run ./cmd/server
```

然后启动桌面客户端：

```bash
pnpm install
pnpm tauri:dev
```

如果只需调试 Web 界面：

```bash
pnpm dev
```

首次打开桌面端时，在连接页填写 Homelab API 的根地址，例如 `http://192.168.1.10:3000`。客户端会请求 `/health` 验证连接，通过后才进入主界面。

## Commands

| Command            | Purpose             |
| ------------------ | ------------------- |
| `pnpm dev`         | 启动 Vite           |
| `pnpm build`       | 类型检查并构建前端  |
| `pnpm tauri:dev`   | 启动 Tauri 桌面应用 |
| `pnpm tauri:build` | 构建桌面安装包      |
| `pnpm lint`        | 执行 oxlint         |
| `pnpm format`      | 检查 oxfmt 格式     |

## Layout

```text
src/
├── api/                 # Homelab API 请求
├── components/
│   ├── inventory/       # 设备、服务表单与备注编辑/预览
│   └── ui/              # shadcn 原子组件
├── features/inventory/  # 预览数据
├── pages/Home.tsx       # 只读浏览界面与交互状态
├── pages/Settings.tsx   # 设备、服务和备注管理
├── styles/              # 设计令牌与 Homelab 布局
└── types/               # 手写 API 类型

src-tauri/
├── capabilities/        # Tauri 权限
├── src/                 # Rust 入口
├── Cargo.toml
└── tauri.conf.json
```
