# Design Flow

A lightweight work-management portal for one internal UX/design team.

Phase 0 fixed the schema, permission, and operation contracts. The local part of
Phase 1 is now in progress: the repository contains a strict React/Vite
foundation, responsive shell, Design Flow tokens and initial UI primitives,
environment validation, automated checks, and local Supabase/Edge Function test
harnesses.

No hosted Supabase project, Cloudflare project, staging deployment, production
service, or real account/data has been created.

## Local setup

Prerequisites:

- Node `24.18.0` and npm `11.16.x` (see `.nvmrc` and `.node-version`)
- a Docker-compatible runtime for local Supabase
- Deno `2.8.1` for Edge Function tests (see `.dvmrc`)

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
  until the complete schema and RLS can ship and pass the gate in
  `docs/schema-contract.md`; this machine currently lacks the Docker-compatible
  runtime needed to reset and verify it.
- Cloud staging and the non-production placeholder deployment remain deferred
  because this work is explicitly local-only.
- The required `Vodafone VF` family is named first in the runtime token, but the
  checkpoint contains no licensed font files. The system fallback is local-only
  and not final visual approval.
- D-099 requires the Phase 1 shell, Button, Input, and supporting presentation
  aliases to receive an Astryx fidelity review before Phase 2 UI implementation.
- The committed seed and browser content are conspicuously synthetic and contain
  no production data or secrets.

The next implementation slice is the complete first migration, RLS policies,
idempotent synthetic personas/reference data, generated database types, and the
full pgTAP permission/invariant suite. Phase 2 must not begin until the Phase 1
exit gate is satisfied.
