#!/bin/sh
# Applies pending database migrations, then starts the API. A failed migration stops the container
# (the old version keeps running behind the proxy until the new one is healthy).
set -e
node scripts/migrate.js
exec "$@"
