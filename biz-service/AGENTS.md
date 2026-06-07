# AGENTS — `biz-service/` 子项目

面向人类协作者与 AI 代理的开发约定。修改本文件前须先阅读根目录 `AGENTS.md`。

---

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Python | **3.11**（见 `biz-service/.python-version`） | 运行时 |
| **uv** | 当前稳定版 | 依赖锁定、虚拟环境 |
| FastAPI | 0.115+ | 异步 HTTP API |
| SQLAlchemy | 2.x async | `asyncpg` 连接 Supabase Postgres |
| PyJWT | 2.x + cryptography | 通过 Supabase JWKS 校验 access token |
| Uvicorn | 0.32+ | ASGI 服务 |
| pytest / httpx / pytest-asyncio / pytest-cov / ruff | 见 `pyproject.toml` 的 `dev` extra | 测试、覆盖率与 lint |

---

## 目录结构

```
biz-service/
├── app/
│   ├── main.py                 # FastAPI 应用入口（async lifespan）
│   ├── config.py               # 环境变量
│   ├── auth.py                 # JWT 用户依赖（get_current_user）
│   ├── jwks.py                 # Supabase JWKS 验签
│   ├── database.py             # AsyncEngine、AsyncSession、建表
│   ├── models.py               # ORM 模型
│   ├── schemas.py              # Pydantic 响应模型
│   ├── instruments_service.py  # instruments 异步查询逻辑
│   └── routers/
│       └── instruments.py      # GET /api/v1/instruments
├── tests/
├── pyproject.toml
├── uv.lock
├── .python-version
├── .env.example
├── README.md
└── AGENTS.md
```

---

## 开发命令

在 **`biz-service/`** 目录执行；首次或依赖变更后先 **`uv sync --extra dev`**。

```bash
uv sync --extra dev
uv run ruff check app tests
uv run ruff format app tests
uv run pytest --cov=app --cov-report=term-missing
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

---

## 契约摘要

- `GET /health` — 存活探针，无需认证；`200` + `{"status":"ok"}`。
- `GET /api/v1/instruments` — 需 `Authorization: Bearer <supabase_access_token>`；JWKS 验签通过后经 async SQLAlchemy 读 `instruments` 表（`id`, `name`）；数据库错误时 `502`。
- OpenAPI 真源：本地 `/openapi.json`；交互文档 `/docs`（Swagger UI）、`/redoc`。

---

## 环境变量

| 变量 | 说明 |
|------|------|
| `BIZ_DATABASE_URL` | Async SQLAlchemy 连接串，生产用 `postgresql+asyncpg://...`（Supabase Postgres 直连或 pooler） |
| `BIZ_JWKS_URL` | JWKS 地址，用于拉取并缓存验签公钥（如 `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`） |
| `BIZ_CORS_ORIGINS` | CORS 允许的 origin，逗号分隔。默认 `http://localhost:3000` |

启动时由 **pydantic-settings** 自动加载（不新增依赖）：`.env` → `.env.local`（后者覆盖前者）；进程环境变量 `BIZ_*` 优先级最高。密钥放 `.env.local`，模板见 `.env.example`。

---

## 安全

- 禁止日志打印 JWT 或数据库密码。
- 业务 API 默认要求 Supabase `authenticated` 角色的 access token（`aud=authenticated`），通过 **JWKS 非对称验签**（非 shared secret）。
- 直连 Postgres 时绕过 PostgREST/RLS；需在应用层控制授权，或使用受限 DB 角色。
