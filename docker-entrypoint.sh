#!/bin/sh
# Applies pending database migrations, then starts the API. A failed migration stops the container
# (it does not start), so the new version never runs against a half-migrated schema.
set -e
node scripts/migrate.js
exec "$@"
