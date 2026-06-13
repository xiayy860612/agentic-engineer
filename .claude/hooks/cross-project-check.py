#!/usr/bin/env python3
"""
PreToolUse Hook: 跨子项目变更检测

当编辑操作跨越多个子项目时，提醒注意契约一致性和跨端协调。
"""

import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from session_tracker import (
    load_state,
    save_state,
    detect_subproject,
    is_source_file,
    build_cross_project_warning,
)


def main():
    try:
        event = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, OSError) as e:
        print(json.dumps({"decision": "allow"}))
        return

    tool_input = event.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    if not file_path or not is_source_file(file_path):
        print(json.dumps({"decision": "allow"}))
        return

    subproject = detect_subproject(file_path)
    if not subproject:
        print(json.dumps({"decision": "allow"}))
        return

    state = load_state()
    existing = state.get("modified_subprojects", [])

    # Check if this is a NEW subproject (not yet modified in this session)
    if subproject in existing:
        print(json.dumps({"decision": "allow"}))
        return

    warning = build_cross_project_warning(existing, subproject)
    if warning:
        print(json.dumps({"decision": "allow", "systemMessage": warning}))
    else:
        print(json.dumps({"decision": "allow"}))


if __name__ == "__main__":
    main()