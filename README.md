# Design Flow

A lightweight work-management portal for one internal UX/design team.

Phase 0 fixed the schema, permission, and operation contracts. Phase 1 is in
progress: the repository contains a strict React/Vite foundation, responsive
shell, Vodafone typography/color and Astryx-aligned non-color presentation,
initial Design Flow UI primitives, environment validation, automated checks,
and local Supabase/Edge Function test harnesses.

A Supabase Free staging project exists without migrations, accounts, or data.
No Cloudflare project, deployment, production service, or real account/data has
been created.

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
npm run functions:test
```

`npm run verify` covers formatting, linting, strict types, unit/component tests,
and a production build. Playwright covers desktop/mobile browser behavior and
automated accessibility checks. The GitHub Actions foundation workflow repeats
those checks and runs the local pgTAP and Deno harnesses.

## Documentation

- [Product specification](docs/product-spec.md)
- [Design-system contract](docs/design-system.md)
- [UI architecture](docs/ui-architecture.md)
- [Technical plan](docs/technical-plan.md)
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
- Phase 1 is not complete. The first database migration is intentionally absent
  while the documented Phase 1 complete-schema requirement is reconciled with
  the build plan's Phase 2–4 ownership of domain mutation operations. The local
  Docker-compatible runtime is now available for reset and verification.
- The Supabase Free staging project is healthy and empty. Cloudflare Pages Free
  setup and the non-production placeholder deployment remain to be completed.
- The approved Vodafone VF v4.000 variable WOFF2 is stored locally, loaded
  across its documented 200–900 weight range, and protected against synthetic
  weights. Asset provenance and checksum are recorded under
  `src/assets/fonts/`.
- The D-099 fidelity review is complete for the Phase 1 presentation aliases,
  App Shell, Button, and Input. Exact source mappings and the one temporary
  mobile-shell deviation are recorded under `references/astryx/`.
- The committed seed and browser content are conspicuously synthetic and contain
  no production data or secrets.

After the migration-boundary clarification, the next implementation slice is
the first migration, RLS policies, idempotent synthetic personas/reference
data, generated database types, and the applicable pgTAP
permission/invariant suite. Phase 2 must not begin until the Phase 1 exit gate
is satisfied.
