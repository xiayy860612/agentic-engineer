# 用户个人资料（User Profile）

## 关联 Issue
- Issue: 待创建

## 1. 概述

- **业务背景**: 当前登录用户在导航栏仅能看到纯文本格式的邮箱地址和独立登出按钮，缺少个人身份确认入口和标准化的用户菜单交互。需要提供用户查看自身身份信息（邮箱、角色、用户 ID）的能力，并以标准下拉菜单模式整合导航操作。
- **目标用户**: 所有已登录的 Web 应用用户（包括普通用户和管理员角色）。
- **核心价值**: 
  - 用户可确认当前登录身份与权限角色，减少"我是谁、我有什么权限"的困惑。
  - 导航栏交互标准化，将分散的"退出"按钮整合进下拉菜单，为后续扩展更多用户操作（如设置）预留空间。
- **成功标准**: 
  - 已登录用户能通过导航栏下拉菜单访问 Profile 页面并查看自己的 Email、角色和用户 ID。
  - 下拉菜单中包含"退出登录"选项且功能正常。
  - 未登录用户访问 `/profile` 时被重定向到登录页。

## 2. 干系人与用户

| 干系人 | 角色 | 利益诉求 |
|--------|------|----------|
| 终端用户 | 已登录用户 | 能快速确认自己的身份和角色；便捷退出登录 |
| 管理员 | 系统管理员 | 确认自己正以管理员身份操作；通过 Profile 页面校验 JWT claims 是否正确 |
| 前端开发 | 实现者 | 明确组件拆分边界：AuthButton 改为 server-client 混合模式；Profile 页面复用 ProtectedLayout |
| QA | 测试者 | 覆盖登录/未登录/claims 缺失等多种场景 |

## 3. 需求范围

### 3.1 范围内 (In-Scope)

1. **AuthButton 下拉菜单改造（含 Profile 导航入口）**：将当前 `components/auth-button.tsx` 中"Hey, {user.email}!" + 独立 `LogoutButton` 替换为：
   - 可点击的下拉菜单触发器（展示用户 Email 作为触发文案）
   - 下拉菜单包含"Profile"（导航至 `/profile`）和"退出登录"两个选项
2. **Profile 页面（`/profile`）**：
   - 受保护路由，复用 `ProtectedLayout`（导航栏 + AuthButton + footer）
   - 展示用户 Email、角色（role）、用户 ID（sub）——数据来源为 Supabase `getClaims()` 的 JWT claims
3. **现有 LogoutButton 整合**：退出登录逻辑整合入 AuthButton 下拉菜单；`logout-button.tsx` 文件保留但不再被引用，后续清理时可删除

### 3.2 范围外 (Out-of-Scope)

- 用户资料编辑/修改功能（无后端 API，仅展示 JWT claims）
- 头像上传或自定义展示
- 额外的 Profile 字段（如昵称、手机号、部门等，不在 JWT claims 中）
- 用户设置页面或账号管理页面
- 角色/权限管理后台
- Profile 页面从后端 API 获取数据（当前仅从 JWT claims 读取）
- 独立的 `LogoutButton` 组件文件的删除（本 spec 阶段保留，改造后不再被引用，留待后续清理）

### 3.3 边界条件

- JWT claims 数据量极小（单次读取 < 1KB），无性能瓶颈
- 支持的浏览器：与现有项目一致（Chromium / Firefox / WebKit，由 Playwright E2E 覆盖）
- `getClaims()` 可能返回部分字段缺失的 claims 对象（如 role 字段可能在 JWT 中不存在）
- 并发用户：与当前用户量一致，Profile 页面为纯服务端渲染，无数据库查询
- AuthButton 组件当前位于 `ProtectedLayout` 和 `InstrumentsLayout` 两处，改造应保持两处布局均正常工作

### 3.4 依赖项

| 依赖 | 说明 | 状态 |
|------|------|------|
| `ProtectedLayout` | `/app/protected/layout.tsx`，提供导航栏与 AuthButton 容器 | 已有 |
| shadcn/ui `DropdownMenu` | `components/ui/dropdown-menu.tsx`，Radix UI 封装 | 已有 |
| Supabase `getClaims()` | `supabase.auth.getClaims()` 返回 `{ sub, role, email }` | 已有 |
| Supabase `signOut()` | `supabase.auth.signOut()` 退出登录 | 已有（LogoutButton 中） |
| Next.js App Router | 路由约定与 layout 嵌套 | 已有 |
| `proxy.ts` | 会话刷新中间件，通过公开路径白名单（`/`、`/auth`、`/api/*`）保护所有非公开路由 | 已有 |

## 4. 功能需求

### 4.1 核心功能

