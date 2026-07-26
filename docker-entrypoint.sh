#!/bin/sh
set -e

echo "Running prisma migrate deploy..."
./node_modules/.bin/prisma migrate deploy

echo "Starting CoverKit on port ${PORT:-3000}..."
exec node server.js
