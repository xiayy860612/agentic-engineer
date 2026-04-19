# AGENTS — `auth-service/` 子项目

面向人类协作者与 AI 代理的开发约定。修改本文件前须先阅读根目录 `AGENTS.md`。

---

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Python | **3.11**（见仓库 `auth-service/.python-version`） | 运行时 |
| **uv** | 当前稳定版 | 依赖锁定、虚拟环境、脚本入口（[Astral 文档](https://docs.astral.sh/uv/)） |
| FastAPI | 0.115+ | HTTP API |
| SQLAlchemy | 2.x | SQLite 用户存储（可换连接串） |
| Argon2id | argon2-cffi | 密码哈希 |
| Uvicorn | 0.32+ | ASGI 服务 |
| pytest / httpx / pytest-cov / ruff | 见 `pyproject.toml` 的 `dev` extra | 测试、覆盖率与 lint |

---

## 目录结构

```
auth-service/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI 应用入口
│   ├── config.py         # 环境变量与设置
│   ├── database.py       # Engine、SessionLocal、建表
│   ├── models.py         # ORM 模型
│   ├── schemas.py        # 请求/响应 Pydantic
│   ├── session_store.py  # 进程内 Session 表
│   ├── security.py       # 密码哈希与校验
│   ├── routers/
│   │   └── auth.py       # /api/v1/auth/*
│   └── cli.py            # 带外建号 CLI
├── tests/
├── pyproject.toml
├── uv.lock               # 由 `uv lock` 生成；提交入库以便 CI/同事复现
├── .python-version       # 3.11，供 uv / asdf 等识别
├── README.md
└── AGENTS.md
```

---

## 开发命令

在 **`auth-service/`** 目录执行；首次或依赖变更后先 **`uv sync --extra dev`**（会使用 `.python-version` 解析 **Python 3.11**）。

```bash
# 安装运行时 + 开发依赖（锁定版本见 uv.lock）
uv sync --extra dev

# 代码风格
uv run ruff check app tests
uv run ruff format app tests

# 测试 + 覆盖率（门禁 ≥90% 行覆盖率，见根目录 AGENTS.md）
uv run pytest --cov=app --cov-report=term-missing

# 本地运行 API
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

CI 或交付前：对上述命令零失败后再合并。

---

## 契约摘要（真源以仓库内 OpenAPI 与 `specs/.../plan.md` 为准）

- `POST /api/v1/auth/login` — JSON `username` / `password`；成功 `200` + `Set-Cookie: ae_session`；泛化失败 `401` + 固定 JSON。
- `POST /api/v1/auth/logout` — 需携带 Session Cookie；清除服务端 session 与 Cookie。
- `GET /api/v1/auth/session` — 校验 Session；成功 `200` + `{"username":...}`；未登录 `401`（供 admin-web 跨域判断占位页，非登录失败子类）。

---

## 安全

- 禁止日志打印密码或原始哈希。
- 禁止将生产密钥提交入库；使用环境变量注入。
