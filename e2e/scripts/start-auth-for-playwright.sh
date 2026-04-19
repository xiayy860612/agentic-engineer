#!/usr/bin/env bash
set -euo pipefail

# Dedicated SQLite DB + seeded user for Playwright (Issue #3 / admin-web login).
# Credentials must match e2e/admin-login.spec.ts constants.

AUTH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../auth-service" && pwd)"
cd "$AUTH_DIR"

# Must match Playwright baseURL + Next dev host (127.0.0.1) so Session Cookie is same-site with the API origin.
export ADMIN_WEB_ORIGIN="${ADMIN_WEB_ORIGIN:-http://127.0.0.1:3000}"
DB_PATH="${AUTH_DIR}/data/e2e-playwright.db"
export AUTH_DATABASE_URL="sqlite:////${DB_PATH}"

mkdir -p "${AUTH_DIR}/data"
rm -f "${DB_PATH}"

if ! command -v uv >/dev/null 2>&1; then
  echo "e2e: uv is required to start the Auth service (see auth-service/README.md)." >&2
  exit 1
fi

uv sync --extra dev
uv run auth-create-user --username e2e_admin --password 'E2E_Pass_123'
exec uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
