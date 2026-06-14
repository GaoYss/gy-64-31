# Decoration Project Management System

FastAPI + React 装修公司项目管理系统，覆盖客户报备、量房预约、施工进度跟踪、材料采购和验收管理。

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
│   │   ├── core          # 配置
│   │   ├── data          # 示例数据与内存仓库
│   │   ├── routers       # FastAPI 路由
│   │   ├── schemas       # Pydantic 模型
│   │   └── services      # 业务服务
│   ├── Dockerfile
│   └── requirements.txt
├── frontend
│   ├── src
│   │   ├── api           # API 客户端
│   │   ├── components    # 通用组件
│   │   ├── context       # 数据状态
│   │   ├── modules       # 导航和表单配置
│   │   └── pages         # 业务页面
│   ├── Dockerfile
│   ├── nginx.conf        # 容器部署 Nginx 配置（含代理）
│   └── vite.config.js    # 本地开发 Vite 配置（含代理）
├── docker-compose.yml
└── README.MD
```

---

## 统一代理配置说明

本项目前端通过 **统一的相对路径 `/api`** 访问后端，**本地开发**和**容器部署**使用同一套 API 调用方式，差异由各层代理透明处理。

### 代理路径对照表（本地与容器一致）

| 前端访问路径 | 实际转发到后端 | 说明 |
|-------------|---------------|------|
| `/api/*` | `http://backend:8000/api/*` | 所有业务 API |
| `/docs` | `http://backend:8000/docs` | Swagger UI 文档 |
| `/openapi.json` | `http://backend:8000/openapi.json` | OpenAPI 规范 |
| `/health`（前端） | 前端 Nginx 直接返回 | 前端自身健康检查 |
| `/api/health` | `http://backend:8000/api/health` | 后端健康检查（经前端代理） |

### 本地开发代理（Vite）

配置文件：`frontend/vite.config.js`

- **监听地址**：`0.0.0.0:5173`
- **后端目标**：默认 `http://127.0.0.1:8000`，可通过环境变量 `VITE_BACKEND_TARGET` 自定义
- **代理覆盖**：`/api`、`/docs`、`/openapi.json`、`/health`

```bash
# 自定义后端地址示例（如后端跑在别的机器上）
set VITE_BACKEND_TARGET=http://192.168.1.100:8000
npm run dev
```

### 容器部署代理（Nginx）

配置文件：`frontend/nginx.conf`

- **监听端口**：`80`（容器内）
- **后端上游**：`http://backend:8000`（通过 Docker 内部网络 DNS 解析）
- **特性**：Gzip 压缩、静态资源缓存、超时设置、CORS 头部转发

### API 客户端配置

配置文件：`frontend/src/api/client.js`

- **环境变量**：`VITE_API_BASE_URL`（构建时注入），默认 `/api`
- **请求超时**：默认 30 秒，可在每次请求中覆盖
- **错误处理**：带状态码的结构化异常、超时自动中断

```bash
# 容器构建时自定义 API 基础路径（极少需要修改，默认 /api 即可）
docker build --build-arg VITE_API_BASE_URL=/custom-api -t frontend ./frontend
```

---

## Docker 启动（推荐）

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
| 后端健康检查 | http://localhost:3000/api/health | 经 Nginx 代理的后端健康 |
| 前端健康检查 | http://localhost:3000/health | Nginx 直接返回 |
| API 文档（Swagger） | http://localhost:3000/docs | 经代理的交互式文档 |
| OpenAPI JSON | http://localhost:3000/openapi.json | API 规范 |
| 后端直连（仅本机） | http://127.0.0.1:8000 | 绕过前端代理直接访问后端 |

### 常用 Docker Compose 命令

```bash
# 后台启动
docker compose up -d --build

# 查看服务健康状态
docker compose ps

# 查看日志
docker compose logs -f backend
docker compose logs -f frontend

# 停止并清除
docker compose down

# 仅重启某个服务
docker compose restart frontend
```

---

## 本地开发启动

### 前置要求

- Python 3.12+
- Node.js 22+（推荐 22 LTS）
- npm 或 pnpm

### 步骤一：启动后端

```bash
cd backend

# 创建虚拟环境（Windows PowerShell）
python -m venv .venv
.venv\Scripts\Activate.ps1

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器（热重载）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端运行在 http://127.0.0.1:8000

### 步骤二：启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器（含代理）
npm run dev
```

前端运行在 http://localhost:5173，Vite 自动将 `/api`、`/docs`、`/openapi.json` 请求代理到后端。

### 本地预览构建产物

```bash
cd frontend
npm run build
npm run preview
```

预览服务运行在 http://localhost:4173，同样启用了与开发模式一致的代理配置。

---

## 健康检查说明

### 后端健康检查（FastAPI）

- **端点**：`GET /api/health`
- **实现**：`backend/app/main.py`
- **返回**：`{"status": "ok"}`
- **容器内触发**：每 10 秒检查，超时 5 秒，连续 5 次失败标记为 unhealthy，启动宽限期 15 秒
- **Dockerfile HEALTHCHECK**：使用 Python 标准库 `urllib` 自检

### 前端健康检查（Nginx）

- **端点**：`GET /health`
- **实现**：`frontend/nginx.conf` 中 `location = /health`
- **返回**：`{"status":"ok","component":"frontend"}`
- **说明**：不依赖后端，由 Nginx 直接返回，用于判断前端容器自身是否存活
- **容器内触发**：每 15 秒检查，超时 5 秒，连续 3 次失败标记为 unhealthy，启动宽限期 10 秒
- **Dockerfile HEALTHCHECK**：使用 `wget` 请求 `/health` 端点

### 启动依赖保障

`docker-compose.yml` 中前端 `depends_on` 设置了 `condition: service_healthy`，确保：
1. 后端先启动并通过健康检查
2. 再启动前端（Nginx 才能通过 DNS 解析到 `backend` 服务名）

---

## 构建说明

### 前端多阶段构建

`frontend/Dockerfile` 使用两阶段构建，最小化镜像体积：

| 阶段 | 基础镜像 | 作用 |
|------|---------|------|
| build | `node:22-alpine` | 安装依赖并执行 `npm run build`，注入 `VITE_API_BASE_URL` 构建参数 |
| runtime | `nginx:1.27-alpine` | 仅拷贝 `dist/` 和 `nginx.conf`，安装 `wget` 用于健康检查 |

构建参数：
- `VITE_API_BASE_URL`：默认 `/api`，极少需要修改

```bash
# 单独构建前端镜像
docker build -t decoration-pm-frontend:latest \
  --build-arg VITE_API_BASE_URL=/api \
  ./frontend
```

### 后端单阶段构建

`backend/Dockerfile` 使用 Python slim 镜像：

- 设置 `PYTHONDONTWRITEBYTECODE=1` 和 `PYTHONUNBUFFERED=1` 优化容器运行
- 暴露端口 `8000`
- 内置 HEALTHCHECK

```bash
# 单独构建后端镜像
docker build -t decoration-pm-backend:latest ./backend
```

---

## 故障排查

### 问题 1：前端页面 404 / 白屏

**容器环境**：
```bash
# 检查前端容器状态和健康
docker compose ps frontend
docker compose logs frontend

# 进入容器验证文件是否存在
docker compose exec frontend ls -la /usr/share/nginx/html/
```

**本地开发**：确认 `npm run dev` 无编译错误，检查浏览器 Console。

### 问题 2：API 请求 502 Bad Gateway（容器）

说明 Nginx 无法连接后端。排查步骤：

```bash
# 1. 检查后端容器是否 healthy
docker compose ps backend

# 2. 查看后端日志是否有启动错误
docker compose logs backend

# 3. 进入前端容器测试后端连通性
docker compose exec frontend wget -qO- http://backend:8000/api/health
```

### 问题 3：API 请求 404 / 代理不生效（本地）

确认后端已启动并监听 8000 端口：

```bash
# 直接测试后端
curl http://127.0.0.1:8000/api/health

# 如后端跑在别的端口，修改环境变量后重启前端
set VITE_BACKEND_TARGET=http://127.0.0.1:YOUR_PORT
npm run dev
```

### 问题 4：CORS 跨域错误

当前项目使用**前端反向代理**模式，浏览器始终请求同源地址，理论上不会出现 CORS。如直接连接后端 API：

- 后端 CORS 配置在 `backend/app/core/config.py` 的 `cors_origins`
- 默认已放行 `localhost:5173`、`localhost:3000` 及其 `127.0.0.1` 变体
- 生产部署请替换为实际域名

### 问题 5：容器健康状态一直是 starting

后端宽限期 15 秒、前端 10 秒属正常。若长时间未变 healthy：

```bash
# 手动执行健康检查命令看具体错误
# 后端
docker compose exec backend python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')"

# 前端
docker compose exec frontend wget -qO- http://127.0.0.1:80/health
```

---

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
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
