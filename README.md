# Design Flow

A lightweight work-management portal for one internal UX/design team.

Phase 0 fixed the schema, permission, and operation contracts, and Phase 1
delivered the application and database foundation. Phase 2 Slice 1 implemented
the approved authentication and account-lifecycle boundary. The current Phase
2 Slice 2 branch adds the active Team directory, Admin-only member and hierarchy
administration, Areas/Squads, labels, team timezone, administration audit, and
their responsive and permission-gated UI.

The Supabase Free staging project contains the Phase 1 foundation plus the
authentication/account-lifecycle migrations, six Edge Functions, stable
reference rows, and conspicuously synthetic acceptance records. The
non-production Cloudflare Pages Free staging deployment is live at
<https://design-flow-staging.pages.dev>. No production service, credential, or
real account/data has been created.

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
npm run staging:smoke
```

`npm run verify` covers formatting, linting, strict types, 56 unit/component
tests, and a production build. Playwright schedules 20 desktop/mobile browser
scenarios for authentication, Team, Settings, guarded shell behavior, geometry,
and automated accessibility; 18 run in their applicable projects and two are
intentional device-specific skips. The backend harness runs 194 pgTAP
assertions and 16 Deno tests for the Phase 2 account, hierarchy, list, setting,
and audit boundaries.

## Documentation

- [Product specification](docs/product-spec.md)
- [Design-system contract](docs/design-system.md)
- [UI architecture](docs/ui-architecture.md)
- [Technical plan](docs/technical-plan.md)
- [Staging delivery and verification](docs/staging-deployment.md)
- [MVP build plan](docs/build-plan.md)
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
- The four local migrations and synthetic seed reset cleanly. The current
  pgTAP suite passes 194 schema, invariant, read-surface, persona-permission,
  authentication/account-lifecycle, hierarchy, controlled-list, timezone, and
  audit assertions; generated database types match the implemented schema
  shape.
- The Supabase Free staging project is healthy at the existing
  authentication/account-lifecycle checkpoint and has six active lifecycle
  Edge Functions. Its acceptance identities and history are conspicuously
  synthetic, public signup is closed, legacy API keys remain disabled, and the
  one-time bootstrap secret is absent.
- The Cloudflare Pages Free project `design-flow-staging` serves the verified
  authentication/account-lifecycle checkpoint at
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

Authentication/account lifecycle is implemented and verified locally,
mobile-LAN, and in the existing non-production staging checkpoint. Team
hierarchy and Settings are implemented and fully verified by the local unit,
browser, database, and Edge Function gates. The hosted staging checkpoint is
intentionally unchanged until this branch is reviewed and an update is
explicitly authorized.
