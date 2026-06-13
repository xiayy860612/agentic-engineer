---
name: "Business Analyst"
description: "全生命周期需求分析——从模糊想法到正式需求文档"
category: Analysis
tags: [requirements, analysis, spec, planning]
---

# 需求分析

使用 **business-analyst agent** 执行全生命周期需求分析任务。

## 执行方式

将用户的输入作为需求分析任务，启动 business-analyst agent 进行处理。Agent 将按以下工作流执行：

1. **理解（探索）**：从业务目标与用户诉求出发，挖掘真实需求
2. **合理性评估**：逐条审视需求的可行性、一致性、完整性与价值对齐
3. **范围界定**：明确范围内/外、边界条件与依赖项
4. **需求分解**：将大型需求拆分为史诗 → 功能 → 用户故事 → 验收标准
5. **文档化**：调用 write-spec skill 输出 `spec.md`
6. **验证**：对照原始请求审查，确保一致性、可测试性与边界覆盖

## 使用方式

```
/business-analyst <你的需求描述>
```

例如：
- `/business-analyst 我想做一个用户积分系统`
- `/business-analyst 需要实现用户登录功能：支持手机号+验证码、邮箱+密码两种方式`

Agent 会通过结构化提问逐步澄清需求，最终输出正式的 `spec.md` 文档。