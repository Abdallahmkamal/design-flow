# Backup and restore runbook

**Owner:** Admin/technical maintainer

**Status:** Local and hosted production-source restore rehearsals passed;
Admin-controlled offline backup procedure verified

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

The encryption key must be at least 32 characters and remain in an approved
Admin-controlled recovery location separate from the backup media. The
database URL, encryption key, and any Supabase secret must never be printed,
committed, placed in a browser variable, uploaded as a GitHub artifact, or
copied into evidence.

## Zero-billing offline operation

No R2 subscription, bucket, token, or hosted backup workflow is used. The Admin
runs `create-backup.sh` from an approved operator environment, immediately runs
`verify-backup.sh`, and copies only the encrypted artifact and checksum to the
named offline destination. The recovery key is kept separately.

For every backup:

1. record UTC time, source environment, operator, non-secret label, and reason;
2. create and verify the encrypted artifact without retaining plaintext;
3. copy the artifact/checksum pair to the named offline destination and verify
   the checksum again from that destination;
4. maintain 7 daily, 4 weekly, and 6 monthly pairs, deleting an expired pair
   only after confirming a newer verified copy exists; and
5. for pre-migration backups, enter the exact label, 64-character lowercase
   SHA-256, and `BACKUP_VERIFIED_OFFLINE` confirmation in the production
   workflow.

Creation, encryption, verification, or destination-copy failure stops the
release before workflow dispatch. The GitHub workflow validates and records
the non-secret attestation; it cannot inspect offline media and must never be
presented as independent proof that the file exists. Production bootstrap and
release remain blocked until the offline destination is named and a
production-source backup is successfully restored into an isolated target.

## Restore decision

Use a reviewed forward migration or known-good application redeploy for an
ordinary release defect. Restore a database backup only for confirmed data
loss/corruption after incident severity, scope, last-known-good time, and
write-pause requirements are recorded.

Before any hosted restore:

1. obtain explicit authorization naming the target and backup artifact;
2. pause writes using the recovery runbook and record the incident timeline;
3. copy both encrypted artifact and checksum from offline media into a
   restricted temporary location;
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

## Post-bootstrap production backup — 2026-07-30

The read-only production dump ran through the existing Colima PostgreSQL 17.6
client after one missing-host-client stop and two safely rejected connection
attempts. No artifact was created by the failed attempts. The successful
artifact is
`design-flow_production_post_bootstrap_20260730T120201Z.dump.enc`, 596,560
bytes, with SHA-256
`9727b82d9a5a4dac6aa0f1babd791dcdd23984866ae4c4e23dfc12dd50f137c9`.
Local checksum equality, recovery-key decryption, and `pg_restore --list`
passed. Plaintext, clipboard contents, and the temporary Keychain database URI
were removed. Authenticated Drive u/2 listed the uploaded encrypted artifact
and checksum; the downloaded copies were byte-identical to the local originals,
and the downloaded artifact independently matched the recorded SHA-256.

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
artifact existed; offline-media transfer time is not yet measured. Auth
credential validity was not tested and is an explicit recovery
limitation, not a successful credential-recovery claim.

## Quarterly record

For each rehearsal, record UTC date, environment classification, non-secret
artifact label/checksum, operator, restore target, start/end/duration, schema and
fixture reconciliation, Auth limitation/result, failures and corrective
actions, cleanup, and the next due date. Never record a URL containing
credentials or any decrypted content.

## Production pre-migration evidence — 2026-07-29

Before workflow `30526117799`, the Admin created and verified encrypted artifact
`design-flow_production_pre_migration_20260729T225324Z.dump.enc` with SHA-256
`31934e3def6b7c5cfb473a4fc751b01ff220e7746cada2ec12ee3769afb61da1`.
Checksum, decrypt, and archive-list checks passed. The encrypted artifact and
checksum copied to the named Admin-controlled Google Drive destination were
downloaded through authenticated Chrome and proved byte-identical to the local
pair. The recovery key remained separate. This proves the pre-migration
backup/offline-copy procedure; it does not replace the required post-delivery
production-source restore into an isolated hosted target.

## Production post-delivery evidence — 2026-07-30

After the guarded production workflow passed, the Admin created encrypted
artifact `design-flow_production_post_delivery_20260730T083655Z.dump.enc`
(594,800 bytes), SHA-256
`fe83fcf571aaa97ebb95181c3964a0168707280f4c22f65186e299a6fc0f9309`.
Local checksum, decrypt, archive-list, and plaintext-cleanup checks passed. The
Admin-controlled Drive copies were downloaded through authenticated Chrome;
their checksum passed and both files were byte-identical to the local pair.

With explicit authorization, staging was paused and a disposable Free Supabase
project was created for the hosted rehearsal. Four preparation attempts failed
closed on policy-clean ordering, protected Auth-schema ownership, an overly
broad Auth exclusion, and missing extensions. The final 35.7-second restore
installed the approved extension set, restored `public`, `private`, and
`supabase_migrations` with an exact TOC filter, and preserved the provider-owned
empty Auth schema because the source contained zero Auth identities.

Production and the restored target reconciled to 14 migrations; zero profiles,
Auth users, Viewer + Admin, Areas, tickets, batches, entries, comments,
notifications, and audit events; one unconsumed bootstrap row; 4 positions, 6
statuses, 19 work types, 26 policies, and 55 public functions. The target also
had 31 public tables, RLS on all 30 applicable tables, forced RLS/direct-write
denial on profiles, and the collision-fix migration. No Auth credential
recovery is claimed.

The disposable project and its one-time Keychain credential were deleted; all
decrypted temporary files were removed. Staging resumed and passed frontend,
security-header, Function-origin, fail-closed inactive-account, and
authenticated Manager + Admin Dashboard smoke checks. The next rehearsal is
due by 2026-10-30 and after any material backup-contract change.
