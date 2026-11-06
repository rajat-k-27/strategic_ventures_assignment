#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================================="
echo " Starting Rehabilitation Action Plan Management System"
echo "=========================================================="

# 1. Start PostgreSQL if available
if [ -f "${PROJECT_ROOT}/scripts/start_postgres.sh" ]; then
    bash "${PROJECT_ROOT}/scripts/start_postgres.sh"
fi

# 2. Setup backend virtual environment if not present
if [ ! -d "${PROJECT_ROOT}/backend/venv" ]; then
    echo "==> Setting up backend virtual environment..."
    virtualenv "${PROJECT_ROOT}/backend/venv"
    "${PROJECT_ROOT}/backend/venv/bin/pip" install -r "${PROJECT_ROOT}/backend/requirements.txt"
fi

# 3. Apply migrations and seed data
echo "==> Running migrations..."
"${PROJECT_ROOT}/backend/venv/bin/python" "${PROJECT_ROOT}/backend/manage.py" migrate

echo "==> Populating synthetic patient clinical data..."
"${PROJECT_ROOT}/backend/venv/bin/python" "${PROJECT_ROOT}/backend/manage.py" seed_data

# 4. Start backend
echo "==> Launching Django Backend at http://127.0.0.1:8000..."
"${PROJECT_ROOT}/backend/venv/bin/python" "${PROJECT_ROOT}/backend/manage.py" runserver 127.0.0.1:8000 &
BACKEND_PID=$!

# 5. Start frontend
echo "==> Launching Vite React Frontend at http://127.0.0.1:5173..."
cd "${PROJECT_ROOT}/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit" SIGINT SIGTERM

echo "==> Application active! Access via http://127.0.0.1:5173"
wait

