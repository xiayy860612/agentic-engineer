# User Profile 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将导航栏 AuthButton 改造为下拉菜单（含 Profile 入口 + 退出登录），并新建 `/profile` 受保护页面展示当前用户的 JWT claims（email / role / sub）。

**Architecture:** AuthButton 拆分为 Server Component（`auth-button.tsx`，调用 `getClaims()` 获取 claims，传递 email 作为 props）+ Client Component（`auth-dropdown.tsx`，使用 shadcn/ui `DropdownMenu` 渲染下拉菜单，内含 Profile 导航链接与退出登录按钮）。Profile 页面为独立 Server Component 路由页面，复用 `ProtectedLayout`，通过 `getClaims()` 获取并展示 email / role / sub。

**Tech Stack:** Next.js App Router (React 19) · TypeScript · Tailwind CSS · shadcn/ui (Radix UI DropdownMenu) · Supabase SSR (`@supabase/ssr`) · Vitest + Testing Library（新增，仅用于 AuthDropdown 组件测试）

---

## 文件结构总览

| 操作 | 路径 | 职责 |
|------|------|------|
| **新建** | `web/components/auth-dropdown.tsx` | Client Component，渲染已登录用户的下拉菜单（Profile 入口 + 退出登录） |
| **新建** | `web/app/profile/page.tsx` | Server Component，展示当前用户 email / role / sub |
| **新建** | `web/vitest.config.ts` | Vitest 配置，jsdom 环境 + tsconfig 路径别名 |
| **新建** | `web/test/setup.ts` | Testing Library 全局配置（`cleanup`  afterEach） |
| **新建** | `web/components/__tests__/auth-dropdown.test.tsx` | AuthDropdown 组件单元测试 |
| **修改** | `web/components/auth-button.tsx` | 移除 LogoutButton 引用；已登录时渲染 `AuthDropdown` 并传入 email |
| **修改** | `web/app/protected/layout.tsx` | 移除 `LogoutButton` 的 import |
| **修改** | `web/app/instruments/layout.tsx` | 移除 `LogoutButton` 的 import |
| **修改** | `web/package.json` | 新增 `test` 和 `test:watch` 脚本 |
| **不动** | `web/components/logout-button.tsx` | 保留文件，不再被任何组件引用（遗留代码，后续清理时删除） |

---

## Task 1: 搭建测试基础设施

**Files:**
- Create: `web/vitest.config.ts`
- Create: `web/test/setup.ts`
- Modify: `web/package.json`（添加 scripts + devDependencies）

---

- [ ] **Step 1: 安装测试依赖**

Run:

```bash
cd web && pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom vite-tsconfig-paths
```

Expected: `pnpm` 安装完成，`package.json` 中新增 `devDependencies`。

---

- [ ] **Step 2: 在 package.json 中添加测试脚本**

在 `web/package.json` 的 `"scripts"` 对象中新增两条：

```json
"test": "vitest run",
"test:watch": "vitest"
```

---

- [ ] **Step 3: 创建 vitest 配置文件**

