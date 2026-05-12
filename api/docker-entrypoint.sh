#!/bin/sh
set -e
cd /app

npx prisma migrate deploy

if [ "${AUTO_SEED_CATALOG:-1}" = "1" ]; then
  echo "[entrypoint] AUTO_SEED_CATALOG=1 — при пустой БД заливаю JSON из /app/catalog (сниффер)"
  node dist/src/main &
  srv=$!
  n=0
  while [ "$n" -lt 120 ]; do
    if node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||'4000')+'/store',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" 2>/dev/null; then
      break
    fi
    n=$((n + 1))
    sleep 1
  done
  export API_URL="${API_URL:-http://127.0.0.1:4000/api}"
  export CATALOG_ROOT="${CATALOG_ROOT:-/app/catalog}"
  node scripts/seed-if-empty.js || true
  kill "$srv" 2>/dev/null || true
  wait "$srv" 2>/dev/null || true
fi

exec node dist/src/main
