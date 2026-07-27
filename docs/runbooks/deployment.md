# Deployment runbook

**Owner:** Admin/technical maintainer

**Status:** Local contracts, configured staging delivery, hosted failure stop,
recovery, and known-good redeploy verified; production not authorized

## Release boundary

Only a merged, reviewed `main` commit may be released. Pull requests run
verification without deployment credentials. Staging delivery follows the
verified `main` workflow; production is manual and additionally requires the
protected `production` environment, its reviewer, the exact `main` SHA, and the
literal `DEPLOY_PRODUCTION` confirmation. An approval to implement or merge is
not approval to deploy.

The Admin/technical maintainer owns delivery and recovery. A Manager owns the
team hierarchy and reporting view but gains no deployment authority from that
position. Never place service-role, Auth-admin, Supabase, Cloudflare, R2,
Sentry, database, or bootstrap credentials in browser variables, commands,
logs, screenshots, or evidence.

## Protected production configuration

Create a reviewer-protected GitHub environment named `production`. Configure
non-secret variables for `PRODUCTION_APP_URL`, `PRODUCTION_SUPABASE_PROJECT_ID`,
`PRODUCTION_SUPABASE_URL`, `PRODUCTION_SUPABASE_PUBLISHABLE_KEY`,
`PRODUCTION_PAGES_PROJECT`, `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCOUNT_ID`,
`R2_BACKUP_BUCKET`, and `BACKUP_AUTOMATION_ENABLED`. Add
`PRODUCTION_SENTRY_DSN` only after monitoring authorization; it is the public
browser-ingest DSN, never an auth token.

Configure protected secrets for `SUPABASE_ACCESS_TOKEN`,
`SUPABASE_DATABASE_URL`, `BACKUP_ENCRYPTION_KEY`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, and the least-privilege `CLOUDFLARE_API_TOKEN`. The
backup key must also exist in an approved separate recovery location. Confirm
names/presence without printing values. Bootstrap secrets are temporary
Function secrets under the bootstrap runbook and are not normal deployment
configuration.

## Ordered delivery

`.github/workflows/ci.yml` and `.github/workflows/production.yml` enforce this
order:

1. complete repository verification;
2. create and verify the encrypted pre-migration production backup;
3. preview and apply forward-only migrations;
4. verify migration history and generated hosted types;
5. deploy Edge Functions;
6. check Auth health, anonymous RLS denial, and Function CORS before frontend;
7. build the environment-marked frontend and reject source maps;
8. deploy Cloudflare Pages with security headers; and
9. check the live markers, environment marker, security headers, Auth/RLS, and
   Function origin, then record success.

`scripts/delivery/stage-gate.mjs` permits a stage only when all preceding
stages are complete. Every shell and workflow step uses failure-stop behavior;
a failed backup, migration, type comparison, Function deployment, smoke,
build, source-map check, Pages upload, or live smoke prevents a success claim.
Do not manually skip a failed stage.

## Before triggering production

- Confirm the SHA is on current `main`, checks are green, the approved change
  set is understood, and no unresolved security/data/core-workflow issue exists.
- Confirm the protected production variables and secrets are present without
  printing their values, backup automation is enabled, failure notifications
  reach the technical owner, and current quota usage is below the decision gate.
- Record release SHA, operator, approval, intended migrations, known-good SHA,
  smoke scope, and rollback decision before dispatch.
- Use authenticated Chrome for GitHub review, environment approval, workflow
  inspection, and live verification. Do not use GitHub CLI.

## Failure and recovery

If a migration or pre-frontend smoke fails, stop. Preserve the workflow/run ID,
failed stage, non-secret diagnostics, and database migration state. Use a
reviewed forward corrective migration for database defects. Never run an
automatic down-migration or continue to Functions/frontend.

For an application regression, manually dispatch
`.github/workflows/redeploy-known-good.yml` with an exact known-good `main`
ancestor and `REDEPLOY_KNOWN_GOOD`. It redeploys Functions and frontend without
database mutation, preserves the current security-header policy, and runs
backend and live smoke checks. Restore a backup only for confirmed data loss or
corruption under the recovery runbook.

## Evidence record

Record environment, exact SHA, workflow/run ID and duration, backup object and
checksum, ordered-stage results, migration list, pre/post smoke results,
known-good SHA if used, incident link, and final disposition. Never record
credentials, private payloads, or signed URLs. Staging run `30257511622` proves
known-good Functions/frontend redeploy without database mutation. Workflow #64
(`30258329567`) proves a hosted migration exception stops every later stage;
workflow #65 (`30258611718`) proves the failed transaction left no migration
residue and the complete staging gate recovered.
