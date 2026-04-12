# 任务拆分与进度 — 创建 Next.js 初始项目

- Spec: [spec.md](./spec.md)
- Plan: [plan.md](./plan.md)
- Issue: https://github.com/xiayy860612/agentic-engineer/issues/1

---

## 阶段一：pnpm workspace + 脚手架

- [ ] 仓库根添加 `pnpm-workspace.yaml`（`packages: ['web']`）与根 `package.json` **(AC1)**
- [ ] 使用 `create-next-app` 初始化 `web/`（TypeScript + App Router + Tailwind CSS + `src/` 目录 + ESLint） **(AC1)**
- [ ] 确认 `web/tsconfig.json` 中 `strict: true` 已开启 **(AC2)**
- [ ] 将 `src/app/globals.css` 移至 `src/styles/globals.css`，更新 `layout.tsx` 的引用路径

## 阶段二：集成 shadcn/ui

- [ ] 在 `web/` 执行 `pnpm dlx shadcn@latest init`，确认 CSS 变量写入 `src/styles/globals.css` **(AC2)**
- [ ] 执行 `pnpm dlx shadcn@latest add button`，验证 `src/components/ui/button.tsx` 存在 **(AC2)**

## 阶段三：响应式首页

- [ ] 实现首页 `src/app/page.tsx`：手机单列（`grid-cols-1`）、平板双列（`sm:grid-cols-2`）、PC 三列（`lg:grid-cols-3`），纯 Tailwind class，无横向溢出 **(AC5)**

## 阶段四：移动端导航

- [ ] 实现 `src/components/Navbar.tsx`：宽屏水平导航（`hidden sm:flex`）、窄屏汉堡菜单（`sm:hidden`，`useState` 控制展开/折叠），使用 shadcn/ui `Button` **(AC6)**
- [ ] 在 `layout.tsx` 中引入 `Navbar` 组件，验证手机视口点击汉堡菜单可展开

## 阶段五：代码规范配置

- [ ] 添加 `web/.prettierrc`（`semi: true, singleQuote: true, tabWidth: 2`） **(AC3)**
- [ ] 确认 ESLint 保持 `next/core-web-vitals` 规则集，执行 `pnpm lint` 零报错 **(AC3)**

## 阶段六：Playwright e2e 测试

- [ ] 在 `web/` 安装并初始化 Playwright（`pnpm dlx playwright install --with-deps`），生成 `playwright.config.ts`，配置 baseURL 指向 `http://localhost:3000`
- [ ] 编写 e2e 测试 `web/e2e/home.spec.ts`：验证首页可访问（AC1）、shadcn Button 组件存在（AC2）、无横向溢出（AC5）
- [ ] 编写 e2e 测试 `web/e2e/navbar.spec.ts`：验证 PC 视口下导航水平展开、手机视口（375px）下汉堡菜单存在且点击可展开（AC6）
- [ ] 执行 `pnpm exec playwright test`，所有用例通过

## 阶段七：AGENTS.md

- [ ] 创建 `web/AGENTS.md`，记录技术栈说明（含 `styles/` 职责）、dev / lint / typecheck / build 命令、Playwright e2e 测试命令（`pnpm exec playwright test`）与运行说明 **(AC4)**

## 收尾

- [ ] 执行 `pnpm build` 确认编译无报错
- [ ] 在 `docs/web-app-setup.md` 中归档：技术选型与版本、`web/` 目录结构、响应式断点约定、Playwright e2e 测试说明、Issue 链接