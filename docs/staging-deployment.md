# Staging delivery and verification

**Environment:** non-production staging only

**Frontend:** `https://design-flow-staging.pages.dev`

**Backend:** Supabase project `design-flow-staging`

This runbook implements the staging portion of D-092 and
`docs/technical-plan.md`. It does not authorize production delivery or any Phase
3 behavior.

## Delivery owner and trigger

GitHub Actions owns staging delivery. The `staging` job in
`.github/workflows/ci.yml` runs only for `main`, after both required verification
jobs pass. A repository owner may re-run the complete workflow from `main`
through `workflow_dispatch`; verification still runs before deployment.

The job targets the GitHub `staging` environment and stops on the first failed
step. Pull requests never receive staging credentials and never deploy.

## GitHub staging configuration

Create a GitHub environment named `staging` with these environment variables:

| Variable | Purpose |
|---|---|
| `STAGING_SUPABASE_PROJECT_ID` | Project reference for `design-flow-staging` |
| `STAGING_SUPABASE_URL` | HTTPS Data API/Auth base URL |
| `STAGING_SUPABASE_PUBLISHABLE_KEY` | Browser-safe publishable key |
| `CLOUDFLARE_ACCOUNT_ID` | Account containing `design-flow-staging` Pages |

Add these encrypted environment secrets:

| Secret | Required scope |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Technical-owner token used only by the Supabase CLI delivery steps |
| `CLOUDFLARE_API_TOKEN` | Cloudflare account token limited to Pages Edit for the staging account |

The publishable key is intentionally a variable because it is embedded in the
browser build. The pinned Supabase CLI uses the access token to initialize its
temporary hosted login role, so no database password is stored in GitHub.
Supabase secret/service-role keys, Auth Admin credentials, user passwords, the
retired bootstrap secret, production identifiers, and production credentials
must not be configured in this environment.

## Ordered delivery

After verification passes, the staging job:

1. installs the pinned repository dependencies and Supabase CLI;
2. links only the configured staging project;
3. previews pending forward migrations;
4. applies pending migrations without resetting or seeding the hosted project;
5. verifies migration history and compares the hosted generated type schema
   with the committed local-migration types, excluding generator-specific
   client metadata;
6. deploys all account-lifecycle Edge Functions;
7. builds with `VITE_APP_ENV=staging` and rejects public source maps;
8. directly uploads `dist/` to the existing `design-flow-staging` Cloudflare
   Pages project on its `main` production branch; and
9. verifies the canonical Pages bundle, Supabase Auth health, anonymous profile
   denial, and the Edge Function origin allowlist.

A migration, type, Function, build, Pages, or smoke-check failure prevents later
steps from being reported as a successful checkpoint. Database rollback uses a
reviewed forward corrective migration; the workflow never runs a hosted reset,
down migration, or seed.

## Phase 2 staging acceptance

The automated delivery smoke check is necessary but does not replace the Phase
2 acceptance matrix. Before Phase 2 closes, use only conspicuously synthetic
staging identities and record evidence that:

- public registration remains absent and mandatory password change cannot be
  bypassed;
- Viewer + Admin remains rejected;
- Designer, Lead, and Manager retain their position/default people scope when
  Admin privilege is independently added or removed;
- allowed and denied account create/reset/deactivate/reactivate paths match the
  permission matrix and preserve history;
- allowed and denied reporting-line, Area/Squad, label, timezone, and audit
  paths match the operation contracts;
- the Team directory exposes only approved shared fields;
- Settings reads and controls remain Admin-only;
- Authentication, Team, Settings, and the shared shell match their approved
  briefs on desktop and mobile, including keyboard, loading, empty, error, and
  unauthorized behavior; and
- Supabase and Cloudflare logs show no unexpected secret, personal-data, or
  production-data exposure.

Record the successful date and results in the four Phase 2 UI briefs and update
the repository current-state summary only after the complete matrix passes.

**Completed 2026-07-21:** the complete matrix passed with conspicuously
synthetic staging identities and records. Results are recorded in the
Authentication, Team, Settings, and shared application shell briefs. Supabase
and Cloudflare logs showed no unexpected secret, personal-data, or
production-data exposure.

## Phase 5 staging acceptance

The Phase 5 checkpoint extends the automated smoke check with stable Dashboard,
Notifications, and final Work Item History bundle markers. The check retries a
bounded number of times because the canonical Cloudflare Pages URL can briefly
serve the preceding bundle after a successful direct upload.

Use only labelled synthetic staging records and verify that:

- position defaults and deliberate Lead/Manager/All people scopes reconcile to
  the visible source people and Work Items without Admin changing the default;
- stale and recent-work facts use actual work dates and the configured
  Sunday–Thursday calendar, never authentication recency;
- Planned until discloses due-date coverage without availability or capacity
  language;
- standalone Visual Work stays distinct from ticket lifecycle activity;
- the notification inbox is recipient-only, safely summarized, linked only to
  already-readable Work Items, and supports its approved read/paging behavior;
- final Work Dates and history preserve planned, actual, and system timestamps;
  and
- Phase 6 Reports/export routes, controls, and placeholders are absent.

**Completed 2026-07-26:** merged PRs #18/#19 at `cd9cdff` and GitHub workflow
#48 deployed the complete Phase 5 checkpoint and passed all
frontend/browser, local Supabase/Deno, hosted schema/type, Edge Function, build,
Pages, and live smoke jobs. Authenticated staging acceptance reconciled the
Manager default plus Lead and All alternates, Dashboard source rows, the empty
personal notification inbox, and DF-000003 actual-date history. The exit-gate
follow-up removed the discovered Reports placeholder before Phase 5 closure.

## Phase 6 staging acceptance

Phase 6 is locally verified but has not been published. After separate
authorization to push, open/merge a PR, and deploy, use authenticated Chrome and
only conspicuously synthetic staging records to verify:

1. Confirm the staging database contains only the nine reserved synthetic
   validation personas and no real/personal data.
2. Load `supabase/fixtures/phase6_validation.sql` with
   `validation_environment=staging` and the acceptance date as
   `validation_anchor_date`. The fixture is opt-in, idempotent for that anchor,
   and production-guarded; exact contents are documented in
   `testing/demo-dataset.md`.
3. Re-run the same command once and confirm the fixture remains at nine Areas,
   fourteen tickets, twenty batches, and fifty entries before UI acceptance.

- `/reports` exposes Tickets, Designers, and standalone Visual Work with the
  position-based default people scope and Admin-neutral default;
- every card, chart/table equivalent, filter, detail row, and source link
  reconciles to controlled records, including Sunday–Saturday periods and
  Sunday–Thursday stale calculations;
- all five CSV types preserve the current view, include every matching row
  beyond pagination, repeat fixed metadata, and remain absent/denied outside
  Lead, Manager, or eligible Admin privilege;
- Work Item PDF is absent for Viewer, available under the approved capability,
  keeps comments off by default, contains no withdrawn body, and cannot widen
  record visibility;
- planned dates, actual `work_date`, and system timestamps remain distinct,
  `Planned until` makes no availability/capacity claim, and the clearly labelled
  synthetic standalone record never enters ticket metrics; and
- desktop/mobile keyboard and axe checks remain clean, with no production data,
  secrets, source maps, placeholder UI, or Phase 7 controls.

Record workflow/check identifiers, exact hosted fixture reconciliation, CSV
row counts, PDF values, and any unresolved gate here only after that authorized
staging pass. Current gate: **pending publishing authorization**.
