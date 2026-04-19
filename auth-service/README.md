# Auth — FastAPI login service

阶段 0：单实例、进程内 Session、与 [plan.md](../specs/3-用户可以登录-admin-web/plan.md) 对齐（Issue [#3](https://github.com/xiayy860612/agentic-engineer/issues/3)）。

**Python 3.11** + **[uv](https://docs.astral.sh/uv/)**；版本见 `auth-service/.python-version` 与 `uv.lock`。

## 环境变量

| 变量 | 说明 |
|------|------|
| `ADMIN_WEB_ORIGIN` | admin-web 部署 origin（完整 URL，无尾斜杠），用于 CORS `Access-Control-Allow-Origin`。默认 `http://localhost:3000`。 |
| `AUTH_DATABASE_URL` | SQLAlchemy 数据库 URL。默认 `sqlite:///./data/auth.db`（相对进程 cwd）。 |
| `AUTH_COOKIE_SECURE` | Session Cookie 是否 `Secure`。本地 `http` 设为 `false`；生产 `https` 设为 `true`。默认 `false`。 |
| `AUTH_SESSION_TTL_SECONDS` | Session TTL（秒）。默认 `86400`。 |

密钥类变量勿提交仓库；见根目录 `AGENTS.md`。

## 本地启动

需已安装 [uv](https://docs.astral.sh/uv/getting-started/installation/)，且本机可提供 **Python 3.11**（`uv` 可按需下载解释器）。

```bash
cd auth-service
uv sync --extra dev
mkdir -p data
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 带外创建测试用户（AC4）

```bash
cd auth-service
uv sync --extra dev
uv run auth-create-user --username demo --password 'your-password'
```

## 约束

- **单实例**：Session 仅存进程内存；进程重启会清空会话。
- **禁止多副本**（无外置 Session 时）：水平扩展须先完成 Session 外置（见 plan 阶段 B）。

详见 [AGENTS.md](./AGENTS.md)。
