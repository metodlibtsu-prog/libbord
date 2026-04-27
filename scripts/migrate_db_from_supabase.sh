#!/bin/bash
# Migrate data from Supabase PostgreSQL to local VPS PostgreSQL
# Run this ONCE after first deploy, BEFORE traffic switches
#
# Usage:
#   SUPABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres" bash scripts/migrate_db_from_supabase.sh

set -e

if [ -z "$SUPABASE_URL" ]; then
  echo "ERROR: Set SUPABASE_URL env var first."
  echo "Example:"
  echo '  SUPABASE_URL="postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres" bash scripts/migrate_db_from_supabase.sh'
  exit 1
fi

DUMP_FILE="/tmp/libbord_supabase_dump.sql"
CONTAINER="libbord-postgres"
LOCAL_DB="postgresql://libbord:${POSTGRES_PASSWORD}@localhost:5432/libbord"

echo "=== Step 1: Dump from Supabase (public schema only) ==="
pg_dump "$SUPABASE_URL" \
  --schema=public \
  --no-owner \
  --no-acl \
  --data-only \
  -f "$DUMP_FILE"

echo "Dump saved to $DUMP_FILE"

echo "=== Step 2: Restore into local PostgreSQL ==="
# Tables are already created by FastAPI on startup (create_all)
docker exec -i "$CONTAINER" psql -U libbord -d libbord < "$DUMP_FILE"

echo "=== Done! Data migrated successfully. ==="
rm -f "$DUMP_FILE"
