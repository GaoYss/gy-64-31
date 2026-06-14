# Decoration Project Management System

FastAPI + React 装修公司项目管理系统，覆盖客户报备、量房预约、施工进度跟踪、材料采购和验收管理。

---

## 🟢 健康检查（一眼看清谁在跑）

**本地和容器使用完全相同的 URL 和响应格式**，不再混淆前后端状态。

### 端点一览表

| 端点 | 检查的服务 | 适用环境 | 返回中的 `component` 字段 | 推荐使用场景 |
|------|-----------|---------|--------------------------|-------------|
| `GET /health` | **前端**（Nginx / Vite 自身） | 本地 + 容器 | `frontend` | 判断前端容器/进程是否活着 |
| `GET /health/full` | **前端 + 后端**（聚合） | 本地 + 容器 | `frontend`，另含 `backend` 子对象 | 一键确认整个系统是否正常 |
| `GET /api/health` | **后端**（FastAPI） | 本地 + 容器（经前端代理） | `backend` | 单独判断后端是否正常 |

> **容器部署访问基地址**：`http://localhost:3000`
> **本地开发访问基地址**：`http://localhost:5173`（或预览端口 `4173`）
> **后端直连**（仅本地/容器本机）：`http://127.0.0.1:8000/api/health`

### 统一响应格式

所有健康检查端点返回相同的 JSON 结构：

```json
{
  "status": "ok",              // ok | degraded | unhealthy
  "component": "frontend",     // frontend | backend —— 明确告诉你这是谁
  "version": "1.0.0",          // 服务版本号
  "timestamp": "2026-06-14T08:30:00.000Z",
  "checks": {
    "self": "ok",              // 自身状态
    "backend": "ok"            // 仅 /health/full 有，表示后端可达性
  }
  // /health/full 额外包含完整的后端健康响应：
  // "backend": { "status": "ok", "component": "backend", ... }
}
```

### 统一的查看状态命令

无论本地还是容器启动，只需运行这些命令（替换基地址即可）：

```bash
# 1) 检查前端是否活着
curl http://localhost:3000/health                 # 容器
curl http://localhost:5173/health                 # 本地开发

# 2) 一键检查前后端（推荐日常使用）
curl http://localhost:3000/health/full | jq .     # 容器
curl http://localhost:5173/health/full | jq .     # 本地开发

# 3) 单独检查后端（经前端代理）
curl http://localhost:3000/api/health             # 容器
curl http://localhost:5173/api/health             # 本地开发
```

Docker 环境下还可以直接看容器健康状态：

```bash
docker compose ps
# NAME                       STATUS
# decoration-pm-backend      Up About a minute (healthy)
# decoration-pm-frontend     Up About a minute (healthy)
```

---

## ⚙️ 配置项清单（默认值 + 用途，不用翻代码）

### 前端配置项

配置文件：`frontend/.env.example` → 复制为 `frontend/.env` 生效。

| 变量名 | 默认值 | 用途 | 生效环境 |
|--------|--------|------|---------|
| `VITE_API_BASE_URL` | `/api` | 前端代码调用 API 的基础路径。保持默认 `/api`，由反向代理转发到后端；如需直接跨域访问独立后端可改为完整 URL（如 `https://api.example.com/v1`） | 构建时注入，运行时只读 |
| `VITE_BACKEND_TARGET` | `http://127.0.0.1:8000` | **本地开发/预览专用**。Vite dev server 和 preview server 将 `/api`、`/docs`、`/openapi.json` 代理到此地址。容器部署不使用此变量（走 Docker 内部 DNS） | 仅本地 `npm run dev` / `npm run preview` |

### 后端配置项

配置文件：`backend/.env.example` → 复制为 `backend/.env` 生效。通过 `pydantic-settings` 自动加载 `.env` 文件和系统环境变量，大小写不敏感。

| 变量名 | 默认值 | 用途 | 备注 |
|--------|--------|------|------|
| `APP_NAME` | `Decoration Project Management` | Swagger 文档标题、日志标识 | |
| `APP_VERSION` | `1.0.0` | 健康检查返回的版本号 | |
| `APP_COMPONENT` | `backend` | 健康检查返回的组件标识 | 一般无需修改 |
| `HOST` | `0.0.0.0` | uvicorn 监听地址 | 容器内由 Dockerfile CMD 覆盖 |
| `PORT` | `8000` | uvicorn 监听端口 | 容器内由 Dockerfile CMD 覆盖 |
| `CORS_ORIGINS` | 见下 | 允许跨域的来源，英文逗号分隔 | 默认已放行 `localhost:5173/4173/3000` 及 `127.0.0.1` 变体；生产环境请替换为实际域名 |

CORS 默认值展开：
```
http://localhost:5173, http://127.0.0.1:5173,
http://localhost:4173, http://127.0.0.1:4173,
http://localhost:3000, http://127.0.0.1:3000
```

### Docker Compose 构建参数

| 服务 | 参数名 | 默认值 | 用途 |
|------|--------|--------|------|
| frontend | `VITE_API_BASE_URL` | `/api` | 构建前端镜像时注入的 API 基础路径，极少需要修改 |

