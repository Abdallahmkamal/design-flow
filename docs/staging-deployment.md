# Staging delivery and verification

**Environment:** non-production staging only

**Frontend:** `https://design-flow-staging.pages.dev`

**Backend:** Supabase project `design-flow-staging`

This runbook implements the staging portion of D-092 and
`docs/technical-plan.md`. It does not authorize production delivery or any
external Phase 7 action.

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
| `STAGING_SENTRY_DSN` | Optional browser-safe Sentry DSN; only after separate monitoring-provider authorization |
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
7. runs Auth health, anonymous RLS denial, and Function-origin smoke checks
   before frontend delivery;
8. builds with `VITE_APP_ENV=staging`, embeds the exact environment marker,
   copies the security-header policy, and rejects public source maps;
9. directly uploads `dist/` to the existing `design-flow-staging` Cloudflare
   Pages project on its `main` production branch; and
10. verifies the canonical Pages bundle markers, environment marker, security
    headers, Supabase Auth health, anonymous profile denial, and the Edge
    Function origin allowlist.

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

Phase 6 was published through merged PR #20 at `a879af4`. Workflow #50 passed
the complete staging gate in 4m21s and deployed the build to Cloudflare Pages.
Authenticated Chrome and only conspicuously synthetic staging records were used
for acceptance:

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

The production-guarded fixture passed two exact loads with anchor 2026-07-27:
nine reserved personas, nine Areas, fourteen tickets, twenty work-log batches,
fifty entries, all six statuses, zero non-synthetic profiles, and zero rejected
Viewer + Admin states. The original First Admin Auth identity and password were
preserved as the synthetic Manager + Admin; all other legacy staging identities
were removed before the reserved personas were provisioned. The approved
inactive and password-restricted states remain distinct.

The hosted all-people Reports view reconciled to 13 ticket source rows, seven
designer rows, and six clearly labelled standalone Visual Work rows. Its five
unpaginated export projections returned 13 ticket-summary, 44 ticket-activity,
seven designer-summary, fourteen designer-ticket, and six Visual Work rows.
DF-000007 PDF generation succeeded with comments off and opt-in; its sanitized
payload reconciled to sixteen actual work dates, one history event, zero
default comments, two opt-in comments, and no embedded raw comments, events, or
capabilities.

Staging acceptance exposed one pre-existing lifecycle defect: three account and
hierarchy RPCs used a PL/pgSQL variable named `current_date`, which PostgreSQL
could resolve as the database-session date instead of the authoritative team
date. Migration `20260727010000_fix_team_date_variable_collision.sql` renames
that local variable without changing signatures or grants; six regression
assertions raise the pgTAP/RLS total from 394 to 400. PR #21 merged the closure
at `18233b9`; workflow #52 passed the complete staging gate in 3m56s. Phase 6 is
closed.

## Phase 7 delivery status

The local Phase 7 implementation adds ordered stage gates, pre-frontend backend
smoke, an exact environment marker, security-header checks, private monitoring
configuration, encrypted backup/recovery workflows, and manual production and
known-good redeploy workflows. Local contracts prove later stages are blocked
when migrations have not completed.

PR #22 merged the local Phase 7 implementation to `main` at `78aeae0` after
workflow #54 passed both required PR jobs. Workflow #55 then passed migrations,
hosted types, Functions, pre-frontend backend smoke, build, source-map denial,
and Pages upload. Its immediate final smoke stopped because the canonical Pages
URL still served the preceding headerless document; the required CSP and other
headers were present after propagation. The closure fix extends the existing
bounded canonical-URL retry to headers and the environment marker as well as
bundle markers; it adds regression coverage and raises the local test count to
116.

Sentry/R2 configuration, a failed hosted migration demonstration, and the
known-good staging redeploy remain separate evidence gates. Preserve the
original `[SYNTHETIC] Manager + Admin` Auth identity and credentials and the
reserved nine-persona fixture; do not reset or replace it.
