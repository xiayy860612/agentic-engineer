# AGENTS — `web/` 子项目

面向人类协作者与 AI 代理的开发约定。修改本文件前须先阅读根目录 `AGENTS.md`。

---

## 技术栈

| 技术 | 说明 |
|------|------|
| Next.js | App Router，React 19 |
| TypeScript | 严格模式 (`strict: true`) |
| Tailwind CSS | v3，utility-first |
| shadcn/ui | 组件库，`components/ui/` |
| Supabase | `@supabase/ssr` + `@supabase/supabase-js`，Cookie 会话 |
| pnpm | 依赖管理 |

## 目录结构

```
web/
├── app/
│   └── instruments/          # 示例：经 biz-service API 展示 instruments
├── supabase/
│   └── instruments.sql         # 示例表（biz-service 直连 Postgres 读取）
├── components/
│   ├── ui/                   # shadcn/ui 原子组件
│   ├── instruments-list.tsx  # instruments Client Component（调 biz-service）
│   └── ...                   # 业务组件（登录表单、Auth 按钮等）
├── lib/
│   ├── biz-service/          # biz-service API 客户端（config、instruments）
│   ├── supabase/
│   │   ├── client.ts         # 浏览器端 Supabase 客户端
│   │   ├── server.ts         # Server Component / Route Handler 客户端
│   │   └── proxy.ts          # 会话刷新（供 proxy.ts 使用）
│   └── utils.ts
├── proxy.ts                  # Next.js Proxy（会话中间件）
├── .env.example              # 环境变量模板（复制为 .env.local）
└── AGENTS.md                 # 本文件
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发服务器（http://localhost:3000）
pnpm dev

# ESLint
pnpm lint

# 生产构建
pnpm build

# 生产启动
pnpm start
```

## 环境变量

复制 `.env.example` 为 `.env.local`，填入 Supabase 项目凭据（[Project Connect 对话框](https://supabase.com/dashboard/project/_?showConnect=true)）：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key（或过渡期内的 legacy anon key） |

未配置时首页会显示环境变量警告，Auth 与数据查询不可用。

## biz-service 联调（instruments 示例）

本地开发时 Next.js **dev-only** rewrite 将 `/api/biz/*` 转发至 `http://127.0.0.1:8001/*`（硬编码，无额外环境变量）。生产环境同域名访问 `/api/v1/*`，由部署层路由至 biz-service。

```bash
# terminal 1 — biz-service（见 biz-service/AGENTS.md）
cd biz-service && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# terminal 2 — web
cd web && pnpm dev
```

浏览器请求路径：开发环境 `/api/biz/api/v1/instruments`，生产 `/api/v1/instruments`。Client Component 携带 Supabase `access_token` 作为 `Authorization: Bearer`。

## Supabase 集成要点

- **服务端**：`import { createClient } from "@/lib/supabase/server"`，在 Server Component / Server Action 中使用
- **客户端**：`import { createClient } from "@/lib/supabase/client"`，在 Client Component 中使用
- **会话刷新**：`proxy.ts` 通过 `@/lib/supabase/proxy` 的 `updateSession` 保持 Cookie 会话有效
- **受保护路由**：`/instruments`、`/protected` 等需登录；未登录由 `proxy.ts` 重定向至 `/auth/login`，页面内另做 `getClaims()` 校验
- 参考：[Supabase + Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