---

## 功能模块

- 客户报备：客户来源、户型、预算、状态和负责人管理
- 量房预约：预约时间、设计师、量房人员和需求记录
- 施工进度：项目阶段、进度百分比、风险等级和最新进展
- 材料采购：材料、供应商、数量、预算、到货状态管理
- 验收管理：验收类型、验收人、结果和整改问题记录
- 运营看板：客户、预约、项目、验收指标和阶段分布

## 项目结构

```text
.
├── backend
│   ├── app
│   │   ├── core          # 配置（含环境变量加载）
│   │   ├── data          # 示例数据与内存仓库
│   │   ├── routers       # FastAPI 路由
│   │   ├── schemas       # Pydantic 模型
│   │   └── services      # 业务服务
│   ├── .env.example      # 后端配置项模板
│   ├── Dockerfile
│   └── requirements.txt
├── frontend
│   ├── src
│   │   ├── api           # API 客户端
│   │   ├── components    # 通用组件
│   │   ├── context       # 数据状态
│   │   ├── modules       # 导航和表单配置
│   │   └── pages         # 业务页面
│   ├── .env.example      # 前端配置项模板
│   ├── Dockerfile
│   ├── health.js         # Nginx njs 健康检查脚本
│   ├── nginx.conf        # 容器部署 Nginx 主配置（含代理 + 健康检查）
│   └── vite.config.js    # 本地开发 Vite 配置（含代理 + 健康检查中间件）
├── docker-compose.yml
└── README.MD
```

---

## 🐳 Docker 启动（推荐）

### 前置要求

- Docker 20+
- Docker Compose v2+

### 一键启动

```bash
docker compose up --build
```

### 启动后访问

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端首页 | http://localhost:3000 | 装修管理系统 UI |
| 前端健康（仅自身） | http://localhost:3000/health | `component=frontend` |
| 聚合健康（前后端） | http://localhost:3000/health/full | 一键确认全系统 |
| 后端健康（经代理） | http://localhost:3000/api/health | `component=backend` |
| API 文档（Swagger） | http://localhost:3000/docs | 经代理的交互式文档 |
| OpenAPI JSON | http://localhost:3000/openapi.json | API 规范 |
| 后端直连（仅本机） | http://127.0.0.1:8000 | 绕过前端代理直接访问后端 |

### 常用 Docker Compose 命令

```bash
# 后台启动
docker compose up -d --build

# 查看服务健康状态（healthy / unhealthy / starting）
docker compose ps

# 查看实时日志
docker compose logs -f backend
docker compose logs -f frontend

# 停止并清除
docker compose down

# 仅重启某个服务
docker compose restart frontend
```

---

## 💻 本地开发启动

### 前置要求

- Python 3.12+
- Node.js 22+（推荐 22 LTS）
- npm 或 pnpm

### 步骤一：启动后端

```bash
cd backend

# 可选：复制配置模板并修改
copy .env.example .env

# 创建虚拟环境（Windows PowerShell）
python -m venv .venv
.venv\Scripts\Activate.ps1

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器（热重载）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端直连地址：http://127.0.0.1:8000/api/health （`component=backend`）

### 步骤二：启动前端

```bash
cd frontend

# 可选：复制配置模板并修改
copy .env.example .env

# 安装依赖
npm install

# 启动开发服务器（含代理 + 健康检查端点）
npm run dev
```

前端运行在 http://localhost:5173

```bash
# 本地健康检查演示
curl http://localhost:5173/health          # 前端自身，component=frontend
curl http://localhost:5173/health/full     # 聚合，含前后端状态
curl http://localhost:5173/api/health      # 后端，component=backend
```

### 本地预览构建产物

```bash
cd frontend
npm run build
npm run preview
```

预览服务运行在 http://localhost:4173，同样启用了与开发模式**完全一致**的代理和健康检查端点。

---

## 🔨 构建说明

### 前端多阶段构建

`frontend/Dockerfile` 使用两阶段构建，最小化镜像体积：

| 阶段 | 基础镜像 | 作用 |
|------|---------|------|
| build | `node:22-alpine` | 安装依赖并执行 `npm run build`，注入 `VITE_API_BASE_URL` 构建参数 |
| runtime | `nginx:1.27-alpine` | 仅拷贝 `dist/`、主配置 `nginx.conf`、njs 脚本 `health.js`；安装 `wget`（健康检查用）和 `nginx-mod-http-js`（聚合健康检查用） |

```bash
# 单独构建前端镜像
docker build -t decoration-pm-frontend:latest \
  --build-arg VITE_API_BASE_URL=/api \
  ./frontend
