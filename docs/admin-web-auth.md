# admin-web 登录与 Auth 服务（阶段 0）

- **需求 / Issue**：https://github.com/xiayy860612/agentic-engineer/issues/3

## 摘要

浏览器**直连** **Auth（FastAPI）** 完成登录。会话为 **HttpOnly Cookie `ae_session`**，Session 数据在 Auth **进程内** 维护（**单实例** 前提）。admin-web 使用 `fetch(..., { credentials: 'include' })` 调用 Auth。

受保护占位路由 **`/dashboard`**：在跨端口本地开发下，Next.js **middleware 无法读取** 发往 Auth 域的 Cookie，因此采用 **客户端** 请求 `GET /api/v1/auth/session` 校验；未登录时 **`router.replace('/login')`**，与 plan 中「若仅前端判断，则重定向至 `/login`」一致。生产若将 admin-web 与 Auth 配为**可共享 Cookie 的站点模型**（同 eTLD+1 + Cookie `Domain`），可再收紧为边缘或同源中间层校验。

## 环境变量

| 位置 | 变量 | 说明 |
|------|------|------|
| Auth | `ADMIN_WEB_ORIGIN` | admin-web 部署 **完整 origin**（无尾斜杠），写入 CORS `Access-Control-Allow-Origin`。默认 `http://localhost:3000`。 |
| Auth | `AUTH_DATABASE_URL` | SQLAlchemy 连接串；默认 `sqlite:///./data/auth.db`（相对 auth-service 进程工作目录需可写 `data/`）。 |
| Auth | `AUTH_COOKIE_SECURE` | Cookie `Secure`。本地 HTTP 使用 `false`；HTTPS 生产使用 `true`。 |
| Auth | `AUTH_SESSION_TTL_SECONDS` | Session TTL（秒），默认 `86400`。 |
| admin-web | `NEXT_PUBLIC_AUTH_API_BASE_URL` | Auth 对外 origin（无尾斜杠）。未设置时开发默认 `http://127.0.0.1:8000`；**生产须显式配置**，且与 `ADMIN_WEB_ORIGIN` 成对一致以便 CORS 与浏览器跨站携带 Cookie。 |

## 对外 HTTP 契约（登录 / 登出 / 会话探测）

- **`POST /api/v1/auth/login`**  
  - 成功：**200**，`{ "success": true }`，响应头 **`Set-Cookie: ae_session=...`**（`HttpOnly`、`SameSite=Lax`、`Path=/`，`Secure` 见上）。  
  - 泛化凭据失败：**401**，`{ "error": "invalid_credentials", "message": "用户名或密码错误" }`（未知用户与错误密码**对外一致**）。

- **`POST /api/v1/auth/logout`**  
  - 成功：**204**，清除进程内 session，并 **`Set-Cookie` 清除 `ae_session`**。

- **`GET /api/v1/auth/session`**（供 admin-web 判断占位页，**非**登录失败子类枚举）  
  - 有效 session：**200**，`{ "username": "<name>" }`。  
  - 否则：**401**，`{ "error": "unauthenticated", "message": "未登录或会话已失效" }`。

OpenAPI：部署后访问 `{AUTH_ORIGIN}/openapi.json`。

## 本地验收（AC4）

1. **Auth**：`cd auth-service`，`uv sync --extra dev`（Python **3.11**，见 `auth-service/.python-version`）、`mkdir -p data`，`uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`。  
2. **admin-web**：`cd admin-web`，`pnpm install`，`pnpm dev`（默认认为 Auth 在 `http://127.0.0.1:8000`；若 admin-web 非 `http://localhost:3000`，将 Auth 的 `ADMIN_WEB_ORIGIN` 设为实际 admin-web origin）。  
3. **带外建号**：`cd auth-service && uv run auth-create-user --username demo --password '<password>'`。  
4. 浏览器打开 admin-web **`/login`**，使用 `demo` 登录，应进入 **`/dashboard`**；错误密码与不存在用户须展示**相同**错误文案（与响应体 `message` 一致）。

## 运维约束

- Auth **仅承诺单实例**；进程重启会清空所有 Session。  
- **无外置 Session（如 Redis）前**，勿对 Auth 做无 sticky 的多副本横向扩展。

实现与命令细节见 **`auth-service/AGENTS.md`**、**`admin-web/AGENTS.md`**。
