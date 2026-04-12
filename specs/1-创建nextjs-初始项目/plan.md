# 方案设计 — 创建 Next.js 初始项目

- Issue: https://github.com/xiayy860612/agentic-engineer/issues/1
- Spec: [spec.md](./spec.md)

---

## 1. 整体架构决策

### 目录结构

> **注意**：spec.md 中写的是 `apps/web/`，本实现以用户指令为准，直接使用 `web/`（无 `apps/` 层）。

```
agentic-engineer/
├── web/                        # Next.js 应用（无 apps/ 层）
│   ├── src/
│   │   ├── app/                # App Router：layout.tsx、page.tsx 等
│   │   ├── components/         # 应用级 React 组件（JSX + 逻辑）
│   │   │   ├── ui/             # shadcn/ui 生成的原子组件
│   │   │   └── Navbar.tsx      # 导航组件（含汉堡菜单逻辑）
│   │   ├── styles/             # 样式管理（与组件分离）
│   │   │   ├── globals.css     # Tailwind 指令 + shadcn CSS 变量
│   │   │   └── tokens.css      # （可选）自定义 design tokens
│   │   └── lib/                # 工具函数
│   ├── public/
│   ├── AGENTS.md
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── eslint.config.mjs
│   └── .prettierrc
├── package.json                # pnpm workspace root
└── pnpm-workspace.yaml         # packages: ['web']
```

**与 spec.md 的偏差：**

| 项目 | spec.md | 本实现 | 理由 |
|------|---------|--------|------|
| 目录位置 | `apps/web/` | `web/` | 用户明确指令 |
| 样式组织 | 未指定 | `src/styles/` 独立目录 | 用户明确指令 |

**样式分层原则：**
- `styles/globals.css`：Tailwind `@import`、shadcn CSS 变量（`--background`、`--foreground` 等）、全局 reset
- `tailwind.config.ts`：断点扩展、颜色主题 token 映射
- 组件内**只用 Tailwind class**，禁止 inline style；无组件级 `.css` 文件（保持 utility-first）
- **不引入 SCSS**：Tailwind v4 原生 CSS 变量 + utility-first 覆盖所有样式需求，SCSS 无附加价值

### 技术选型确认

| 技术 | 版本 | 理由 |
|------|------|------|
| Next.js | 15.x（latest stable） | App Router 成熟，官方推荐 |
| React | 19.x | Next.js 15 配套 |
| TypeScript | 5.x，`strict: true` | spec 要求 |
| Tailwind CSS | 4.x（latest stable） | spec 要求；v4 与 Next.js 15 官方集成支持 |
| shadcn/ui | latest（支持 Tailwind v4） | spec 要求 |
| pnpm | 9.x | monorepo workspace |

---

## 2. 实现路径

### 阶段一：pnpm workspace + 脚手架

1. 仓库根添加 `pnpm-workspace.yaml`（`packages: ['web']`）与根 `package.json`
2. 使用 `create-next-app` 初始化 `web/`（TS + App Router + Tailwind + src/ + ESLint）
3. 确认 `tsconfig.json` 中 `strict: true`
4. 将 `src/app/globals.css` **移至** `src/styles/globals.css`，更新 `layout.tsx` 引用路径

### 阶段二：集成 shadcn/ui

1. 在 `web/` 执行 `pnpm dlx shadcn@latest init`
2. 确认 CSS 变量写入 `src/styles/globals.css`（非 `src/app/`）
3. `pnpm dlx shadcn@latest add button`，验证 `src/components/ui/button.tsx` 存在

### 阶段三：响应式首页实现

首页 `src/app/page.tsx` 三端布局（无 inline style，纯 Tailwind class）：

| 视口 | 布局 |
|------|------|
| 手机（< `sm` = 640px） | 单列 `grid-cols-1` |
| 平板（`sm`–`lg` = 640–1024px） | 双列 `sm:grid-cols-2` |
| PC（> `lg` = 1024px） | 三列或侧边栏 `lg:grid-cols-3` |

### 阶段四：移动端导航

在 `src/components/Navbar.tsx` 中：
- 宽屏：水平导航链接，`hidden sm:flex`
- 窄屏（`< sm`）：汉堡图标按钮，`sm:hidden`，`useState` 控制展开/折叠
- 使用 shadcn/ui `Button` 组件实现汉堡按钮

### 阶段五：代码规范配置

1. **Prettier**：`web/.prettierrc`（`semi: true, singleQuote: true, tabWidth: 2`）
2. **ESLint**：保持 `next/core-web-vitals` 规则集
3. 确认 `pnpm lint` 无报错

### 阶段六：AGENTS.md

在 `web/AGENTS.md` 中记录：
- 技术栈与目录说明（含 `styles/` 职责）
- dev / lint / typecheck / build 命令
- 测试框架（本阶段豁免：纯脚手架）

---

## 3. 验收对照

| AC | 对应实现 |
|----|---------|
| AC1 — 项目启动 | 阶段一：`pnpm dev` 成功 |
| AC2 — 配置正确 | `strict: true` + Tailwind + `components/ui/` |
| AC3 — Lint 通过 | 阶段五：`pnpm lint` 零报错 |
| AC4 — AGENTS.md | 阶段六 |
| AC5 — 响应式 | 阶段三：三端布局无横向溢出 |
| AC6 — 移动端导航 | 阶段四：汉堡菜单可展开 |

---

## 4. 风险与应对

| 风险 | 应对 |
|------|------|
| shadcn/ui 与 Tailwind v4 兼容性 | `shadcn@latest` 已支持 v4；若不兼容，降级 Tailwind 至 v3 |
| shadcn init 将 CSS 变量写入错误位置 | 手动指定 css 文件路径，或 init 后迁移 |
| pnpm workspace 路径解析问题 | 根 `package.json` 不含具体依赖；子项目独立 lock |

---

## 5. 测试先行说明（豁免）

本 spec 属于**纯脚手架与配置**，无新业务逻辑。按根目录 AGENTS.md「豁免」条款声明：

> 本次交付为 Next.js 项目骨架初始化，无业务逻辑行为，豁免单元测试要求；验证方式为 `pnpm lint`、`pnpm build`（编译检查）与浏览器手动验收 AC1/AC5/AC6。

---

## 6. `docs/` 归档计划

完成后在 `docs/web-app-setup.md` 中记录：
- 技术选型与版本锁定
- `web/` 目录结构说明（含 `styles/` 职责）
- 响应式断点约定
- Issue 链接
