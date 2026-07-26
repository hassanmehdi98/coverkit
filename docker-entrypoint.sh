#!/bin/sh
set -e

echo "Running prisma migrate deploy..."
# Use the isolated CLI install — standalone node_modules is incomplete for Prisma.
node ./prisma-cli/node_modules/prisma/build/index.js migrate deploy

echo "Starting CoverKit on port ${PORT:-3000}..."
exec node server.js
