#!/usr/bin/env python3
"""
PostToolUse Hook: 子项目上下文注入

当 Edit/Write 操作触及子项目文件时，注入该子项目的关键约定摘要。
同一子项目在同一会话中只注入一次，避免重复。
"""

import json
import sys
import os

# Add parent dir to path so we can import session_tracker
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from session_tracker import (
    load_state,
    save_state,
    detect_subproject,
    is_source_file,
    build_context_card,
)


def main():
    try:
        event = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, OSError) as e:
        print(json.dumps({"systemMessage": ""}))
        return

    tool_input = event.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    if not file_path or not is_source_file(file_path):
        print(json.dumps({}))
        return

    subproject = detect_subproject(file_path)
    if not subproject:
        print(json.dumps({}))
        return

    state = load_state()

    # Track modifications
    if subproject not in state["modified_subprojects"]:
        state["modified_subprojects"].append(subproject)
    state["source_files_modified"] = True

    # Only inject context if this subproject hasn't been injected yet this session
    if subproject == state.get("last_injected_subproject"):
        save_state(state)
        print(json.dumps({}))
        return

    state["last_injected_subproject"] = subproject
    save_state(state)

    context_card = build_context_card(subproject)
    print(json.dumps({"systemMessage": context_card}))


if __name__ == "__main__":
    main()