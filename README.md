# Design Flow

A lightweight work-management portal for one internal UX/design team.

Phases 0–6 are complete and Phase 7 production hardening is local-only pending
external authorization. Design Flow now includes the contracted database and
permission foundation, authentication and account lifecycle, Team and Settings,
ticket creation and lifecycle, All Tickets, Work Item collaboration, and atomic,
idempotent work logging for ticket and standalone Visual Work. Phase 5 adds the
source-reconciled Dashboard, position-based people scopes, final actual-date Work
Item History, and the recipient-isolated in-app notification inbox. Phase 6 adds
explainable Tickets/Designers/Visual Work reports, authorized CSV exports, and
sanitized Work Item PDF export.

The Supabase Free staging project contains the complete Phase 6 checkpoint,
six account-lifecycle Edge Functions, nine reserved synthetic personas, and the
guarded lightweight acceptance dataset, including clearly labelled standalone
Visual Work. The original First Admin Auth identity and credentials are
preserved as the synthetic Manager + Admin; other legacy staging accounts were
removed. The non-production Cloudflare Pages Free staging deployment is live at
<https://design-flow-staging.pages.dev>. No production service, credential, or
production data is involved.

## Local setup

Prerequisites:

- Node `24.18.0` and npm `11.16.x` (see `.nvmrc` and `.node-version`)
- a Docker-compatible runtime for local Supabase (Colima is a free verified
  option; Docker Desktop is not required)
- Deno `2.8.1` for Edge Function tests (see `.dvmrc`)

If locally installed tools are under `~/.local/bin`, add them for the current
shell before running the commands below:

```sh
export PATH="$HOME/.local/bin:$PATH"
```

Install dependencies and browser support:

```sh
npm ci
npx playwright install chromium
```

Copy `.env.example` to `.env.local`, start Supabase, and replace the example
publishable key with the local value reported by the CLI:

```sh
npm run db:start
npx supabase status -o env
npm run db:reset
npm run dev
```

The application runs at `http://127.0.0.1:5173`. Supabase Studio runs at
`http://127.0.0.1:54323`.

After `npm run db:reset`, every visibly synthetic local persona can sign in
with `LocalSynthetic!Pass2026`. Useful state fixtures are:

- `designer@design-flow.example.invalid` — active account;
- `password-restricted-designer@design-flow.example.invalid` — mandatory password change; and
- `inactive-designer@design-flow.example.invalid` — inactive-account handling.

These credentials exist only in the committed local seed. Hosted accounts are
created through the protected Edge Functions documented in
[`supabase/functions/README.md`](supabase/functions/README.md).

For Phase 6 Dashboard/Reports/export acceptance, load the opt-in lightweight
dataset after a reset with an explicit non-production environment and anchor
date. It reuses the nine personas and adds nine Areas, fourteen tickets, twenty
work-log batches, and fifty work-log entries:

```sh
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  --set=validation_environment=local \
  --set=validation_anchor_date=2026-07-26 \
  --file supabase/fixtures/phase6_validation.sql
```

The script is not an automatic seed and refuses production or any database
containing a non-synthetic profile. See
[`docs/testing/demo-dataset.md`](docs/testing/demo-dataset.md) for scenario
coverage and the separately deferred post-MVP generator.

Committed environment templates are separated by purpose:
`.env.example` is local, `.env.preview.example` and `.env.staging.example` point
only to the future synthetic staging project, and `.env.production.example`
uses a distinct production placeholder. Real values belong in protected local
files or deployment settings and are ignored by Git.

## Verification

```sh
npm run verify
npm run test:e2e
npm run db:test
npm run functions:check
npm run functions:test
npm run security:scan
npm run staging:smoke
```

`npm run verify` covers formatting, linting, strict types, 115
unit/component/automation tests, and a production build. Playwright schedules
28 desktop/mobile browser
scenarios across authentication, Team, Settings, Dashboard, Notifications,
All Tickets, Work Item History, responsive behavior, and automated
accessibility; 26 run in their applicable projects and two are intentional
device-specific skips. The backend harness runs 400 pgTAP assertions and 16
Deno tests, including every valid position and Admin overlay, Dashboard source
reconciliation, notification isolation/idempotency, and direct-write denial.

## Documentation

