#!/usr/bin/env bash

set -euo pipefail
umask 077

if [[ $# -ne 2 ]]; then
  echo "Usage: verify-backup.sh <encrypted-backup> <checksum-file>" >&2
  exit 1
fi

encrypted_path=$1
checksum_path=$2

encryption_key=${BACKUP_ENCRYPTION_KEY:-}
if [[ ${#encryption_key} -lt 32 ]]; then
  echo "BACKUP_ENCRYPTION_KEY must contain at least 32 characters." >&2
  exit 1
fi

if [[ ! -f $encrypted_path || ! -f $checksum_path ]]; then
  echo "Backup artifact and checksum file are required." >&2
  exit 1
fi

read -r expected_hash expected_name <"$checksum_path"
expected_name=${expected_name#\*}
if [[ ! $expected_hash =~ ^[0-9a-f]{64}$ || $expected_name != "$(basename "$encrypted_path")" ]]; then
  echo "Checksum file does not target the requested encrypted backup." >&2
  exit 1
fi

actual_hash=$(shasum -a 256 "$encrypted_path" | cut -d ' ' -f 1)
if [[ $actual_hash != "$expected_hash" ]]; then
  echo "Encrypted backup checksum verification failed." >&2
  exit 1
fi

echo "$(basename "$encrypted_path"): OK"

plain_path=$(mktemp "${TMPDIR:-/tmp}/design-flow-backup-verify.XXXXXX.dump")
cleanup() {
  rm -f -- "$plain_path"
}
trap cleanup EXIT

openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 -md sha256 \
  -pass env:BACKUP_ENCRYPTION_KEY \
  -in "$encrypted_path" \
  -out "$plain_path"

if [[ -n ${BACKUP_DOCKER_CONTAINER:-} ]]; then
  docker exec -i "$BACKUP_DOCKER_CONTAINER" pg_restore --list <"$plain_path" >/dev/null
else
  command -v pg_restore >/dev/null || {
    echo "pg_restore is required to verify the decrypted archive." >&2
    exit 1
  }
  pg_restore --list "$plain_path" >/dev/null
fi

echo "Backup checksum, decryption, and archive structure verified."
