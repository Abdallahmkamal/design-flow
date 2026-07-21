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
