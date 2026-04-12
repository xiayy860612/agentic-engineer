<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS — `web/` 子项目

面向人类协作者与 AI 代理的开发约定。修改本文件前须先阅读根目录 `AGENTS.md`。

---

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 16.x | App Router，React 19 |
| TypeScript | 5.x | 严格模式 (`strict: true`) |
| Tailwind CSS | 4.x | utility-first，无 SCSS |
| shadcn/ui | 4.x | 组件库，`src/components/ui/` |
| pnpm | 10.x | workspace 管理 |

## 目录结构

```
web/
├── src/
│   ├── app/                  # App Router 页面与 layout
│   ├── components/
│   │   ├── ui/               # shadcn/ui 原子组件（不要手动编辑）
│   │   └── Navbar.tsx        # 导航栏（含移动端汉堡菜单）
│   ├── styles/
│   │   └── globals.css       # Tailwind 指令 + shadcn CSS 变量（不要在 app/ 下放同名文件）
│   └── lib/
│       └── utils.ts          # cn() 等工具函数
├── public/                   # 静态资源
├── components.json           # shadcn/ui 配置
├── .prettierrc               # Prettier 配置
├── AGENTS.md                 # 本文件
└── package.json
```

## 样式管理原则

- `src/styles/globals.css` 是样式权威位置，含 Tailwind 指令与 shadcn CSS 变量
- 组件内**只用 Tailwind class**，**禁止** `style={...}` inline style 与组件级 `.css` 文件
- **不引入 SCSS**

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发服务器（http://localhost:3000）
pnpm dev

# 类型检查
pnpm tsc --noEmit

# ESLint
pnpm lint

# 构建（验证编译无错误）
pnpm build
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `CI=true` | CI 环境标志（跳过 TTY 确认等） |

## 响应式断点约定

| 断点 | 视口宽度 | 布局 |
|------|---------|------|
| 默认（mobile） | < 640px | 单列 `grid-cols-1` |
| `sm`（tablet） | 640–1024px | 双列 `sm:grid-cols-2` |
| `lg`（PC） | ≥ 1025px | 三列 `lg:grid-cols-3` |
