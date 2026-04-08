#!/bin/sh
echo "[OdontoTask] Running Prisma migrations..."
npx prisma migrate deploy 2>&1 || echo "[OdontoTask] Migration warning (may be first deploy or no pending migrations)"
echo "[OdontoTask] Starting server..."
node server.js