- [Product specification](docs/product-spec.md)
- [Design-system contract](docs/design-system.md)
- [UI architecture](docs/ui-architecture.md)
- [Technical plan](docs/technical-plan.md)
- [Staging delivery and verification](docs/staging-deployment.md)
- [Production deployment runbook](docs/runbooks/deployment.md)
- [Backup and restore runbook](docs/runbooks/backup-restore.md)
- [Incident runbook](docs/runbooks/incident.md)
- [Quota runbook](docs/runbooks/quota.md)
- [Pause/resume runbook](docs/runbooks/pause-resume.md)
- [Recovery runbook](docs/runbooks/recovery.md)
- [Production bootstrap runbook](docs/runbooks/bootstrap.md)
- [Phase 7 production review](docs/phase-7-production-review.md)
- [Phase 7 rollout record](docs/phase-7-rollout-record.md)
- [MVP build plan](docs/build-plan.md)
- [Demo and validation datasets](docs/testing/demo-dataset.md)
- [Physical schema contract](docs/schema-contract.md)
- [Permission and RLS matrix](docs/permission-matrix.md)
- [Operation contracts](docs/operation-contracts.md)
- [Dashboard specification](docs/dashboard.md)
- [All Tickets specification](docs/all-tickets.md)
- [Work Item specification](docs/work-item.md)
- [Reports UI and export specification](docs/reports-ui.md)
- [Team and Settings specification](docs/team-settings.md)
- [Notifications specification](docs/notifications.md)
- [Conceptual data model](docs/data-model.md)
- [Reporting definitions](docs/reporting.md)
- [Decision register](docs/decisions.md)
- [Agent instructions](AGENTS.md)
- [Astryx reference index](references/astryx/README.md)

## Current state and gates

- Core product and data rules are documented.
- Vodafone Foundations are authoritative for color and typography.
- Astryx is the preferred reference baseline for the remaining component presentation and interaction. Design Flow reimplements that guidance in its owned component library under `src/ui/`; Astryx is not a runtime dependency or source-code dependency.
- Dashboard, All Tickets, Work Item, Reports/exports, access/hierarchy, Team and Settings, and minimal in-app Notifications are approved.
- Cloudflare Pages Free is selected for the static frontend and Supabase Free for authentication, database, and backend services; the preferred free production address is `designflow.pages.dev`, subject to name availability.
- The complete technical and operating plan is approved in `docs/technical-plan.md`, including the React/Supabase architecture, styling delivery, environments, verification, encrypted backup and restore routine, controlled deployment, monitoring, bootstrap, and rollout.
- The eight-phase implementation sequence and shared completion gate are approved in `docs/build-plan.md`.
- Phase 0 is complete: the physical schema, permission/RLS, operation-boundary, transaction, bootstrap, recalculation, migration, seed, fixture, and test contracts are fixed in the three Phase 0 contract documents.
- D-100 resolves the database phase boundary: Phase 1 owns the complete
  physical schema, RLS/read surfaces, authorization helpers, stable reference
  data, synthetic principals, generated types, and structural/read-permission
  tests; feature mutation RPCs and write-path tests remain with their Phase 2–4
  vertical slices.
- The fourteen local migrations and synthetic seed reset cleanly through Phase 6.
  The current pgTAP suite passes 400 schema, invariant, read-surface,
  persona-permission, ticket, work-log, Dashboard, notification, report, and export assertions;
  generated database types match the implemented schema shape.
- The Supabase Free staging project is healthy at the complete Phase 6
  checkpoint and has six active lifecycle Edge Functions. Its acceptance
  identities and history are conspicuously synthetic, public signup is closed,
  legacy API keys remain disabled, and the one-time bootstrap secret is absent.
- The Cloudflare Pages Free project `design-flow-staging` serves the verified
  complete Phase 6 implementation at
  <https://design-flow-staging.pages.dev>. It was built with staging
  credentials only; development source maps were not published.
- The approved Vodafone VF v4.000 variable WOFF2 is stored locally, loaded
  across its documented 200–900 weight range, and protected against synthetic
  weights. Asset provenance and checksum are recorded under
  `src/assets/fonts/`.
- The D-099 fidelity review is complete for the Phase 1 presentation aliases,
  App Shell, Button, and Input. Exact source mappings and the one temporary
  mobile-shell deviation are recorded under `references/astryx/`.
- The committed seed and browser content are conspicuously synthetic and contain
  no production data or secrets.

Phase 6 passes the local formatting, lint, strict-type, 93 unit/component,
production-build, 26 applicable Playwright/axe, 400 pgTAP/RLS, generated-type,
16 Edge Function, CSV, and synthetic three-page PDF gates. PR #20 merged at
`a879af4`; workflow #50 passed its full staging gate in 4m21s. The guarded
staging fixture reconciles to nine personas, nine Areas, fourteen tickets,
twenty batches, fifty entries, and no non-synthetic profiles. Hosted all-row CSV
projections returned 13/44/7/14/6 rows, and DF-000007 PDF reconciliation passed
with comments off by default and opt-in. PR #21 merged the team-date collision
regression at `18233b9`; workflow #52 passed the complete staging closure gate
in 3m56s.

Phase 7 now has local privacy-scrubbed monitoring, encrypted/checksummed backup
and restore tooling, ordered delivery failure stops, security headers, recovery
workflows, and operating runbooks. No Phase 7 staging change, production
infrastructure, bootstrap, pilot, or release has been authorized or performed.
