# Work Portal agent instructions

These instructions apply to the whole repository.

## Source of truth

Read these before planning or changing implementation:

1. `docs/product-spec.md`
2. `docs/design-system.md`
3. `docs/ui-architecture.md`
4. `docs/ui-direction.md`
5. `docs/technical-plan.md`
6. `docs/build-plan.md`
7. `docs/schema-contract.md`
8. `docs/permission-matrix.md`
9. `docs/operation-contracts.md`
10. `docs/dashboard.md`
11. `docs/all-tickets.md`
12. `docs/work-item.md`
13. `docs/reporting.md`
14. `docs/reports-ui.md`
15. `docs/team-settings.md`
16. `docs/notifications.md`
17. `docs/data-model.md`
18. `docs/decisions.md`

If code and documentation disagree, stop and surface the mismatch. Do not silently choose one.

Product behavior is governed by the product specifications and approved decisions. Vodafone color and typography are governed by `docs/design-system.md`, with its linked foundation sources remaining authoritative for those extracted facts. Verified Astryx references govern the preferred non-color, non-typographic component presentation and engineering baseline. Design Flow's UI architecture and component-ownership rules are governed by `docs/ui-architecture.md`; stable cross-product UI direction and feature-brief expectations are governed by `docs/ui-direction.md`.

Astryx is the preferred reference baseline for component anatomy, proportions, density, sizing, internal spacing, shape, border and elevation geometry, motion, interaction, accessibility, keyboard behavior, states, responsive behavior, and implementation recommendations. This authority excludes color and typography, which remain Vodafone-owned. Astryx code and component APIs are not source of truth, and Astryx must not be installed as a runtime dependency. “Astryx fidelity” means a Design Flow-owned reimplementation from verified official guidance, not copied source, styling files, documentation, or APIs. When a required reference note or measurable value is missing, distill the relevant official Astryx guidance and record any remaining gap before implementing the component; do not guess or claim unverified fidelity.

## Working method

- Build one approved module or vertical slice at a time.
- Follow the phase order and exit gates in `docs/build-plan.md`; complete Phase 0 contracts before application scaffolding.
- Confirm or document acceptance criteria before implementing a module.
- Do not invent behavior for an item marked open in `docs/decisions.md`.
- Keep the product mobile-first and usable at every checkpoint.
- Reuse Vodafone semantic color tokens and text styles, plus approved Design Flow aliases that map verified Astryx non-color presentation into the runtime.
- Treat CSS custom properties only as the runtime representation of approved Vodafone color/typography and Design Flow mappings of verified Astryx presentation; use CSS Modules only for style scoping. Neither may introduce a parallel token source or undocumented visual values.
- Build and consume Design Flow-owned components under `src/ui/`; do not wrap, import, or recreate Astryx APIs as a project dependency.
- Give every shared UI component a documented public API, Vodafone color/typography, verified Astryx-aligned non-color presentation, accessible interaction behavior, responsive behavior where relevant, and automated tests.
- Preserve Light/Dark behavior and responsive accessibility requirements. The current portal scope is English/LTR; do not add Arabic/RTL product scope unless a later approved decision requires it.
- Keep route/page composition thin; place behavior with its feature/domain module.
- Use Supabase as the data and authentication layer.
- Ordinary reads/writes may use `supabase-js` directly when protected by tested Row Level Security.
- Use Postgres functions for atomic multi-record domain actions and authenticated Supabase Edge Functions only for operations requiring server-held secrets or Auth administration.
- Never expose service-role or auth-admin credentials in browser code.
- Preserve audit, assignment, status, blocker, and work-log history.
- Treat planned dates, actual work dates, and system timestamps as different concepts.
- Keep derived reporting formulas explainable and covered by tests.
- Treat MVP-fixed statuses, work types, organizational positions, Admin privilege, thresholds, calendar rules, and Dashboard definitions as product-controlled rather than casually hardcoded throughout features.
- Use stable internal codes separately from user-facing labels for every persisted controlled value.
- Centralize status-to-reporting-bucket mappings, workflow rules, calendar rules, and thresholds behind one tested source of truth.
- Preserve historically used values through retirement/archive behavior; never delete or silently reinterpret stored history.
- Deliver changes to persisted vocabularies, workflow, or permissions through versioned migrations with compatibility notes and regression tests.
- Do not add features merely because Jira has them.
- Keep sample/placeholder states visibly labeled and never present them as functional.

## Scope protections

Do not add these without an approved decision change:

- Multi-team tenancy, organizations, or workspaces
- Projects, epics, or nested subtasks
- Multiple equal assignees
- Priority
- Generic attachments, uploads, or non-Figma link fields
- Hours, effort points, productivity scores, or designer rankings
- Public registration, OAuth, or SSO
- Notification behaviors beyond the approved in-app events in `docs/notifications.md`
- PO request forms
- Astryx runtime packages, copied Astryx source code, or wrappers around Astryx components

## Data and security

- Add Row Level Security with the first schema migration, not afterward.
- Test every organizational position's allowed and denied paths, then repeat relevant paths with and without the independent Admin privilege for Designer, Lead, and Manager. Test Viewer + Admin as a rejected account state.
- Use soft archive/withdrawal for normal product actions; do not hard-delete history.
- Recalculate contributors and report aggregates after relevant log edits or withdrawal.
- Keep generated database types in sync with migrations.
- Test migrations against representative historical status, work-type, position/Admin-privilege, and reporting-line records before release.
- Do not store sensitive customer/production data or copy Figma content into the portal.

## Verification

For every implementation slice:

- Run type checks, lint, automated tests, and a production build where applicable.
- Test empty, loading, error, unauthorized, and mobile states.
- Verify that report values can be traced to source records.
- Update the source-of-truth documents when an approved rule changes.
