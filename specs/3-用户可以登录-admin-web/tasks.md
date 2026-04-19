# Tasks — 用户可以登录 admin-web

- **Spec**：[spec.md](./spec.md)
- **Plan（真源）**：[plan.md](./plan.md)
- **Issue**：https://github.com/xiayy860612/agentic-engineer/issues/3

进度在下方勾选；实现细节以 [plan.md](./plan.md) 为准，变更须先更新 plan/spec 再改代码。

**范围**：仅 **阶段 0**（admin-web + Auth，AC1–AC4）。**阶段 1** 见 [plan.md §9](./plan.md)。

---

## 1. Auth 服务（FastAPI）

- [x] 1.1 初始化 FastAPI 子项目（`auth-service/`），遵循根目录及 `auth-service/AGENTS.md`（测试先行、覆盖率）(AC4)
- [x] 1.2 实现 `POST /api/v1/auth/login`：成功 200 + `Set-Cookie: ae_session` + `{ "success": true }`；失败 401 + 泛化 JSON（AC2/AC3）(AC1–AC3)
- [x] 1.3 密码 Argon2id 存储；用户表；禁止日志泄露密码 (AC1)
- [x] 1.4 Session 存 Auth 进程内；opaque `ae_session`；文档说明单实例与重启失效 (AC1)
- [x] 1.8 实现 `POST /api/v1/auth/logout`：清 session；清除 `ae_session` Cookie
- [x] 1.9 CORS：`Allow-Origin` 为 admin-web 精确 origin、`Allow-Credentials: true`
- [x] 1.10 OpenAPI 覆盖 login、logout（及 session 探测路由）；不含 `/internal/.../access-token`（plan §9）
- [x] 1.11 契约测试：AC2/AC3 响应逐字段一致；登录成功 Set-Cookie；session/logout
- [x] 1.12 文档：`auth-service/README.md`、`auth-service/AGENTS.md` — 环境变量、启动、`auth-create-user` 建号 (AC4)

---

## 2. admin-web（Next.js）

- [x] 2.1 环境变量：`NEXT_PUBLIC_AUTH_API_BASE_URL`（见 `.env.example` 与 `AGENTS.md`）
- [x] 2.2 登录页 `/login`：`username`/`password`，`fetch` 带 `credentials: 'include'` (AC1)
- [x] 2.3 错误展示：401 时使用响应体 `message`（与 plan 一致）(AC2/AC3)
- [x] 2.4 占位受保护路由 `/dashboard`：客户端校验 session，未登录重定向 `/login`（跨域 Cookie 场景，与 plan「若仅前端判断」一致）
- [x] 2.5 单元测试：`pnpm test`（Vitest，`src/lib/auth-api.test.ts`）

---

## 3. 联调与验收

- [x] 3.1 本地按 plan 启动 Auth + admin-web（步骤见 `docs/admin-web-auth.md`）
- [x] 3.2 AC1–AC4 走查说明与契约测试已覆盖；E2E 需本机 `pnpm exec playwright install` 后于 `e2e/` 运行

---

## 依赖顺序（参考）

1. Auth：**1.1 → 1.3 → 1.4 → 1.9 → 1.2 → 1.8 → 1.10 → 1.11 → 1.12**  
2. admin-web：可与 Auth **login + CORS** 并行（2.1–2.3），**2.4** 依赖可本地验证 session
