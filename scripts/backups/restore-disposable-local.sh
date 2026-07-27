#!/usr/bin/env bash

set -euo pipefail
umask 077

if [[ $# -ne 2 ]]; then
  echo "Usage: restore-disposable-local.sh <encrypted-backup> <checksum-file>" >&2
  exit 1
fi

encrypted_path=$1
checksum_path=$2
container=${RESTORE_DOCKER_CONTAINER:-}
database_name=${RESTORE_DATABASE_NAME:-}

if [[ ${RESTORE_CONFIRM_DISPOSABLE:-} != "recreate-$database_name" ]]; then
  echo "RESTORE_CONFIRM_DISPOSABLE must exactly equal recreate-<database-name>." >&2
  exit 1
fi

if [[ ! $database_name =~ ^design_flow_restore_[a-z0-9_]{1,40}$ ]]; then
  echo "Disposable restore database must start with design_flow_restore_." >&2
  exit 1
fi

if [[ ! $container =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]+$ ]]; then
  echo "RESTORE_DOCKER_CONTAINER is required and contains unsafe characters." >&2
  exit 1
fi

BACKUP_DOCKER_CONTAINER=$container \
  "$(dirname "$0")/verify-backup.sh" "$encrypted_path" "$checksum_path"

plain_path=$(mktemp "${TMPDIR:-/tmp}/design-flow-restore.XXXXXX.dump")
cleanup() {
  rm -f -- "$plain_path"
}
trap cleanup EXIT

openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 -md sha256 \
  -pass env:BACKUP_ENCRYPTION_KEY \
  -in "$encrypted_path" \
  -out "$plain_path"

docker exec "$container" dropdb --username=postgres --if-exists "$database_name"
docker exec "$container" createdb --username=postgres "$database_name"
docker exec "$container" psql --username=postgres --dbname="$database_name" --set=ON_ERROR_STOP=1 --command="drop schema public;" >/dev/null
docker exec "$container" psql --username=postgres --dbname="$database_name" --set=ON_ERROR_STOP=1 --command="create schema if not exists extensions; create extension if not exists pgcrypto with schema extensions; create extension if not exists citext with schema extensions; create extension if not exists btree_gist with schema extensions; create extension if not exists pg_trgm with schema extensions; create extension if not exists \"uuid-ossp\" with schema extensions;" >/dev/null
docker exec -i "$container" pg_restore \
  --username=postgres \
  --dbname="$database_name" \
  --no-owner \
  --no-privileges \
  --exit-on-error <"$plain_path"

migration_count=$(docker exec "$container" psql --username=postgres --dbname="$database_name" --tuples-only --no-align --command="select count(*) from supabase_migrations.schema_migrations")
profile_count=$(docker exec "$container" psql --username=postgres --dbname="$database_name" --tuples-only --no-align --command="select count(*) from public.profiles")
auth_user_count=$(docker exec "$container" psql --username=postgres --dbname="$database_name" --tuples-only --no-align --command="select count(*) from auth.users")
area_count=$(docker exec "$container" psql --username=postgres --dbname="$database_name" --tuples-only --no-align --command="select count(*) from public.work_areas")
ticket_count=$(docker exec "$container" psql --username=postgres --dbname="$database_name" --tuples-only --no-align --command="select count(*) from public.work_items")
batch_count=$(docker exec "$container" psql --username=postgres --dbname="$database_name" --tuples-only --no-align --command="select count(*) from public.work_log_batches")
entry_count=$(docker exec "$container" psql --username=postgres --dbname="$database_name" --tuples-only --no-align --command="select count(*) from public.work_log_entries")
first_admin_preserved=$(docker exec "$container" psql --username=postgres --dbname="$database_name" --tuples-only --no-align --command="select count(*) = 1 from public.bootstrap_state state join public.profiles profile on profile.id = state.first_admin_profile_id where state.consumed_at is not null and profile.position_code = 'manager' and profile.is_admin")
viewer_admin_count=$(docker exec "$container" psql --username=postgres --dbname="$database_name" --tuples-only --no-align --command="select count(*) from public.profiles where position_code = 'viewer' and is_admin")

echo "Disposable restore verified."
echo "Database: $database_name"
echo "Migrations: $migration_count"
echo "Profiles: $profile_count"
echo "Auth rows: $auth_user_count"
echo "Areas: $area_count"
echo "Tickets: $ticket_count"
echo "Work-log batches: $batch_count"
echo "Work-log entries: $entry_count"
echo "First Admin Manager + Admin preserved: $first_admin_preserved"
echo "Viewer + Admin rows: $viewer_admin_count"
echo "Auth credentials remain unverified and must use Admin-led reset/recreation after a real recovery."
