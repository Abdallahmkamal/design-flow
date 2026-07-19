# Design Flow

A from-scratch, lightweight work-management portal for one internal UX/design team.

This directory contains the **MVP specification v1.0 documentation checkpoint**. Product, technical, and build-planning decisions are approved for local implementation.

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

## Current state

- Core product and data rules are documented.
- Vodafone Foundations are the visual source of truth for color, semantic tokens, typography, spacing, elevation, and brand identity.
- Design Flow owns its component library under `src/ui/`; Astryx is used only through distilled engineering notes under `references/astryx/` and is not a runtime dependency.
- Dashboard, All Tickets, Work Item, Reports/exports, access/hierarchy, Team and Settings, and minimal in-app Notifications are approved.
- Cloudflare Pages Free is selected for the static frontend and Supabase Free for authentication, database, and backend services; the preferred free production address is `designflow.pages.dev`, subject to name availability.
- The complete technical and operating plan is approved in `docs/technical-plan.md`, including the React/Supabase architecture, styling delivery, environments, verification, encrypted backup and restore routine, controlled deployment, monitoring, bootstrap, and rollout.
- The eight-phase implementation sequence and shared completion gate are approved in `docs/build-plan.md`.
- Phase 0 is complete: the physical schema, permission/RLS, operation-boundary, transaction, bootstrap, recalculation, migration, seed, fixture, and test contracts are fixed in the three Phase 0 contract documents.
- No application scaffold, Supabase project, migration, environment setup, backup routine, or deployment pipeline has been created in this clean project yet; the documents specify them for implementation rather than claiming they already exist.
- No application code has been scaffolded.

The product name and initial visual identity are approved as **Design Flow**. O-008 and O-009 are closed. The next approved implementation step is Phase 1 project foundation. No application scaffold or cloud service has been created yet.
