# AGENTS — `e2e/` 子项目

面向人类协作者与 AI 代理的开发约定。修改本文件前须先阅读根目录 `AGENTS.md`。

---

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Playwright | 1.59.x | E2E 测试框架 |
| Node.js | ≥20 | 运行环境 |

---

## 目录结构

```
e2e/
├── home.spec.ts          # Homepage 验收测试
├── navbar.spec.ts        # 导航栏验收测试
├── playwright.config.ts  # Playwright 配置
├── package.json
├── pnpm-lock.yaml
└── playwright-report/    # HTML 测试报告（CI 自动生成）
```

---

## 开发命令

```bash
# 安装依赖
pnpm install

# 安装浏览器
pnpm exec playwright install --with-deps chromium

# 运行所有测试（自动启动 web dev server）
pnpm test

# UI 模式（可视化调试）
pnpm test:ui

# 在特定浏览器运行
pnpm test --project=chromium

# 调试已失败的测试
pnpm test --debug
```

---

## 测试覆盖的验收标准

| AC | 测试文件 | 说明 |
|----|---------|------|
| AC1 — 项目启动 | `home.spec.ts` | 页面可访问，title 与 h1 正确 |
| AC2 — shadcn Button 存在 | `home.spec.ts` | Get Started 按钮可见 |
| AC5 — 响应式布局 | `home.spec.ts` | 无水平溢出，各断点列数正确 |
| AC6 — 移动端导航 | `navbar.spec.ts` | 移动端汉堡菜单功能正常 |

---

## 配置说明

- `playwright.config.ts` 中 `webServer` 配置会自动启动 `admin-web/` 的 dev server
- `baseURL` 设为 `http://localhost:3000`
- CI 环境：`CI=true` 时启用 `forbidOnly` 与 2 次重试