#### FEAT-1: AuthButton 下拉菜单（Must）

- **用户故事**: 作为已登录用户，我想要点击导航栏中的邮箱地址来展开一个下拉菜单，以便我能选择进入个人资料页或退出登录。
- **验收标准**:
  1. 已登录时，导航栏显示用户 Email 为可点击的触发器，不再显示纯文本"Hey, {email}!"和独立退出按钮
  2. 点击触发器展开下拉菜单，包含"Profile"和"退出登录"两个选项
  3. 点击"Profile"选项导航至 `/profile` 页面
  4. 点击"退出登录"选项调用 `supabase.auth.signOut()` 并重定向到 `/auth/login`
  5. 未登录时，导航栏仍显示"Sign in"和"Sign up"两个按钮（与现有行为一致）
  6. 下拉菜单支持键盘导航（符合 Radix UI dropdown menu 默认行为）
  7. 下拉菜单中"Profile"选项可点击，点击后通过 Next.js App Router 导航至 `/profile`（不触发整页刷新；此 AC 同时覆盖原 FEAT-3 Profile 导航入口关注点）
- **优先级**: Must
- **实现要点**:
  - AuthButton 拆分为 Server Component + Client Component 两层：
    - Server Component（`auth-button.tsx`）保持 `async`，调用 `getClaims()` 获取 claims，将 `claims.email` 作为 props 传递给 Client Component
    - Client Component（如 `auth-dropdown.tsx`，标记 `"use client"`）使用 shadcn/ui `DropdownMenu` 渲染下拉菜单
  - 退出登录逻辑沿用现有 `LogoutButton` 模式：浏览器端 `createClient()` + `signOut()` + `router.push("/auth/login")`
  - 从 `ProtectedLayout` 和 `InstrumentsLayout` 中移除对独立 `LogoutButton` 的引用

#### FEAT-2: Profile 页面（Must）

- **用户故事**: 作为已登录用户，我想要查看我的个人资料页，以便我能确认我的身份（Email）、角色（Role）和用户标识（User ID）。
- **验收标准**:
  1. 访问 `/profile` 时，渲染 `ProtectedLayout`（导航栏 + AuthButton + footer）
  2. 页面展示用户的 Email（来自 `claims.email`）
  3. 页面展示用户的角色（来自 `claims.role`）
  4. 页面展示用户的用户 ID（来自 `claims.sub`）
  5. 未登录用户访问 `/profile` 时，重定向到 `/auth/login`
  6. 当 `getClaims()` 返回的 claims 中缺少 `role` 字段时，角色显示为"未分配"或等效占位文案
  7. 页面有明确的标题（如"个人资料"或"Profile"）
- **优先级**: Must

### 4.2 边缘情况

| 边缘情况 | 预期处理 |
|----------|----------|
| 未登录用户直接访问 `/profile` | 重定向至 `/auth/login` |
| `getClaims()` 返回的 claims 对象中 `role` 字段缺失 | Profile 页面显示"未分配"或"---"占位文案，不报错 |
| `getClaims()` 调用失败（网络或服务端错误） | 重定向至 `/auth/login`（与受保护路由行为一致） |
| 用户快速连续点击下拉菜单触发器 | 菜单正常展开/收起，无异常状态（Radix UI 默认处理） |
| 用户在下拉菜单外点击 | 菜单关闭（Radix UI 默认行为） |
| 屏幕宽度较窄时下拉菜单位置 | 菜单自适应定位，不溢出视口（Radix UI 默认处理） |
| `InstrumentsLayout` 中也使用了 AuthButton | 下拉菜单在 /instruments 路由下同样正常工作 |
| Profile 页面在 SSR 渲染时 `getClaims()` 返回空 | 触发重定向，客户端不会看到空白页面 |
| 用户在退出过程中重复点击"退出登录" | `signOut()` 完成后即触发 `router.push`；Radix UI DropdownMenu 在选中后自动关闭，阻止二次触发 |

## 5. 非功能需求

- **性能**: Profile 页面为 SSR 页面，无额外 API 调用，渲染耗时与现有 `/protected` 页面持平（无退化）。
- **安全性**: 
  - `/profile` 路由必须受保护，未认证用户不可访问。
  - 不暴露敏感 JWT 字段（如 `aud`、`iss`、`exp` 等）在页面上，仅展示 `email`、`role`、`sub`。
  - 退出登录必须清除服务端会话 Cookie（现有 `signOut()` 已处理）。
- **可用性**: 
  - 下拉菜单交互符合 Web 标准（键盘可操作、点击外部关闭）。
  - Profile 页面信息层级清晰，Email / Role / User ID 分项展示。
