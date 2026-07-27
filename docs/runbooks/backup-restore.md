# Backup and restore runbook

**Owner:** Admin/technical maintainer

**Status:** Local encrypted restore rehearsal passed; R2 configuration/upload
and hosted restore remain unauthorized

## Backup contract

The daily and pre-migration backup is a PostgreSQL custom-format logical dump
of `public`, `private`, `auth`, and `supabase_migrations`. It deliberately
excludes Vault, Storage, extension-owned schemas, provider secrets, and user
files. The MVP has no uploads. Application code, migrations, Functions, and
configuration contracts remain versioned in Git.

`scripts/backups/create-backup.sh` compresses through `pg_dump`, encrypts with
AES-256-CBC plus PBKDF2-SHA256 at 250,000 iterations, removes the plaintext
dump on every exit, and writes a SHA-256 checksum for the encrypted artifact.
`verify-backup.sh` verifies the checksum, decrypts into a permission-restricted
temporary file, and requires `pg_restore --list` to accept the archive.

The encryption key must be at least 32 characters and lives only in the
protected GitHub environment plus a separate approved Admin-controlled
recovery location. The database URL, R2 access key/secret, encryption key, and
any Supabase secret must never be printed, committed, placed in a browser
variable, uploaded as a GitHub artifact, or copied into evidence.

## R2 automation

`.github/workflows/backup.yml` is scheduled daily and can be manually targeted
at a protected staging or production environment. It refuses to run until
`BACKUP_AUTOMATION_ENABLED=true` and every protected value exists. Configure:

- secrets: `SUPABASE_DATABASE_URL`, `BACKUP_ENCRYPTION_KEY`,
  `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`;
- variables: `R2_ACCOUNT_ID`, `R2_BACKUP_BUCKET`, and
  `BACKUP_AUTOMATION_ENABLED`; and
- a private, non-public R2 bucket with the access pair limited to object
  list/read/write/delete in that bucket only.

The workflow uploads encrypted artifact/checksum pairs under `backups/daily/`,
adds `weekly/` on Sunday UTC and `monthly/` on the first UTC day, then retains
the newest 7 daily, 4 weekly, and 6 monthly pairs. It stops on dump,
encryption, checksum, archive, upload, listing, or deletion failure. GitHub
failed-workflow notifications are the required technical-owner alert; confirm
the owner watches Actions failures before enabling automation.

No R2 bucket, token, secret, workflow run, or alert was created or sent during
local implementation. Enabling or manually dispatching the workflow requires
separate authorization for the exact environment.

## Restore decision

Use a reviewed forward migration or known-good application redeploy for an
ordinary release defect. Restore a database backup only for confirmed data
loss/corruption after incident severity, scope, last-known-good time, and
write-pause requirements are recorded.

Before any hosted restore:

1. obtain explicit authorization naming the target and backup object;
2. pause writes using the recovery runbook and record the incident timeline;
3. download both encrypted artifact and checksum into a restricted temporary
   location;
4. run `verify-backup.sh` before inspecting or restoring it;
5. restore first into a disposable isolated database and reconcile migrations,
   profiles, First Admin, Viewer + Admin rejection, Areas, tickets, batches,
   entries, reports, exports, and audit/history counts;
6. treat restored `auth.users` rows as identity evidence only; do not claim
   credentials or active sessions work; and
7. use the approved Admin account recreation or temporary-password reset flow
   for every affected identity whose credential state is not independently
   verified.

Never restore Vault/provider secrets from a logical dump, run an automatic
production down-migration, overwrite production as a rehearsal, or use a
production dump in local/staging.

## Local rehearsal evidence — 2026-07-27

Colima local Supabase was reset and loaded with the guarded synthetic Phase 6
fixture. The first broad rehearsal failed closed when the archive attempted to
restore protected `vault.secrets`; the backup allowlist was corrected to the
four required schemas. A second rehearsal exposed the missing empty-target
schema preparation, and a third exposed the required `private` helper schema.
Each failure stopped before a success claim.

The final encrypted artifact
`design-flow_restore_rehearsal_20260727T083200Z.dump.enc` passed SHA-256
checksum `c8c030f7819fd4659db6f8ae3e63ff41f6b36875836a9845e0069a0448b43e90`,
decryption, archive listing, and restore into the guarded disposable database
`design_flow_restore_phase7`. Reconciliation returned:

- 14 migrations;
- nine profiles and nine Auth identity rows;
- nine Areas, fourteen tickets, twenty work-log batches, and fifty entries;
- one consumed First Admin identity still carrying Manager + Admin; and
- zero Viewer + Admin rows.

The disposable database was dropped after evidence capture. The encrypted
synthetic artifact remains under `/private/tmp` for this local session only and
is not committed. Recovery duration was under one minute after the final
artifact existed; hosted R2 transfer/provider recovery time is not yet
measured. Auth credential validity was not tested and is an explicit recovery
limitation, not a successful credential-recovery claim.

## Quarterly record

For each rehearsal, record UTC date, environment classification, non-secret
object name/checksum, operator, restore target, start/end/duration, schema and
fixture reconciliation, Auth limitation/result, failures and corrective
actions, cleanup, and the next due date. Never record a URL containing
credentials or any decrypted content.
