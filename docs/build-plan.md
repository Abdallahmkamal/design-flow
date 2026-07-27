# Design Flow MVP build plan

**Status:** Approved  
**Decision:** D-095  
**Last updated:** 2026-07-26 — D-102 records approved post-MVP v1.1 planning without changing MVP implementation order

This document defines the required implementation order and completion gates for the Design Flow MVP. Build vertically, keep the application usable at each checkpoint, and do not begin a dependent phase while its prerequisite contracts or behavior remain unresolved.

## Delivery principles

- Complete Phase 0 in the local Codex project before scaffolding application code.
- Build the Design Flow component library just in time for approved product slices; do not create a speculative catalogue of every possible component upfront.
- Add or update the relevant distilled Astryx reference before implementing a shared component. The note must cover both engineering behavior and verifiable non-color presentation, or identify explicit gaps and approved fallbacks.
- Every persisted feature ships with its migration, RLS, permission tests, generated types, audit/history behavior, and representative seed/test data in the same slice.
- Every interface slice includes responsive, keyboard, loading, empty, error, and unauthorized behavior rather than deferring them to a final polish phase.
- Reports and exports are built only after their source records and derived formulas are stable and tested.
- Notifications are built only after the domain events that produce them are stable.
- A cross-surface launch path may preserve client draft state, but it never collapses independently authorized domain operations into one RPC or transaction.
- A phase may be split into smaller pull requests, but its exit gate remains unchanged.

## UI documentation and readiness gates

The stable cross-product direction lives in [ui-direction.md](ui-direction.md). Feature-specific UI decisions are recorded in short screen or flow briefs created from [ui/screen-brief-template.md](ui/screen-brief-template.md); briefs apply approved product behavior, Vodafone color/typography, and verified Astryx presentation without becoming unsupported pixel specifications.

Every UI-bearing feature phase must pass this readiness gate:

- An approved screen or flow brief exists before implementation begins.
- Every reused, extended, or new shared component has a source-linked Astryx note marked ready for its required behavior and non-color presentation; unavailable guidance and approved Design Flow fallbacks are explicit.
- Existing Design Flow components are identified for reuse or extension before a new component is proposed.
- Required desktop and mobile behavior, including responsive transitions, is documented.
- Loading, empty, error, no-results, permission, disabled, and long-content states are documented where relevant.
- Keyboard and accessibility behavior is documented.
- The implemented result is verified in staging against the approved brief before the phase is considered complete.

D-095 defines eight implementation phases numbered Phase 0 through Phase 7. The cross-product UI review therefore belongs to the existing Phase 7 production-hardening gate; no separate Phase 8 is introduced and no implementation phase is added or renumbered. The feature sequence remains Foundation → Authentication/Team/Settings → Work items → Work logging → Operational experience → Reports → Hardening.

## Phase 0 — Schema and security contract

**Completed:** 2026-07-19
**Amended:** 2026-07-19 — D-097 clarifies independent Log Work/create/status boundaries without changing the physical schema

Finalize the implementation contracts before scaffolding:

- physical Postgres tables, columns, types, indexes, constraints, and relationships;
- stable internal codes and initial seed values for product-controlled vocabularies;
- archive, withdrawal, effective-date, and append-only history behavior;
- RLS capability matrix for Viewer, Designer, Lead, and Manager, repeated with and without independent Admin privilege for every valid combination, with Viewer + Admin specified and tested as an invalid account state;
- browser, Postgres RPC, and Edge Function boundaries for every mutation;
- RPC transaction contracts for compound ticket, blocker, assignment, status, and work-log actions;
- client orchestration contracts for Log Work paths that launch independent ticket creation or status transition operations;
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

**Amended:** 2026-07-19 — D-099 requires visual revalidation before Phase 2 UI implementation

**Database boundary amended:** 2026-07-20 — D-100

