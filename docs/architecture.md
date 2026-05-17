# Agentic Engineer — 系统架构

> 最后更新：2026-05-10 | 基于 `feature/add-agents` 分支代码实际状态梳理

---

## 1. 整体拓扑

```
┌─────────────────────────────────────────────────────────┐
│  Browser (admin-web 用户)                                │
│  - http://localhost:3000                                │
└────────────┬────────────────────────────────────────────┘
             │
             │ fetch(url, { credentials: "include" })
             │ Cookie: ae_session  (HttpOnly, SameSite=Lax)
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌──────────┐    ┌──────────────┐
│ admin-web │    │ auth-service │
│ (Next.js) │    │  (FastAPI)   │
│ :3000     │    │  :8000       │
└──────────┘    └──────┬───────┘
    │                  │
    │ dev rewrite      │ SQLAlchemy
    │ /api/* → :8000   │
    └──────────────────┘
                       │
                       ▼
                  ┌────────┐
                  │ SQLite │
                  │ (文件)  │
                  └────────┘
```

**关键设计决策**：
- 浏览器**直连** auth-service（CORS + HttpOnly Cookie），不经过 Next.js 服务端中转
- 开发环境下 Next.js 通过 `rewrites` 代理 `/api/*` → `http://127.0.0.1:8000/api/*`
- 生产环境 admin-web 与 auth-service 部署为同 eTLD+1 站点模型以共享 Cookie
- Session 为**进程内存储**（单实例约束），暂无 Redis 等外置方案

---

## 2. 限界上下文（Bounded Context）

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ┌─────────────────────┐                            │
│   │    Identity & Auth  │   auth-service             │
│   │    Context          │                            │
│   │                    │                            │
│   │  • 用户身份校验     │                            │
│   │  • 会话生命周期     │                            │
│   │  • 凭据管理         │                            │
│   └────────┬───────────┘                            │
│            │                                         │
│            │  HTTP + Cookie (ae_session)             │
│            │  OpenAPI 契约                            │
│            ▼                                         │
│   ┌─────────────────────┐                            │
│   │    Admin UI         │   admin-web                │
│   │    Context          │                            │
│   │                    │                            │
│   │  • 登录/登出界面    │                            │
│   │  • 受保护路由守卫   │                            │
│   │  • 导航与布局       │                            │
│   └─────────────────────┘                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**上下文映射（Context Map）**：

| 关系 | 上游 | 下游 | 说明 |
|------|------|------|------|
| **Conformist** | Identity & Auth | Admin UI | Admin UI 完全遵循 Auth 的 API 契约（OpenAPI），无独立领域模型 |
| **Published Language** | — | — | OpenAPI 文档 + 共享的请求/响应 JSON schema 作为发布语言 |

当前阶段 Admin UI 没有独立的领域模型——它直接消费 Auth 的 API 响应形状。浏览器端的 session 状态（username）是 Auth 领域数据的投影，不构成独立领域。

---

## 3. 领域模型

```
┌──────────────────────────────────────────────────┐
│  Identity & Auth Context — 当前领域模型            │
│                                                  │
│  ┌────────────────────────────┐                 │
│  │  User (Aggregate Root)     │                 │
│  │────────────────────────────│                 │
│  │  id: int (PK)              │                 │
│  │  username: str (U)         │                 │
│  │  password_hash: str        │                 │
│  └────────────┬───────────────┘                 │
│               │                                 │
│               │ 1                               │
│               │                                 │
│               *                                 │
│  ┌────────────┴───────────────┐                 │
│  │  Session (Entity)           │                 │
│  │  ── 进程内，非持久化 ──      │                 │
│  │─────────────────────────────│                 │
│  │  token: str (opaque)        │                 │
│  │  user_id: int               │                 │
│  │  username: str              │                 │
│  │  expires_at: float          │                 │
│  └─────────────────────────────┘                 │
│                                                  │
│  ┌────────────────────────────┐                 │
│  │  Credentials (Value Object) │                 │
│  │────────────────────────────│                 │
│  │  username: str             │                 │
│  │  password: str             │                 │
│  │  ── 仅用于登录请求，不持久化 ──│                │
│  └────────────────────────────┘                 │
│                                                  │
│  ┌────────────────────────────┐                 │
│  │  PasswordHash (Value Obj)   │                 │
│  │────────────────────────────│                 │
│  │  hash: str (Argon2id)      │                 │
│  │  ── 存储在 User 中 ──       │                 │
│  └────────────────────────────┘                 │
└──────────────────────────────────────────────────┘
```

**不变量**：
- `User.username` 全局唯一
- `Session` 创建后 TTL 内有效，过期自动失效
- 凭据校验失败对外不可区分子类（未知用户 = 错误密码）

**聚合设计**：

| 聚合根 | 内部实体/值对象 | 边界说明 |
|--------|---------------|---------|
| **User** | PasswordHash | 用户身份；凭据校验不跨聚合边界，Session 通过 user_id 引用 User |
| **Session** | — | 独立聚合，进程内存储，非持久化；持有 user_id + username 投影 |

---

## 4. 安全设计

| 层面 | 措施 |
|------|------|
| **密码** | Argon2id 哈希存储；禁止明文日志 |
| **Session** | HttpOnly Cookie `ae_session`、SameSite=Lax、Path=/ |
| **CORS** | 固定单一 origin、`Allow-Credentials: true` |
| **防枚举** | 未知用户与错误密码返回相同 HTTP 状态码与响应体 |
| **CSRF** | SameSite=Lax + 所有请求 JSON body（非 form POST） |

---

## 5. 已完成功能

| # | 功能 | Issue | Spec |
|---|------|-------|------|
| 1 | Next.js 初始项目搭建 | [#1](https://github.com/xiayy860612/agentic-engineer/issues/1) | [specs/1-创建nextjs-初始项目/](../specs/1-创建nextjs-初始项目/spec.md) |
| 2 | Session 登录 & Admin Web Shell | [#3](https://github.com/xiayy860612/agentic-engineer/issues/3) | [specs/3-用户可以登录-admin-web/](../specs/3-用户可以登录-admin-web/spec.md) |

> 技术栈、目录结构、开发命令等细节见各子项目 `AGENTS.md`：
> - [admin-web/AGENTS.md](../admin-web/AGENTS.md)
> - [auth-service/AGENTS.md](../auth-service/AGENTS.md)