- **可维护性**: 
  - AuthButton server/client 拆分遵循 Next.js 惯用模式，组件边界清晰。
  - Profile 页面为独立路由页面，不与其他页面耦合。
- **可扩展性**: 
  - 下拉菜单结构预留后续增加选项（如"Settings"）的能力。
  - Profile 页面布局预留后续增加更多字段的能力。

## 6. 验收标准 (Acceptance Criteria)

### AC-1: 已登录用户查看导航栏下拉菜单
- **Given** 用户已登录，Email 为 `test@example.com`
- **When** 用户访问任意受保护页面（`/protected`、`/instruments`）或首页
- **Then** 导航栏右侧显示用户 Email 为触发器文本，点击展开下拉菜单，包含"Profile"和"退出登录"两个选项

### AC-2: 下拉菜单"Profile"导航
- **Given** 用户已登录且下拉菜单已展开
- **When** 用户点击"Profile"选项
- **Then** 浏览器导航至 `/profile`，页面渲染 ProtectedLayout 并展示用户 Email、角色和 User ID

### AC-3: 下拉菜单"退出登录"
- **Given** 用户已登录且下拉菜单已展开
- **When** 用户点击"退出登录"选项
- **Then** 调用 signOut 清除会话，重定向至 `/auth/login`，导航栏恢复为"Sign in"+"Sign up"按钮

### AC-4: 未登录状态导航栏
- **Given** 用户未登录
- **When** 用户访问首页
- **Then** 导航栏显示"Sign in"和"Sign up"两个按钮，不显示下拉菜单

### AC-5: 未登录用户访问 /profile
- **Given** 用户未登录
- **When** 用户直接访问 `/profile`
- **Then** 浏览器重定向至 `/auth/login`

### AC-6: Profile 页面信息展示
- **Given** 用户已登录，JWT claims 包含 `email: "user@test.com"`, `role: "admin"`, `sub: "abc-123-def"`
- **When** 用户访问 `/profile`
- **Then** 页面展示 Email = "user@test.com"、Role = "admin"、User ID = "abc-123-def"

### AC-7: Role 字段缺失时的 Profile 页面
- **Given** 用户已登录，JWT claims 不包含 `role` 字段
- **When** 用户访问 `/profile`
- **Then** 角色区域显示"未分配"或等效占位文案，页面不报错、不崩溃

### AC-8: 下拉菜单在 Instruments 页面正常工作
- **Given** 用户已登录
- **When** 用户访问 `/instruments`
- **Then** 导航栏下拉菜单正常显示与交互（/instruments 使用 InstrumentsLayout，同样包含 AuthButton）

## 7. 依赖与假设

- **外部依赖**: 
  - Supabase Auth 服务正常运行（`getClaims()` 和 `signOut()` 可用）
  - Next.js proxy 中间件正常刷新会话
- **假设**: 
  - JWT claims 中至少包含 `email` 和 `sub` 字段（Supabase 默认提供）
  - `role` 字段存在但可选——已在 JWT 中配置自定义 claims
  - `ProtectedLayout` 和 `InstrumentsLayout` 均使用 `Suspense` 包裹 AuthButton（已验证，两者均使用）
  - 用户 Email 长度适中，适合作为下拉菜单触发器文案（不需要截断）

## 8. 风险与开放问题

- **已识别风险**:
  - **AuthButton 架构变更风险（低）**: 从纯 Server Component 变为 Server + Client Component 拆分模式，需确保数据流正确且不引入额外客户端 JavaScript 体积膨胀。
  - **布局兼容风险（低）**: AuthButton 同时被 `ProtectedLayout` 和 `InstrumentsLayout` 引用，改造需两处均验证。
  - **JWT claims 字段稳定性（低）**: Supabase `getClaims()` 返回的字段取决于 JWT 配置，若后续调整 claims 结构可能影响 Profile 页面展示。
  - **Email 显示溢出（极低）**: 极端长 email 地址可能导致 dropdown trigger 过宽。MVP 阶段不处理，后续可加 `truncate` + `max-w` 样式。
  - **`logout-button.tsx` 遗留**: 改造后该文件不再被任何组件引用，成为遗留代码。本 spec 阶段不删除，后续清理时可直接移除。
- **待回答问题**: 无——此阶段已足够明确。

## 9. 待澄清事项

无。需求已经过完整澄清与确认。

## 10. 修订记录

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| 0.1  | 2026-06-13 | 初稿——需求分析与合理性评估 | Amos Xia |
| 0.2  | 2026-06-13 | 合并 FEAT-3 入 FEAT-1；明确 Server→Client 数据流；修正 proxy.ts 描述；补充边缘情况与风险项；明确 LogoutButton 文件处置 | Amos Xia |