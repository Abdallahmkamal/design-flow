#!/usr/bin/env bash

set -euo pipefail
umask 077

required_commands=(openssl shasum)
for command_name in "${required_commands[@]}"; do
  command -v "$command_name" >/dev/null || {
    echo "Required command is unavailable: $command_name" >&2
    exit 1
  }
done

encryption_key=${BACKUP_ENCRYPTION_KEY:-}
if [[ ${#encryption_key} -lt 32 ]]; then
  echo "BACKUP_ENCRYPTION_KEY must contain at least 32 characters." >&2
  exit 1
fi

backup_label=${BACKUP_LABEL:-scheduled}
if [[ ! $backup_label =~ ^[a-z0-9][a-z0-9_-]{0,31}$ ]]; then
  echo "BACKUP_LABEL must be a lowercase safe identifier." >&2
  exit 1
fi

backup_timestamp=${BACKUP_TIMESTAMP:-$(date -u +%Y%m%dT%H%M%SZ)}
if [[ ! $backup_timestamp =~ ^[0-9]{8}T[0-9]{6}Z$ ]]; then
  echo "BACKUP_TIMESTAMP must use YYYYMMDDTHHMMSSZ." >&2
  exit 1
fi

backup_output_dir=${BACKUP_OUTPUT_DIR:-backup-output}
mkdir -p "$backup_output_dir"

backup_basename="design-flow_${backup_label}_${backup_timestamp}.dump"
plain_path="$backup_output_dir/$backup_basename"
encrypted_path="$plain_path.enc"
checksum_path="$encrypted_path.sha256"

cleanup() {
  rm -f -- "$plain_path"
}
trap cleanup EXIT

if [[ -n ${BACKUP_DOCKER_CONTAINER:-} ]]; then
  if [[ ! $BACKUP_DOCKER_CONTAINER =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]+$ ]]; then
    echo "BACKUP_DOCKER_CONTAINER contains unsafe characters." >&2
    exit 1
  fi
  command -v docker >/dev/null || {
    echo "Docker is required for a container backup." >&2
    exit 1
  }
  docker exec "$BACKUP_DOCKER_CONTAINER" pg_dump \
    --username=postgres \
    --dbname=postgres \
    --format=custom \
    --compress=9 \
    --no-owner \
    --no-privileges \
    --schema=public \
    --schema=auth \
    --schema=private \
    --schema=supabase_migrations >"$plain_path"
else
  command -v pg_dump >/dev/null || {
    echo "pg_dump is required for a direct database backup." >&2
    exit 1
  }
  if [[ -z ${BACKUP_DATABASE_URL:-} ]]; then
    echo "BACKUP_DATABASE_URL is required for a direct backup." >&2
    exit 1
  fi
  pg_dump \
    --dbname="$BACKUP_DATABASE_URL" \
    --format=custom \
    --compress=9 \
    --no-owner \
    --no-privileges \
    --schema=public \
    --schema=auth \
    --schema=private \
    --schema=supabase_migrations \
    --file="$plain_path"
fi

if [[ ! -s $plain_path ]]; then
  echo "Database dump is empty." >&2
  exit 1
fi

openssl enc -aes-256-cbc -salt -pbkdf2 -iter 250000 -md sha256 \
  -pass env:BACKUP_ENCRYPTION_KEY \
  -in "$plain_path" \
  -out "$encrypted_path"

(
  cd "$backup_output_dir"
  shasum -a 256 "$(basename "$encrypted_path")" >"$(basename "$checksum_path")"
)

if [[ -n ${GITHUB_OUTPUT:-} ]]; then
  {
    echo "artifact=$encrypted_path"
    echo "checksum=$checksum_path"
    echo "basename=$(basename "$encrypted_path")"
  } >>"$GITHUB_OUTPUT"
fi

echo "Created encrypted backup: $(basename "$encrypted_path")"
echo "Checksum: $(cut -d ' ' -f 1 "$checksum_path")"
