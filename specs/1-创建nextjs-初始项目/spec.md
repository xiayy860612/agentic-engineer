# 创建nextjs 初始项目

- Issue: https://github.com/xiayy860612/agentic-engineer/issues/1

## 背景与目标

为 agentic-engineer 仓库搭建一个 Next.js 全栈应用初始骨架，作为后续功能开发的基础。目标是提供一个开箱即用、符合仓库约定的 Next.js 项目，供团队快速迭代，并支持手机、平板、PC 多端自适应。

## 技术选型

| 技术 | 版本/说明 |
|------|-----------|
| Next.js | 最新稳定版，使用 App Router |
| TypeScript | 严格模式（`strict: true`） |
| Tailwind CSS | 最新稳定版（v4），断点：`sm`/`md`/`lg`/`xl` |
| shadcn/ui | 组件库，按需引入 |

## 范围

- 使用 `create-next-app` 初始化项目（TypeScript + App Router + Tailwind CSS）
- 集成 shadcn/ui（初始化配置，引入至少 1 个示例组件如 Button）
- 配置响应式布局：基于 Tailwind CSS 断点（`sm` / `md` / `lg` / `xl`）适配手机、平板、PC 三端
- 首页示例页面需展示响应式排版（移动端单列、平板双列、PC 多列或侧边栏布局）
- 移动端导航栏折叠为汉堡菜单
- 配置 ESLint / Prettier（与仓库约定一致）
- 添加子项目 `AGENTS.md`（记录本子项目的开发约定与测试命令）
- 项目目录置于 `web/`（无 `apps/` 层）
- 样式管理与组件分离：全局样式与 design tokens 置于 `src/styles/`，组件目录（`src/components/`）只含 JSX 与逻辑；组件内使用 Tailwind utility class，不引入 SCSS

## 非目标

- 用户认证（Auth.js / NextAuth）
- 数据库集成（Prisma / ORM）
- Claude API / AI 功能集成
- 部署配置（CI/CD、Docker）
- 原生 App（iOS / Android）

## 验收标准（AC）

#### AC1 — 项目启动
**Given** 开发者克隆仓库后进入 `web/`  
**When** 执行 `pnpm install && pnpm dev`  
**Then** 项目在本地成功启动，浏览器可访问首页，无编译错误

#### AC2 — 配置正确
**Given** 项目已初始化  
**When** 检查项目配置文件  
**Then** TypeScript 严格模式已开启（`strict: true`），Tailwind CSS 已正确配置，shadcn/ui 已完成初始化（存在 `components/ui/` 目录及至少一个组件）

#### AC3 — Lint 通过
**Given** 项目已初始化  
**When** 执行 `pnpm lint`  
**Then** ESLint 无报错

#### AC4 — AGENTS.md 存在
**Given** 项目已初始化  
**When** 检查 `web/AGENTS.md`  
**Then** 文件存在，记录了本子项目的开发启动命令、测试框架与门禁规则

#### AC5 — 响应式多端适配
**Given** 首页已实现  
**When** 在以下视口宽度下访问首页：手机（≤640px）、平板（641px–1024px）、PC（≥1025px）  
**Then** 布局正确自适应，无横向溢出滚动条，核心内容均可正常阅读与操作

#### AC6 — 移动端导航
**Given** 首页包含导航栏  
**When** 在手机视口（≤640px）下查看  
**Then** 导航栏折叠为汉堡菜单或移动端友好形式，点击可展开

## 假设与风险

- 假设使用 pnpm workspace 管理 monorepo（与现有 devops 目录约定一致）
- 风险：shadcn/ui 版本与 Next.js / React 版本兼容性，需在初始化时确认
- 风险：shadcn init 默认将 CSS 变量写入 `src/app/globals.css`，需手动迁移至 `src/styles/globals.css` 并更新 `layout.tsx` 引用
