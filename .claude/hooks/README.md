"""
Hooks — 动态上下文注入

三个 hook 脚本：
1. subproject-context.py  — PostToolUse: 编辑文件时注入子项目上下文
2. cross-project-check.py — PreToolUse: 跨子项目修改时提醒契约一致性
3. test-reminder.py       — Stop: 会话结束时提醒运行测试

共享工具：session_tracker.py
"""

# 这个文件是 hooks 目录的说明文档，不是可执行脚本