"""CLI: create users out-of-band (AC4)."""

from __future__ import annotations

import argparse
import sys

from sqlalchemy import select

from app.database import get_session_local, init_db
from app.models import User
from app.security import hash_password


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Create an Auth user (password stored as Argon2id hash).",
    )
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args(argv)

    init_db()
    db = get_session_local()()
    try:
        existing = db.scalars(select(User).where(User.username == args.username)).first()
        if existing is not None:
            print(f"User already exists: {args.username}", file=sys.stderr)
            return 1
        db.add(User(username=args.username, password_hash=hash_password(args.password)))
        db.commit()
    finally:
        db.close()
    print(f"Created user: {args.username}")
    return 0


def console_main() -> None:
    raise SystemExit(main())


if __name__ == "__main__":
    console_main()
