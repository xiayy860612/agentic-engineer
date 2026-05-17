# agentic-engineer

## 外部依赖

- openspec
  - explore
  - propose
  - verify，需要通过 `openspec update config` 配置后才会开启
  - achieve
- superpowers
  - writing-plan
  - subagent-driven-development



### 工具依赖

使用 `.claude/commands/` 中的指令前，须在本机安装并配置以下工具：

| 工具 | 用途 | 涉及指令 | 安装与验证 |
|------|------|----------|------------|
| **`git`** | 分支管理、提交、推送 | `spec-apply` | 通常随系统或 Xcode CLT 附带；`git --version` 验证 |
| **`gh`（GitHub CLI）** | 创建/查看 Issue、创建/更新 PR | `create-spec`、`spec-apply` | [cli.github.com](https://cli.github.com)；安装后执行 `gh auth login` 完成授权，`gh auth status` 验证 |
| **`pnpm`** | admin-web 依赖管理 | - | Node.js 自带或 `npm install -g pnpm` |
| **`uv`** | auth-service 依赖管理 | - | `curl -LsSf https://astral.sh/uv/install.sh | sh` |

## Git Hooks

团队统一使用 pre-commit hook（commit 前自动运行所有单元测试）：

```bash
git config core.hooksPath hooks
```

> 本仓库已配置 `hooks/` 为默认 hooks 路径。新成员 clone 后只需执行一次上述命令即可。
