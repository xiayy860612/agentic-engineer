"""
Session state tracker — shared by all hook scripts.

Tracks subproject modifications and context injection state
to avoid redundant context injection.
"""

import json
import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List, Dict

STATE_FILE = Path(__file__).parent / ".state.json"

# Subproject root markers — ordered by specificity (longer paths first)
SUBPROJECTS = {
    "biz-service": {
        "name": "biz-service/ (Python 业务 API)",
        "emoji": "🐍",
        "context": [
            "技术栈：Python 3.11, FastAPI, SQLAlchemy 2.x async, asyncpg",
            "认证：Supabase JWKS 非对称验签",
            "测试：uv run pytest --cov=app | Lint：uv run ruff check app tests",
            "端口：8001",
        ],
    },
    "web": {
        "name": "web/ (Next.js 前端)",
        "emoji": "⚛️",
        "context": [
            "技术栈：Next.js App Router, React 19, TypeScript strict, Tailwind CSS, shadcn/ui",
            "认证：Supabase (@supabase/ssr), Cookie 会话",
            '联调：/api/biz/* → http://127.0.0.1:8001 (dev rewrite)',
            "测试：pnpm test | Lint：pnpm lint",
        ],
    },
    "e2e": {
        "name": "e2e/ (Playwright E2E)",
        "emoji": "🎭",
        "context": [
            "技术栈：Playwright 1.59.x, Node.js ≥20",
            "测试：pnpm test | UI 模式：pnpm test:ui",
            "自动启动 web dev server",
        ],
    },
}


def load_state() -> Dict:
    """Load session state from file, or return defaults."""
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return {
        "last_injected_subproject": None,
        "modified_subprojects": [],
        "source_files_modified": False,
        "session_start": datetime.now(timezone.utc).isoformat(),
    }


def save_state(state: Dict) -> None:
    """Persist session state to file."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


def detect_subproject(file_path: str) -> Optional[str]:
    """Determine which subproject a file belongs to.

    Returns the subproject key (e.g., 'web', 'biz-service', 'e2e') or None.
    """
    # Normalize path
    p = str(file_path)

    # Check each subproject — order matters for nested paths
    for key in SUBPROJECTS:
        if p.startswith(key + "/") or key in p.split(os.sep):
            # More precise: file is directly under the subproject dir
            parts = Path(p).parts
            if key in parts:
                return key

    return None


def is_source_file(file_path: str) -> bool:
    """Check if a file is a source file (not config, not docs, not test artifacts)."""
    p = Path(file_path)
    # Skip non-code directories
    skip_dirs = {"node_modules", ".git", ".next", "__pycache__", ".venv",
                 "test-results", "playwright-report", "tmp", ".claude"}
    if any(skip in p.parts for skip in skip_dirs):
        return False

    # Code file extensions
    code_extensions = {".py", ".ts", ".tsx", ".js", ".jsx", ".sql", ".css"}
    return p.suffix in code_extensions


def build_context_card(subproject_key: str) -> str:
    """Build a concise context card for the subproject."""
    info = SUBPROJECTS.get(subproject_key)
    if not info:
        return ""

    lines = [f"{info['emoji']} 当前子项目：{info['name']}"]
    for ctx in info["context"]:
        lines.append(f"  • {ctx}")

    return "\n".join(lines)


def build_cross_project_warning(existing: List[str], new_key: str) -> Optional[str]:
    """Build a cross-project change warning if needed."""
    if not existing:
        return None

    existing_names = []
    for key in existing:
        info = SUBPROJECTS.get(key, {})
        existing_names.append(info.get("name", key))

    new_info = SUBPROJECTS.get(new_key, {})
    new_name = new_info.get("name", new_key)

    return (
        f"⚠️ 跨子项目修改检测：你已修改过 {', '.join(existing_names)}，"
        f"现在编辑 {new_name}。\n"
        f"  • 如涉及 API 或共享类型变更，请同步更新契约与消费者\n"
        f"  • 确保两端测试均通过后再提交"
    )