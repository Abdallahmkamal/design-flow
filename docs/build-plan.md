# Design Flow MVP build plan

**Status:** Approved  
**Decision:** D-095  
**Last updated:** 2026-07-19

This document defines the required implementation order and completion gates for the Design Flow MVP. Build vertically, keep the application usable at each checkpoint, and do not begin a dependent phase while its prerequisite contracts or behavior remain unresolved.

## Delivery principles

- Complete Phase 0 in the local Codex project before scaffolding application code.
- Build the Design Flow component library just in time for approved product slices; do not create a speculative catalogue of every possible component upfront.
- Add or update the relevant distilled Astryx reference before implementing a shared component whose engineering contract is not already covered.
- Every persisted feature ships with its migration, RLS, permission tests, generated types, audit/history behavior, and representative seed/test data in the same slice.
- Every interface slice includes responsive, keyboard, loading, empty, error, and unauthorized behavior rather than deferring them to a final polish phase.
- Reports and exports are built only after their source records and derived formulas are stable and tested.
- Notifications are built only after the domain events that produce them are stable.
- A phase may be split into smaller pull requests, but its exit gate remains unchanged.

## Phase 0 — Schema and security contract

**Completed:** 2026-07-19

Finalize the implementation contracts before scaffolding:

- physical Postgres tables, columns, types, indexes, constraints, and relationships;
- stable internal codes and initial seed values for product-controlled vocabularies;
- archive, withdrawal, effective-date, and append-only history behavior;
- RLS capability matrix for Viewer, Designer, Lead, and Manager, repeated with and without independent Admin privilege for every valid combination, with Viewer + Admin specified and tested as an invalid account state;
- browser, Postgres RPC, and Edge Function boundaries for every mutation;
- RPC transaction contracts for compound ticket, blocker, assignment, status, and work-log actions;
- Auth-admin Edge Function contracts and first-Admin bootstrap procedure;
- derived reporting formulas and the source records that recalculate them; and
- migration naming, generated-type, seed-data, and test-fixture conventions.

### Exit gate

- `docs/schema-contract.md`, `docs/permission-matrix.md`, and `docs/operation-contracts.md` exist and agree with the conceptual data model and decision register.
- Every MVP record and relationship has one identified system of record.
- Every mutation has an identified authorization boundary and audit consequence.
- Allow and deny cases are specified for every affected position/Admin combination.
- No physical schema or permission question capable of changing the scaffold remains implicit.

## Phase 1 — Project foundation

Create the implementation baseline:

- React, strict TypeScript, Vite, React Router, npm, and pinned Node LTS;
- the approved feature/domain, route, shared-service, and `src/ui/` folder structure;
- local Supabase configuration and the initial migration/seed/test harness;
- environment validation with strict separation of local, staging, preview, and production values;
- ESLint, Prettier, Vitest, React Testing Library, Playwright, pgTAP, Deno tests, accessibility checks, type checking, and production build commands;
- GitHub Actions pull-request verification and staging deployment baseline;
- Vodafone/Design Flow token delivery through CSS custom properties, CSS Modules, global reset/base styles, and Light/Dark theme plumbing;
- the responsive application shell, routing/error boundary, and only the shared UI primitives immediately needed by the shell and authentication; and
- visibly synthetic seed accounts/data for development and automated permission tests.

### Exit gate

- A clean clone can install dependencies, start local Supabase, reset/seed the database, run the full baseline test suite, and create a production build using documented commands.
- Pull-request CI passes and a non-production placeholder deploys using staging credentials only.
- No secret or production datum exists in committed, local-seed, preview, or staging content.
- Initial shared components use documented tokens, keyboard behavior, tests, and owned Design Flow APIs with zero Astryx runtime dependency.

## Phase 2 — Authentication, Team, and Settings

Implement the identity and administrative foundation:

- sign-in, sign-out, session restoration, mandatory first/reset password change, and inactive-account handling;
- protected account create, temporary-password reset, deactivate, and reactivate Edge Functions;
- Viewer, Designer, Lead, and Manager positions plus independent Admin privilege for Designer, Lead, and Manager, with Viewer + Admin rejected;
- effective-dated Designer → Lead → Manager reporting relationships and position-based default people scopes;
- Team directory with the approved public/internal versus Admin-only fields;
- member administration, Areas/Squads, labels, team timezone, retirement/reactivation, usage disclosure, and administration audit; and
- the auditable first-Admin bootstrap workflow.

### Exit gate

- Public registration is disabled and no privileged key is exposed to the browser.
- First sign-in/reset cannot escape the mandatory password-change flow.
- RLS and Edge Function tests prove every allowed and denied account, hierarchy, list, and setting action.
- Admin privilege changes capability without changing position, reporting line, or default people scope.
- Deactivation preserves history and prevents further access; reactivation restores access without recreating the member.
- Team and Settings pass responsive, keyboard, empty, loading, error, and unauthorized-state checks.

## Phase 3 — Work-item foundation

Implement the core ticket lifecycle:

- ticket creation and editing for the approved creators;
- required Area/Squad, optional labels, one primary assignee, planned start, due date, and one optional Figma URL;
- Backlog, To do, In Progress, In Review, Done, and Paused transitions;
- assignment and status history;
- one active structured blocker with resolve history;
- one-level checklist subtasks and derived completed/total progress;
- comments, archive eligibility, and history preservation;
- the first complete All Tickets list and Work Item detail/timeline; and
- direct accessible Figma actions and the approved row/card behaviors.

