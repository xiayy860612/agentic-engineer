# Biz — FastAPI + Async SQLAlchemy + Supabase JWT

业务 API 服务：通过 Supabase **JWKS** 校验 access token，经 **async SQLAlchemy** 直连 Postgres 读取 `instruments` 表（与 `web/supabase/instruments.sql` 示例一致）。

**Python 3.11** + **[uv](https://docs.astral.sh/uv/)**；版本见 `biz-service/.python-version` 与 `uv.lock`。

## 环境变量

| 变量 | 说明 |
|------|------|
| `BIZ_DATABASE_URL` | `postgresql+asyncpg://...` 连接 Supabase Postgres |
| `BIZ_JWKS_URL` | JWKS 地址（Supabase 验签公钥） |
| `BIZ_CORS_ORIGINS` | CORS origin 列表（逗号分隔）。默认 `http://localhost:3000` |

复制 `.env.example` 为 `.env` 和/或 `.env.local` 后填入（`.env.local` 适合放密钥；后者覆盖前者）。

## 本地启动

```bash
cd biz-service
uv sync --extra dev
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

## API 文档（Swagger）

服务启动后：

| 地址 | 说明 |
|------|------|
| http://localhost:8001/docs | Swagger UI（可在线调试） |
| http://localhost:8001/redoc | ReDoc |
| http://localhost:8001/openapi.json | OpenAPI 3 契约 |

受保护接口需在 Swagger UI 点击 **Authorize**，填入 Supabase access token（`Bearer` 前缀可省略）。

示例请求（需 Supabase 登录后的 access token）：

```bash
curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  http://localhost:8001/api/v1/instruments
```

## 前置条件

在 Supabase SQL Editor 中执行 `web/supabase/instruments.sql`（或已存在同名表）。

详见 [AGENTS.md](./AGENTS.md)。
