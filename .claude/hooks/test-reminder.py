#!/usr/bin/env python3
"""
Stop Hook: 测试提醒

会话结束时，如果修改过源码文件，提醒运行测试。
"""

import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from session_tracker import load_state


def main():
    state = load_state()

    if not state.get("source_files_modified"):
        print(json.dumps({}))
        return

    modified = state.get("modified_subprojects", [])
    if not modified:
        print(json.dumps({}))
        return

    # Build test commands for each modified subproject
    test_commands = {
        "web": "cd web && pnpm test",
        "biz-service": "cd biz-service && uv run pytest --cov=app",
        "e2e": "cd e2e && pnpm test",
    }

    cmds = []
    for sp in modified:
        cmd = test_commands.get(sp)
        if cmd:
            cmds.append(f"  • {cmd}")

    if not cmds:
        print(json.dumps({}))
        return

    reminder = (
        "🧪 本次会话修改了源码文件，建议运行测试：\n"
        + "\n".join(cmds)
    )

    print(json.dumps({"systemMessage": reminder}))


if __name__ == "__main__":
    main()