Phase 1 establishes the complete physical database foundation: all contracted
tables, constraints, indexes, controlled reference rows, RLS/read surfaces,
authorization helpers, synthetic principal fixtures, generated database types,
and structural/read-permission tests. Feature mutation RPCs and their
write-effect, atomicity, idempotency, and feature-specific permission tests are
implemented with their owning vertical slices in Phases 2–4. This staging does
not change the approved operation contracts or permit direct browser writes
that bypass them.

### UI documentation gate

- Create and approve `docs/ui-direction.md` before continuing feature UI implementation.
- This direction gate does not expand the just-in-time component scope or authorize screen-by-screen design work in Phase 1.
- Before Phase 2 UI implementation, refresh the Astryx notes for the application shell, Button, Input, and any supporting foundation pattern to cover verifiable non-color presentation. Revalidate the existing Phase 1 UI against those notes while retaining Vodafone color and typography.

Create the implementation baseline:

- React, strict TypeScript, Vite, React Router, npm, and pinned Node LTS;
- the approved feature/domain, route, shared-service, and `src/ui/` folder structure;
- local Supabase configuration and an initial complete physical-schema,
  RLS/read-surface, seed, generated-type, and database-test foundation;
- environment validation with strict separation of local, staging, preview, and production values;
- ESLint, Prettier, Vitest, React Testing Library, Playwright, pgTAP, Deno tests, accessibility checks, type checking, and production build commands;
- GitHub Actions pull-request verification and staging deployment baseline;
- Vodafone color/typography and source-traceable Astryx presentation mappings through CSS custom properties, CSS Modules, global reset/base styles, and Light/Dark theme plumbing;
- the responsive application shell, routing/error boundary, and only the shared UI primitives immediately needed by the shell and authentication; and
- visibly synthetic seed accounts/data for development and automated permission tests.

### Exit gate

- A clean clone can install dependencies, start local Supabase, reset/seed the database, run the full baseline test suite, and create a production build using documented commands.
- The initial migration creates every contracted physical table with its
  constraints, indexes, RLS, read exposure, authorization helpers, and stable
  reference values; generated types match a clean reset.
- Structural invariants and all applicable read allow/deny cases pass for the
  seven valid principals, inactive/password-restricted states, and the rejected
  Viewer + Admin state. Mutation-path tests remain required in their owning
  feature phases before those operations are exposed.
- Pull-request CI passes and a non-production placeholder deploys using staging credentials only.
- No secret or production datum exists in committed, local-seed, preview, or staging content.
- Initial shared components use Vodafone color/typography, verified Astryx-aligned non-color presentation, documented keyboard behavior, tests, and owned Design Flow APIs with zero Astryx runtime dependency.
- `docs/ui-direction.md` is approved and agrees with the design-system, UI-architecture, product, and decision-register authorities.
- The shell, Button, Input, and supporting Phase 1 presentation aliases pass the D-099 Astryx fidelity review; any unavailable official measurement or necessary deviation is documented before Phase 2 UI implementation.

## Phase 2 — Authentication, Team, and Settings

### UI readiness gate

Before Phase 2 UI implementation, create and approve short briefs for Authentication, Team, Settings, and the shared application shell. Each brief must satisfy the common UI readiness gate above. Because Phase 1 already permits a minimal shell baseline, the shared-shell brief must be approved before further shell refinement or Phase 2 feature integration; it does not require speculative shell rework during this documentation update.

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
- Authentication, Team, Settings, and shared-shell staging behavior is verified against the approved briefs.

## Phase 3 — Work-item foundation

### UI readiness gate

Before Phase 3 UI implementation:

- create and approve `docs/ui-component-map.md`; and
- create and approve short briefs for ticket creation, All Tickets, and Work Item.

The component map and each brief must satisfy the common UI readiness gate above.

Implement the core ticket lifecycle:

- ticket creation and editing for the approved creators, with a reusable creation result that later launch contexts can select without submitting another domain operation;
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
- Ticket creation returns the canonical Work Item identity without creating work-log or non-Backlog status effects.
- Compound domain actions are atomic and produce the required history exactly once.
- Only Backlog, Paused, and Done can be archived, by an authorized actor.
- All Tickets filters/sort/search are URL-backed and responsive, with no inline editing or unsupported bulk/customization behavior.
- The Work Item header, history, Figma behavior, and subtask presentation match the approved specifications.
- Ticket creation, All Tickets, and Work Item staging behavior is verified against the approved briefs and component map.

