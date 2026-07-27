# Recovery runbook

**Owner:** Admin/technical maintainer

## Choose the least destructive path

1. Application regression: redeploy the previous known-good Functions and
   frontend; do not mutate the database.
2. Database behavior defect without confirmed loss: ship a reviewed,
   forward-only corrective migration.
3. Confirmed data loss/corruption: pause writes, select an authorized encrypted
   backup, and rehearse the restore into an isolated database before any hosted
   recovery.

## Data recovery

Follow `backup-restore.md`: verify the encrypted-object checksum, decrypt only
to a permission-restricted temporary path, require `pg_restore --list`, then
restore into a disposable target. Reconcile migration history, profiles, Auth
identity rows, First Admin Manager + Admin state, zero Viewer + Admin, Areas,
tickets, work-log batches/entries, reports/exports, notifications, and
audit/history before requesting authorization for a hosted restore.

Logical Auth rows do not prove that passwords, MFA, provider credentials, or
sessions work. Use the approved Admin reset/recreation path for affected users;
never claim credential recovery from row counts. Vault/provider secrets are not
in the backup and must be restored/rotated separately in their owning systems.

## Return to service

Run migration/type checks, Auth/RLS/Function backend smoke, critical application
journeys, reports/exports reconciliation, security headers, monitoring privacy,
and live smoke. Record incident, exact release/migrations, backup object and
checksum, restore target/duration/counts, Auth limitation/actions, approvers,
write-resume time, and cleanup. Drop disposable targets and securely remove
decrypted temporary files after evidence is retained.