创建 `web/vitest.config.ts`：

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
});
```

> `vite-tsconfig-paths` 自动读取 `tsconfig.json` 中的 `paths` 配置，使测试中可以使用 `@/` 路径别名。

---

- [ ] **Step 4: 创建 Testing Library 全局配置**

创建 `web/test/setup.ts`：

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

---

- [ ] **Step 5: 验证测试基础设施可运行**

先创建一个占位测试，确认 vitest 能正确加载：

创建 `web/components/__tests__/sanity.test.tsx`：

```tsx
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});
```

Run:

```bash
cd web && pnpm test
```

Expected: `✓ sanity > should pass`，输出 `Test Files  1 passed (1)`。

完成后删除该占位测试文件。

---

- [ ] **Step 6: 提交**

```bash
git add web/vitest.config.ts web/test/ web/package.json web/pnpm-lock.yaml
git commit -m "chore(web): set up vitest + testing-library for component tests"
```

---

## Task 2: 编写 AuthDropdown 组件测试（TDD — Red）

**Files:**
- Create: `web/components/__tests__/auth-dropdown.test.tsx`

---

本任务在 `AuthDropdown` 组件尚未实现前编写测试，验证以下行为：
1. 已登录时，渲染 email 作为下拉菜单触发器
2. 菜单包含"Profile"和"退出登录"两个选项
3. "Profile"选项指向 `/profile`
4. 点击"退出登录"调用 `signOut()` 并调用 `router.push("/auth/login")`

---

- [ ] **Step 1: 编写测试文件**

创建 `web/components/__tests__/auth-dropdown.test.tsx`：

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// AuthDropdown 尚未实现 —— RED 状态
import { AuthDropdown } from "../auth-dropdown";

const mockPush = vi.fn();

describe("AuthDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
  });

  it("renders user email as dropdown trigger", () => {
    render(<AuthDropdown email="test@example.com" />);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows Profile and Logout options when opened", async () => {
    const user = userEvent.setup();
    render(<AuthDropdown email="test@example.com" />);

    // Radix DropdownMenu 默认不渲染 content
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("退出登录")).not.toBeInTheDocument();

    await user.click(screen.getByText("test@example.com"));

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("退出登录")).toBeInTheDocument();
  });

  it("renders Profile link with href=/profile", async () => {
    const user = userEvent.setup();
    render(<AuthDropdown email="test@example.com" />);

    await user.click(screen.getByText("test@example.com"));

    const profileLink = screen.getByText("Profile").closest("a");
    expect(profileLink).toHaveAttribute("href", "/profile");
  });

  it("calls signOut and navigates on logout click", async () => {
    const user = userEvent.setup();
    render(<AuthDropdown email="test@example.com" />);

    await user.click(screen.getByText("test@example.com"));
    await user.click(screen.getByText("退出登录"));

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });
});
```

> **Mock 策略说明：**
> - 使用 `vi.hoisted` 提升 `signOut` 间谍至模块顶层，确保测试中的 `signOut` 引用与组件 `createClient()` 链上的 `signOut` 是同一实例（避免 `vi.fn()` 被重复实例化）。
> - `vi.mock("next/navigation")` mock `useRouter` 为空 `vi.fn()`，在 `beforeEach` 中用 `mockReturnValue` 注入 `mockPush`，确保每个测试开始时 push 调用记录已清空。
> - `vite-tsconfig-paths` 使 `@/lib/supabase/client` 在 mock 和组件中解析到同一绝对路径，mock 生效。

---

- [ ] **Step 2: 运行测试，确认全部 RED（失败）**

Run:

```bash
cd web && pnpm test -- --reporter=verbose components/__tests__/auth-dropdown.test.tsx
```

Expected: 因 `../auth-dropdown` 模块不存在，所有测试报错 `Cannot find module '../auth-dropdown'`。**这是预期的 RED 状态**，证明测试确实依赖尚未实现的组件。

---

- [ ] **Step 3: 提交（仅测试文件，此时测试失败）**

```bash
git add web/components/__tests__/auth-dropdown.test.tsx
git commit -m "test(web): add failing tests for AuthDropdown component"
```

---

## Task 3: 实现 AuthDropdown 组件（TDD — Green）

**Files:**
- Create: `web/components/auth-dropdown.tsx`

---

- [ ] **Step 1: 实现 AuthDropdown 组件**

创建 `web/components/auth-dropdown.tsx`：

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AuthDropdownProps {
  email: string;
}