```

### 后端单阶段构建

`backend/Dockerfile` 使用 Python slim 镜像：

- 设置 `PYTHONDONTWRITEBYTECODE=1` 和 `PYTHONUNBUFFERED=1`
- 内置 HEALTHCHECK（请求自身 `/api/health`）
- 暴露端口 `8000`

```bash
# 单独构建后端镜像
docker build -t decoration-pm-backend:latest ./backend
```

---

## 🩺 健康检查详解

### 后端健康检查（FastAPI）

- **端点**：`GET /api/health`
- **实现**：`backend/app/main.py`
- **component**：`backend`
- **容器触发频率**：每 10s，超时 5s，连续 5 次失败标记 unhealthy，启动宽限期 15s
- **自检方式**：容器内 Python 标准库 `urllib` 请求自身 `127.0.0.1:8000/api/health`

### 前端健康检查（Nginx / Vite）

- **端点**：`GET /health`
- **实现**：容器侧 `frontend/health.js` + `frontend/nginx.conf`；本地侧 `frontend/vite.config.js` 中间件
- **component**：`frontend`
- **说明**：不依赖后端，直接返回，专门用于判断前端进程/Nginx 是否存活
- **容器触发频率**：每 15s，超时 5s，连续 3 次失败标记 unhealthy，启动宽限期 10s
- **自检方式**：容器内 `wget` 请求 `127.0.0.1:80/health`

### 聚合健康检查（前端 + 后端）

- **端点**：`GET /health/full`
- **component**：`frontend`
- **逻辑**：前端先确认自身 OK，再子请求后端 `/api/health`，将两者结果合并返回
- **状态码**：始终 200；通过 `status` 字段区分（`ok` = 全正常，`degraded` = 前端 OK 但后端不可达）
- **失败详情**：后端不可达时，`backend.error` 字段含具体错误信息

### 启动依赖保障

`docker-compose.yml` 中前端 `depends_on` 设置了 `condition: service_healthy`，确保：
1. 后端先启动并通过健康检查
2. 再启动前端（此时 Nginx 才能通过 Docker 内部 DNS 解析到 `backend` 服务名，聚合健康检查也才有意义）

---

## 🐛 故障排查

### 问题 1：前端页面 404 / 白屏

**容器环境**：
```bash
docker compose ps frontend
docker compose logs frontend
docker compose exec frontend ls -la /usr/share/nginx/html/
```

**本地开发**：确认 `npm run dev` 无编译错误，检查浏览器 Console。

### 问题 2：API 请求 502 Bad Gateway（容器）

Nginx 无法连接后端。用聚合健康检查快速定位：

```bash
# 一键查看前后端状态
curl http://localhost:3000/health/full | jq .

# 若 checks.backend = "unreachable"，继续：
docker compose ps backend          # 后端容器是否 healthy
docker compose logs backend        # 后端启动日志
docker compose exec frontend wget -qO- http://backend:8000/api/health
```

### 问题 3：本地 API 请求 404 / 代理不生效

```bash
# 先用聚合健康检查确认前后端关系
curl http://localhost:5173/health/full | jq .

# 若后端不可达，确认后端进程：
curl http://127.0.0.1:8000/api/health

# 如后端跑在别的端口：
#   修改 frontend/.env 中的 VITE_BACKEND_TARGET，然后 npm run dev
```

### 问题 4：健康检查 component 不是我预期的

请对照端点一览表核对 URL：
- `/health` → 永远是 `frontend`
- `/api/health` → 永远是 `backend`
- `/health/full` → 外层 `frontend`，内层 `backend` 字段含后端详情

### 问题 5：容器健康状态一直是 starting

后端宽限期 15s、前端 10s 属正常。若长时间未变 healthy：

```bash
# 手动执行容器内的健康检查命令
docker compose exec backend python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')"
docker compose exec frontend wget -qO- http://127.0.0.1:80/health
```

### 问题 6：CORS 跨域错误

当前项目使用**前端反向代理**模式，浏览器始终请求同源地址，理论上不会出现 CORS。如直接连接后端 API：
- 后端 CORS 配置项：`CORS_ORIGINS`（逗号分隔字符串）
- 默认已放行 `localhost:5173/4173/3000` 及 `127.0.0.1` 变体
- 生产部署请在 `backend/.env` 中替换为实际域名

---

## 📖 API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查（`component=backend`） |
| GET | `/api/dashboard/summary` | 运营看板汇总 |
| GET \| POST | `/api/customers` | 客户列表 \| 新增客户 |
| PATCH | `/api/customers/{customer_id}` | 更新客户 |
| GET \| POST | `/api/appointments` | 量房预约列表 \| 新增预约 |
| PATCH | `/api/appointments/{appointment_id}` | 更新预约 |
| GET \| POST | `/api/projects` | 项目列表 \| 新增项目 |
| PATCH | `/api/projects/{project_id}` | 更新项目 |
| GET \| POST | `/api/procurements` | 采购列表 \| 新增采购 |
| PATCH | `/api/procurements/{procurement_id}` | 更新采购 |
| GET \| POST | `/api/inspections` | 验收列表 \| 新增验收 |
| PATCH | `/api/inspections/{inspection_id}` | 更新验收 |

当前版本使用内存数据仓库，便于演示和容器启动。生产落地时可在 `backend/app/services` 与 `backend/app/data` 下替换为数据库持久化实现。