### Exit gate

- Create, read, update, transition, reassign, block/resolve, comment, archive, and subtask flows satisfy their permission allow/deny tests.
- Compound domain actions are atomic and produce the required history exactly once.
- Only Backlog, Paused, and Done can be archived, by an authorized actor.
- All Tickets filters/sort/search are URL-backed and responsive, with no inline editing or unsupported bulk/customization behavior.
- The Work Item header, history, Figma behavior, and subtask presentation match the approved specifications.

## Phase 4 — Work logging

Implement actual-work capture and correction:

- ticket work as the default context and standalone visual work as the secondary context;
- one-to-five explicit date rows with one required work type and optional detail per date;
- Sunday–Thursday defaults, manual Friday/Saturday selection, past dates, and no future dates;
- ticket and visual controlled vocabularies, including optional-detail Other;
- audited correction and soft withdrawal without an edit time limit;
- automatic contributor derivation from valid ticket work;
- ticket Active work days, last-worked values, and dependent aggregate recalculation; and
- the Work Item Work Dates grid and integrated activity history.

### Exit gate

- Date validation, weekend override, per-row work types, optional descriptions, and one-to-five limits pass UI and database tests.
- Correction and withdrawal preserve original/audit context and recalculate every affected contributor, ticket, designer, dashboard, and report source value.
- Multiple entries or designers on one ticket date count once for ticket Active work days.
- Standalone visual work remains outside ticket lifecycle/ownership metrics and is available as a separate reporting source.
- Work logging is keyboard-usable and clear on mobile for every authorized position; Viewer remains read-only.

## Phase 5 — Operational experience

Complete the everyday management surfaces:

- final Work Item vertical timeline and five-column actual-date index;
- Dashboard ticket cards, needs-attention, workload-by-person, recent-work, stale-work, and management people signals;
- Planned until and missing-due-date disclosure without availability or capacity claims;
- final position-based people scopes and Lead/Manager alternate-scope controls; and
- minimal in-app notifications, unread state, mark-one/all read, and Work Item deep links.

### Exit gate

- Dashboard values reconcile with controlled source records for every default people scope.
- Admin privilege does not silently replace the underlying position default.
- Leads and Managers can deliberately broaden or change people scope as approved.
- Stale work uses five Sunday–Thursday working days and never uses sign-in recency as a performance signal.
- Notifications fire only for approved events/recipients, exclude self-events, and do not introduce email, push, reminders, mentions, or subscriptions.

## Phase 6 — Reports and exports

Implement the approved reporting layer:

- Tickets, Designers, and Visual Work report tabs;
- default period and people scopes, URL-backed filters, refinements, sorting, and drill-down;
- neutral one-, two-, and multi-designer layouts without ranking or an explicit comparison action;
- centralized, token-styled Recharts bar/line visualizations with accessible summaries/tables;
- ticket summary, ticket activity, designer summary, designer-ticket, and visual-work CSV exports; and
- filter-aware, human-readable Work Item PDF with comments off by default and withdrawn bodies excluded.

### Exit gate

- Every card, chart, table, CSV field, and PDF value reconciles to controlled fixtures and documented formulas.
- Ownership, contribution, active days, ticket-days, and visual work remain distinct and explainable.
- CSV exports contain all matching rows rather than only the visible page and preserve the visible view controls defined by the specification.
- CSV access is limited to Lead, Manager, or Admin privilege; Work Item PDF access follows its approved capability rule.
- Charts remain understandable through their accessible text/table alternative and do not imply productivity scoring.

## Phase 7 — Production hardening and rollout

Complete the approved operating model:

- privacy-scrubbed Sentry integration without session replay;
- encrypted, checksummed R2 backups, retention automation, failure alerts, and a successful restore rehearsal;
- complete staging and manually triggered production delivery workflows;
- pre-migration backup, ordered migrations/Functions/frontend deployment, smoke checks, and failure stop behavior;
- deployment, incident, quota, pause/resume, and recovery runbooks;
- production performance, accessibility, responsive, security, and quota review;
- auditable production bootstrap; and
- staging acceptance, limited production pilot, defect resolution, full-team release, and stabilization.

### Exit gate

- Every production launch gate in `docs/technical-plan.md` is evidenced as passing.
- Restore behavior, including Supabase Auth recovery/reset limitations, is demonstrated rather than assumed.
- A previous known-good application release can be redeployed and a failed migration cannot continue to later delivery stages.
- The pilot group completes one working week without an unresolved security, data-integrity, authentication, or core-workflow blocker.
- Admin operational ownership and Manager organizational responsibility remain distinct in the system and runbooks.

## Definition of done for every implementation slice

A slice is complete only when:

1. Its acceptance behavior and permission cases are explicit.
2. Code, migrations, generated types, tests, and documentation agree.
3. RLS and trusted-server checks prove both allowed and denied paths.
4. Loading, empty, error, unauthorized, responsive, keyboard, and accessible-name behavior is implemented where relevant.
5. Audit/history and derived-data recalculation are covered where relevant.
6. No production secret or real production data is introduced outside production.
7. Required checks and the production build pass.
8. The slice is deployed and verified in staging before it can enter a production release.

## Sequence change rule

A later phase may begin early only for a small enabling task that does not invent or expose unfinished product behavior. Any material reordering must update this document and D-095, explain the dependency change, and preserve every affected exit gate.
