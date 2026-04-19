# 使用 GitHub CLI 创建 Issue

## 依赖

- **GitHub CLI（`gh`）**：用于创建与查看 Issue；须已安装并已登录（见下文「收集信息」「执行方式」）。
- **Superpowers 插件**：**需求澄清阶段必须可用**。与仓库根目录 [README.md](../../README.md)「外部依赖」一致，按团队方式安装并启用 Superpowers 技能包。在 **Claude Code** 中通过 **Skill 工具** 加载技能 **`brainstorming`**（Superpowers 自带）。执行时遵循该技能的核心纪律（结合项目上下文、**一次一个问题**、优先选择题、澄清目的/约束/成功标准、需求未确认前**不写实现代码**等）。与本仓库 Issue 规格流程的落盘与终态差异，见下文 **「与 Superpowers 默认 brainstorming 的偏差」**。

在仓库根目录用 **GitHub CLI**（`gh`）创建 Issue。先确认用户已安装并已登录：`gh auth status`；若未登录，提示用户执行 `gh auth login`。

## 收集信息

向用户确认或从当前对话提取（缺省时先问清楚，不要臆造）：

- **标题**（必填）
- **正文**（可选；可为空时用 `-` 或简短说明）
- **标签**（可选，多个用逗号分隔，对应 `gh` 的 `--label`，可多次传入）
- **负责人**（可选，`--assignee`，可用 `@me` 表示当前用户）
- **里程碑**（可选，`--milestone`）

## 执行方式

在**当前 Git 仓库根目录**执行（`gh` 按远程解析目标仓库）。标题与正文中的引号在 shell 中需正确转义；正文较长时优先用 **`--body-file`** 写入临时文件再创建。

**注意**：`gh issue create` **不支持** `--json`；成功时标准输出一般为新建 Issue 的 **URL**（通常一行）。**捕获该 URL** 后查询结构化字段：

```bash
ISSUE_URL=$(gh issue create --title "简明标题" --body "正文支持多行\n第二行")
# 或使用：gh issue create --title "..." --body-file path/to/file
gh issue view "$ISSUE_URL" --json number,title,url
```

第二行输出为一行 JSON，读取 `number`、`title`、`url`。（若无法执行 `gh issue view`，可从 URL 解析编号 `/issues/(\d+)\s*$/`；标题以创建时 `--title` 为准。）

**常用可选参数**（仍须在创建后执行上面的 `gh issue view ...`）：`--label`（可重复）、`--assignee @me`、`--milestone "v1.0"` 等。

## 创建 `specs` 与 `spec.md`（Issue 成功后）

在已知 **Issue 编号**与**标题**（优先用 `gh` 返回的 `title`）后，按下列阶段顺序执行。

### 与 Superpowers 默认 brainstorming 的偏差

执行 **阶段 2** 时遵循 `brainstorming` 技能的问诊与设计纪律，但**不要**机械套用该技能默认文档路径与终态：

- **权威真源**：本流程下需求与 AC 的权威落盘为 **`specs/.../spec.md`**。**不要求**写入 `docs/plans/...`。若团队希望保留设计侧稿，可**额外**写入 `docs/plans/YYYY-MM-DD-<topic>-design.md`（**可选**），不阻塞 Issue 规格流程。
- **下一步技能**：阶段 2 将需求写回 `spec.md`（阶段 2b）之后，**下一步是阶段 3 的 user-story-review**，而非 Superpowers 默认 brainstorming 末尾的 **writing-plans**。`plan.md` 与实现拆分按根 **AGENTS.md** 与后续工程习惯单独进行。
- **过程材料**：调研与长文可写入同目录下可选 **`research.md`** 等；**AC 以 `spec.md` 为准**。

### 阶段 1：骨架

1. **目录**：`specs/{编号}-{路径安全标题}/`。路径安全：去首尾空白；将 `\ / : * ? " < > |`、换行与控制字符替换为 `-`（连续 `-` 可合并）；保留中文等非 ASCII（除非路径不可用）。
2. **文件**：新建 **`spec.md`**。先写**骨架**（见下模板）：**一级标题**与 Issue 标题**完全一致**；**须含** Issue 链接（`url` 或 `https://github.com/<owner>/<repo>/issues/<编号>`），与根 **AGENTS.md** 一致。骨架阶段其余小节仅占位，**勿臆造**需求或 AC。

若 `specs/` 下已存在同名目录，先与用户确认复用或改名，避免静默覆盖。

### 阶段 2：需求澄清（Superpowers brainstorming）

骨架落盘后**必须**通过 **Skill 工具** 加载 **`brainstorming`**：结合仓库上下文；**一次一个问题**（优先选择题）；明确目的、约束、成功标准；必要时提出 **2～3 种方案**与取舍并取得用户确认。需求未确认前**不写实现代码**。

### 阶段 2b：写回 `spec.md`

将阶段 2 中已确认的结论**合并/覆盖**写入同一 **`spec.md`**（补全各小节，取代骨架占位）。**须覆盖**：背景与目标；范围与非目标；可选假设与风险；可选技术选型（未决可写「待 plan.md」并列候选）；**可验证的 AC**（编号或 Given/When/Then）。未决项须**显式列出**，禁止模糊 AC。

### 阶段 3：规格审查（user-story-review）

读取并遵循仓库技能 **`.claude/skills/user-story-review/SKILL.md`**。对当前 **`spec.md`** 以 **Review 模式**为主（完整性清单、清晰度、可行性）；必要时辅以简短澄清问题。在回复中按该技能 **「PRD Review Summary」** 结构呈现审查摘要（含 Critical / Important / Nice-to-fix 等优先级）。

### 阶段 4：定稿

用户就审查中的 **Critical**、**Important** 项确认或给出修改意见后，将全部修订**写入最终 `spec.md`**。若仍有未决项，须在文档中显式标注（如「待决」），不得用模糊表述代替明确 AC。

**`spec.md` 模板**（骨架阶段：`## 技术选型` 至 `## 假设与风险` 可暂略或一句「待补全」；`## 验收标准` 下写待补全；阶段 2b 后补全所有小节）：

```markdown
# <与 Issue 标题一致>

- Issue: <url>

## 背景与目标

## 技术选型（可选）

## 范围

## 非目标

## 验收标准（AC）

<!-- 编号列表，或 #### AC1 + Given/When/Then -->

## 假设与风险（可选）

```

## 完成后

回复 **Issue URL/编号**、`specs/.../spec.md` 路径，并**明确各阶段状态**：

- 是否已完成 **阶段 2（brainstorming）** 与 **阶段 2b（写回 `spec.md`）**
- 是否已完成 **阶段 3（user-story-review）** 并已输出审查摘要
- 是否已完成 **阶段 4（用户确认后的最终 `spec.md`）**

若已定稿（阶段 4 完成），附**需求一句摘要与 AC 条数**。若流程未跑完，说明当前停在哪一阶段（例如仍为骨架、待审查、待用户确认定稿）。`gh` 失败时贴错误信息（未登录、无权限、标签不存在等）。
