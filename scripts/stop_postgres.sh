#!/usr/bin/env bash
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGDATA_DIR="${PROJECT_ROOT}/.pgdata"
export PATH="/usr/lib/postgresql/16/bin:/usr/lib/postgresql/14/bin:$PATH"

if [ -d "$PGDATA_DIR" ]; then
    pg_ctl -D "$PGDATA_DIR" stop -m fast || true
    echo "==> PostgreSQL stopped."
fi