export function AuthDropdown({ email }: AuthDropdownProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {email}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <Mail className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

> **关键设计决策：**
> - Server Component（`auth-button.tsx`）调用 `getClaims()` 获取 claims，将 `email` 作为 props 传入本组件。
> - 退出登录逻辑沿用现有 `LogoutButton` 模式：浏览器端 `createClient()` → `signOut()` → `router.push("/auth/login")`。
> - `DropdownMenuItem asChild + Link` 使 Profile 选项通过 Next.js App Router 导航（不触发整页刷新）。
> - `DropdownMenuItem onSelect` 处理退出登录，Radix UI 在 onSelect 回调执行后自动关闭菜单，避免重复触发。

---

- [ ] **Step 2: 运行测试，确认全部 GREEN（通过）**

Run:

```bash
cd web && pnpm test -- --reporter=verbose components/__tests__/auth-dropdown.test.tsx
```

Expected: 4 个测试全部通过 ✓。

若测试失败，检查：
- `DropdownMenuItem asChild` + `Link` 是否正确渲染 `<a href="/profile">`（测试 3）
- `onSelect` 回调是否在 Radix UI 环境中被正确触发（测试 4）

---

- [ ] **Step 3: 提交**

```bash
git add web/components/auth-dropdown.tsx
git commit -m "feat(web): implement AuthDropdown client component"
```

---

## Task 4: 创建 Profile 页面

**Files:**
- Create: `web/app/profile/page.tsx`

---

本任务创建 `/profile` 路由页面。`proxy.ts` 已自动保护该路径（不在公开白名单中，未登录自动重定向至 `/auth/login`）。页面内部额外调用 `getClaims()` 做二次校验，与 `/protected/page.tsx` 模式一致。

---

- [ ] **Step 1: 创建 Profile 页面**

创建 `web/app/profile/page.tsx`：

```tsx
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Mail, Shield, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

async function ProfileContent() {
  const supabase = await createClient();

  let claims;
  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
      redirect("/auth/login");
    }
    claims = data.claims;
  } catch {
    // getClaims() 调用失败（网络或服务端错误），重定向至登录页
    redirect("/auth/login");
  }

  const email = claims.email ?? "未知";
  const role = claims.role ?? "未分配";
  const sub = claims.sub ?? "未知";

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 max-w-md w-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{email}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Role</span>
            <span className="text-sm font-medium">{role}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">User ID</span>
            <span className="text-sm font-medium font-mono break-all">
              {sub}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
```

> **关键设计点：**
> - `ProfileContent` 为 async Server Component，包裹在 `<Suspense>` 内以支持流式渲染。
> - `claims.role` 缺失时显示"未分配"（覆盖 spec AC-7）。
> - 图标使用 `lucide-react`，与现有项目风格一致。

---

- [ ] **Step 2: 运行 lint 和 typecheck**

Run:

```bash
cd web && pnpm lint && pnpm build
```

Expected: 无 lint 错误，构建成功。若 `KeyRound` 不存在于当前 lucide-react 版本，替换为 `Fingerprint` 或 `Key`。

---

- [ ] **Step 3: 提交**

```bash
git add web/app/profile/
git commit -m "feat(web): add /profile page displaying JWT claims"
```

---

## Task 5: 集成 — 更新 AuthButton 与布局

**Files:**
- Modify: `web/components/auth-button.tsx`
- Modify: `web/app/protected/layout.tsx`
- Modify: `web/app/instruments/layout.tsx`

---

- [ ] **Step 1: 重写 `auth-button.tsx`**

将 `web/components/auth-button.tsx` 内容替换为：

```tsx
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { AuthDropdown } from "./auth-dropdown";

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return user ? (
    <AuthDropdown email={user.email!} />
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
```

> **变更说明：**
> - 移除 `import { LogoutButton }` — 不再引用独立退出按钮。
> - 已登录分支从渲染 `Hey, {user.email}! + <LogoutButton />` 改为渲染 `<AuthDropdown email={user.email!} />`。
> - 未登录分支保持不变。
> - `user.email!` 使用非空断言：Supabase JWT 中 email 字段对 email 认证用户始终存在（spec 假设已验证）。

---

- [ ] **Step 2: 更新 `ProtectedLayout`，移除 LogoutButton import**

修改 `web/app/protected/layout.tsx`，删除第 4 行：

```diff
 import { DeployButton } from "@/components/deploy-button";
 import { EnvVarWarning } from "@/components/env-var-warning";
 import { AuthButton } from "@/components/auth-button";
-import { LogoutButton } from "@/components/logout-button";
 import { ThemeSwitcher } from "@/components/theme-switcher";
```

> 仅删除 import，其他代码不动。`AuthButton` 的使用方式不变（仍包裹在 `<Suspense>` 中）。

---

- [ ] **Step 3: 确认 `InstrumentsLayout` 无 `LogoutButton` 引用**

**无需修改。** 已验证 `web/app/instruments/layout.tsx` 从未引入过 `LogoutButton`。该布局与 `ProtectedLayout` 结构相似但不包含对 `LogoutButton` 的引用。

---

- [ ] **Step 4: 运行 lint 和构建验证**

Run:

```bash
cd web && pnpm lint && pnpm build
```

Expected: 无 lint 错误，构建成功。若有 TypeScript 错误，检查 `AuthDropdown` 的 import 路径和 props 类型。

---

- [ ] **Step 5: 提交**

```bash
git add web/components/auth-button.tsx web/app/protected/layout.tsx web/app/instruments/layout.tsx
git commit -m "feat(web): integrate AuthDropdown into AuthButton and layouts"
```

---

## Task 6: 端到端验证

**Files:**
- 无新增文件

---

本任务通过本地运行应用验证所有验收标准（AC-1 至 AC-8）。

---

- [ ] **Step 1: 启动开发服务器**

Run:

```bash
cd web && pnpm dev
```

在浏览器打开 `http://localhost:3000`。

---

- [ ] **Step 2: 验证 AC-4（未登录状态导航栏）**

未登录时访问首页，导航栏应显示"Sign in"和"Sign up"两个按钮，**不显示下拉菜单**。

---

- [ ] **Step 3: 验证 AC-5（未登录用户访问 /profile）**

未登录时直接访问 `http://localhost:3000/profile`，应被重定向至 `/auth/login`。

---

- [ ] **Step 4: 登录后验证 AC-1（已登录用户查看导航栏下拉菜单）**

登录后访问任意受保护页面（`/protected` 或 `/instruments`），导航栏右侧应显示用户 Email 为触发器文本的可点击按钮。点击后展开下拉菜单，包含"Profile"和"退出登录"两个选项。

---

- [ ] **Step 5: 验证 AC-2（下拉菜单 Profile 导航）**

点击"Profile"选项，浏览器导航至 `/profile`。页面渲染 `ProtectedLayout`（导航栏 + AuthButton + footer），并展示 Email、Role 和 User ID。

---

- [ ] **Step 6: 验证 AC-6 和 AC-7（Profile 页面信息展示）**

确认 Profile 页面显示当前用户的 Email、Role、User ID。若 JWT 中无 role 字段，角色区域应显示"未分配"。

---

- [ ] **Step 7: 验证 AC-3（下拉菜单退出登录）**

点击"退出登录"选项，应被重定向至 `/auth/login`，导航栏恢复为"Sign in"+"Sign up"按钮。

---

- [ ] **Step 8: 验证 AC-8（Instruments 页面下拉菜单）**

登录后访问 `/instruments`，导航栏下拉菜单正常显示与交互。

---

- [ ] **Step 9: 运行全量测试**

Run:

```bash
cd web && pnpm test
```

Expected: 所有 AuthDropdown 测试通过 ✓。

---

- [ ] **Step 10: 最终提交（如有修复）**

如验证过程中发现需要修复的问题，修复后提交：

```bash
git add -A
git commit -m "fix(web): resolve issues found during manual verification"
```

---

## 附录：不变更的文件说明

| 文件 | 说明 |
|------|------|
| `web/components/logout-button.tsx` | 本 spec 阶段保留，不再被任何组件引用。后续清理时可直接删除。 |
| `web/proxy.ts` | 无需修改。`/profile` 不在 `isPublicPath` 白名单中，已被自动保护。 |
| `web/lib/supabase/server.ts` | 无需修改。 |
| `web/lib/supabase/client.ts` | 无需修改。 |
