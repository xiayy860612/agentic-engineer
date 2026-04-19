# agentic-engineer

## 外部依赖

- superpowers

### 工具依赖

使用 `.claude/commands/` 中的指令前，须在本机安装并配置以下工具：

| 工具 | 用途 | 涉及指令 | 安装与验证 |
|------|------|----------|------------|
| **`git`** | 分支管理、提交、推送 | `spec-apply` | 通常随系统或 Xcode CLT 附带；`git --version` 验证 |
| **`gh`（GitHub CLI）** | 创建/查看 Issue、创建/更新 PR | `create-spec`、`spec-apply` | [cli.github.com](https://cli.github.com)；安装后执行 `gh auth login` 完成授权，`gh auth status` 验证 |

> `.claude/skills/` 下的编码规范技能（composition-patterns、react-best-practices、web-design-guidelines）不依赖额外外部工具。