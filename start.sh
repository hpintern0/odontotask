#!/bin/sh
echo "Running Prisma migrations..."
node ./node_modules/prisma/build/index.js migrate deploy 2>&1 || echo "Migration warning (may be first deploy or no pending migrations)"
echo "Starting server..."
node server.js
