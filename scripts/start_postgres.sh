#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGDATA_DIR="${PROJECT_ROOT}/.pgdata"
PGPORT=5435
PGLOG="${PROJECT_ROOT}/.pgdata/postgres.log"

export PATH="/usr/lib/postgresql/16/bin:/usr/lib/postgresql/14/bin:$PATH"

if [ ! -d "$PGDATA_DIR" ]; then
    echo "==> Initializing PostgreSQL data directory at $PGDATA_DIR..."
    initdb -D "$PGDATA_DIR" --auth=trust --username=postgres >/dev/null
    echo "port = $PGPORT" >> "$PGDATA_DIR/postgresql.conf"
    echo "unix_socket_directories = '/tmp'" >> "$PGDATA_DIR/postgresql.conf"
fi

if pg_ctl -D "$PGDATA_DIR" status >/dev/null 2>&1; then
    echo "==> PostgreSQL is already running on port $PGPORT."
else
    echo "==> Starting PostgreSQL on port $PGPORT..."
    pg_ctl -D "$PGDATA_DIR" -l "$PGLOG" start
    sleep 2
fi

# Ensure database exists
if ! psql -h localhost -p "$PGPORT" -U postgres -lqt | cut -d \| -f 1 | grep -qw rehab_db; then
    echo "==> Creating database 'rehab_db'..."
    createdb -h localhost -p "$PGPORT" -U postgres rehab_db
    echo "==> Database 'rehab_db' created successfully."
else
    echo "==> Database 'rehab_db' exists."
fi

echo "==> PostgreSQL ready at postgresql://postgres@localhost:5435/rehab_db"