## Phase 4 — Work logging

### UI readiness gate

Before Phase 4 UI implementation, create or update the Log Work brief. It must cover ticket selection, optional independently authorized status change, inline Create New Ticket, preserved unfinished-draft state, and standalone Visual Work, and it must satisfy the common UI readiness gate above.

Implement actual-work capture and correction:

- ticket work as the default context and standalone visual work as the secondary context;
- one-to-five explicit date rows with one required work type and optional detail per date;
- Sunday–Thursday defaults, manual Friday/Saturday selection, past dates, and no future dates;
- ticket and visual controlled vocabularies, including optional-detail Other;
- a ticket-mode Create New Ticket path that preserves the unfinished Log Work draft and selects the independently created ticket on return;
- an optional ticket status change that runs only after successful work-log submission through the independent transition operation and its permissions;
- audited correction and soft withdrawal without an edit time limit;
- automatic contributor derivation from valid ticket work;
- ticket Active work days, last-worked values, and dependent aggregate recalculation; and
- the Work Item Work Dates grid and integrated activity history.

### Exit gate

- Date validation, weekend override, per-row work types, optional descriptions, and one-to-five limits pass UI and database tests.
- Create New Ticket preserves every existing draft value, resumes the unfinished form with the returned ticket selected, and remains independently authorized and idempotent.
- Optional status is absent or denied when the caller lacks the existing transition capability; it cannot inherit authority from permission to log work or a prospective contribution.
- Work-log and optional-status outcomes are tested independently: a failed log prevents transition, while a failed transition never rolls back a successful log and exposes a precise retry state.
- Creation, work submission, and status transition retain separate history, audit, notification, validation, and operation IDs with no combined RPC.
- Correction and withdrawal preserve original/audit context and recalculate every affected contributor, ticket, designer, dashboard, and report source value.
- Multiple entries or designers on one ticket date count once for ticket Active work days.
- Standalone visual work remains outside ticket lifecycle/ownership metrics and is available as a separate reporting source.
- Work logging is keyboard-usable and clear on mobile for every authorized position; Viewer remains read-only.
- Ticket and standalone Visual Work staging behavior is verified against the approved Log Work brief.

## Phase 5 — Operational experience

### UI readiness gate

Before Phase 5 UI implementation, create and approve short briefs for Dashboard, Notifications, and History. Each brief must satisfy the common UI readiness gate above.

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
- Dashboard, Notifications, and History staging behavior is verified against the approved briefs.

## Phase 6 — Reports and exports

### UI readiness gate

Before Phase 6 UI implementation, create and approve short briefs for Reports and export experiences. Each brief must satisfy the common UI readiness gate above.

Implement the approved reporting layer:

- Tickets, Designers, and Visual Work report tabs;
- default period and people scopes, URL-backed filters, refinements, sorting, and drill-down;
- neutral one-, two-, and multi-designer layouts without ranking or an explicit comparison action;
- a single-person, period-filtered recorded ticket activity table across all tickets, plus the one-person All Tickets deep link;
- centralized, token-styled Recharts bar/line visualizations with accessible summaries/tables;
- ticket summary, ticket activity, designer summary, designer-ticket, and visual-work CSV exports; and
- filter-aware, human-readable Work Item PDF with comments off by default and withdrawn bodies excluded.

### Exit gate

- Every card, chart, table, CSV field, and PDF value reconciles to controlled fixtures and documented formulas.
- Ownership, contribution, active days, ticket-days, and visual work remain distinct and explainable.
- The single-person recorded activity table reconciles every visible row to valid work-log sources, preserves `worked_by` credit separately from `logged_by` submission, and excludes withdrawn entries.
- CSV exports contain all matching rows rather than only the visible page and preserve the visible view controls defined by the specification.
- CSV access is limited to Lead, Manager, or Admin privilege; Work Item PDF access follows its approved capability rule.
- Charts remain understandable through their accessible text/table alternative and do not imply productivity scoring.
- Reports and export staging behavior is verified against the approved briefs.

## Phase 7 — Production hardening and rollout

### Cross-product UI review gate

During Phase 7, perform and evidence a cross-product review for UI consistency, responsive behavior, accessibility, and required-state coverage. Resolve material inconsistencies against the approved direction, component map, screen briefs, and product contracts before rollout.

Complete the approved operating model:

- no external client telemetry or error-ingestion dependency; use the approved fail-safe UI and existing Supabase/GitHub/Cloudflare operational evidence;
- provider-agnostic encrypted/checksummed backups, Admin-controlled offline storage, explicit retention evidence, and a successful isolated restore rehearsal;
- complete staging and manually triggered production delivery workflows;
- independently verified pre-migration backup evidence, ordered migrations/Functions/frontend deployment, smoke checks, and failure stop behavior;
- deployment, incident, quota, pause/resume, and recovery runbooks;
- production performance, accessibility, responsive, security, and quota review;
- auditable production bootstrap; and
- staging acceptance, limited production pilot, defect resolution, full-team release, and stabilization.

### Exit gate

- Every production launch gate in `docs/technical-plan.md` is evidenced as passing.
- The Admin-controlled offline destination is named and a production-source encrypted backup is restored successfully in isolation; until then production bootstrap/pilot/release is blocked.
- Restore behavior, including Supabase Auth recovery/reset limitations, is demonstrated rather than assumed.
- A previous known-good application release can be redeployed and a failed migration cannot continue to later delivery stages.
- The pilot group completes one working week without an unresolved security, data-integrity, authentication, or core-workflow blocker.
- Admin operational ownership and Manager organizational responsibility remain distinct in the system and runbooks.
- The cross-product UI consistency, responsive, accessibility, and state-coverage review is complete with no unresolved release-blocking issue.

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

# Post-MVP Product Enhancements (v1.1 Planning)

These D-102 initiatives are intentionally deferred until after MVP completion.
They are planning decisions only and do not alter the Phase 0–7 contracts,
current schema, authentication, permissions, or Phase 6 implementation.

## Authentication Improvements

- Move from email-as-username presentation to username-based login while
  remaining compatible with the authentication provider.
- Reduce the password minimum from twelve characters to eight and remove
  unnecessary complexity requirements.
- Review onboarding and password-reset usability as one coherent flow.

## User Profile Improvements

- Allow editable display names while preserving immutable internal identifiers.
- Keep an audit trail for every display-name change.
- Support self-service editing and an administrator correction capability with
  clear attribution.

## Official Demo Data Generator

- Generate deterministic, conspicuously synthetic data directly from code.
- Provide a repeatable seed command for realistic UX organizations, Dashboard,
  Reports, exports, screenshots, and demo environments.
- Support local and staging only, with a production safety guard.
- Follow the planned scale and behavior in `docs/testing/demo-dataset.md`.

## UI Modernization

Run a complete Figma-first redesign after MVP covering the application shell,
navigation, Dashboard, ticket list, ticket details, Log Work, Reports,
responsive layouts, accessibility review, and design-system refinement. The
redesign must start from the proven product behavior rather than silently
changing workflows while restyling them.

## Ticket Experience Improvements

- Add an inline ticket drawer or side panel for faster list-to-detail
  navigation and reduced context switching.
- Preserve the dedicated Work Item page where full-page context remains useful.

## General UX Improvements

Reserve a v1.1 discovery track for pilot findings, including onboarding,
settings, workflow refinements, empty states, and accessibility polish. Each
accepted change still requires its own behavior, permission, accessibility, and
verification contract before implementation.

## Rationale

These initiatives affect authentication, navigation, UI architecture, testing,
and user workflows across multiple surfaces. Deferring them until after MVP
reduces implementation churn, allows the architecture to stabilize, and lets
the redesign build on a proven functional foundation.
