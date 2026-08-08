# Team directory brief

**Status:** Phase 2 complete — staged acceptance verified 2026-07-21
**Owning phase:** Phase 2 — Authentication, Team, and Settings

> **Team-ready amendment (2026-08-08):** This is historical MVP verification evidence. D-110 removes Team as a visible route/navigation module in Slice 1 while retaining the safe profile/hierarchy read and privacy contracts for Settings, authorization, and reporting.

## Purpose

Give every active user a factual directory of active people, organizational position, separate Admin privilege, and current reporting relationship without exposing account-support details or performance signals.

## Primary users and permissions

- Every active Viewer, Designer, Lead, and Manager may read the directory.
- Admin privilege does not add public directory fields.
- Inactive, unauthenticated, and password-restricted users are denied.

## Entry points

- `/team` from the authenticated application shell.

## Primary and secondary actions

- Search and filter active people when implemented.
- Open Settings member administration only from a separately authorized Admin control.
- The directory itself has no account mutation.

## Information hierarchy

1. Display name.
2. Organizational position.
3. Separate Admin badge when applicable.
4. `Reports to` relationship.

## Content and fields

- Display name, position, Admin badge, and Reports to.
- Do not show work email, last sign-in, authentication state, password actions, workload metrics, or designer rankings.

## Business rules

- Active people only.
- Designer reports to Lead; Lead reports to Manager; Manager and Viewer show no supervisor in the MVP.
- Reporting groups are filter presets, not access boundaries.

## Components to reuse, extend, or create

- Reuse Input for search and Button for authorized Settings navigation.
- Phase 2 components: Badge and responsive DataTable/list composition.
- The relevant Astryx Badge and dense-list/Table notes are source-reviewed and
  their presentation mappings are recorded in `docs/design-system.md`.

## Desktop layout

- A moderately dense directory list or semantic table with clear person, position, Admin, and reporting columns.

## Mobile layout

- Structured person records preserve the same information order and action accessibility without a compressed desktop table.

## Responsive transitions

- At the existing shell mobile breakpoint, the desktop semantic table becomes
  a structured list of records with the same visible field order.

## Interaction and keyboard behavior

- Search and filters use native form semantics.
- Every row/record follows a predictable reading order; no hover-only details.

## Loading, empty, no-results, error, disabled, and permission states

- Loading preserves directory context.
- Empty means no active people and is operationally exceptional.
- No results offers Clear filters.
- Errors provide retry.
- Unauthorized users do not receive directory data.

## Long-content and overflow behavior

- Names and reporting relationships wrap without hiding position/Admin meaning.

## Success feedback

Search/filter changes update the visible directory without implying a domain mutation.

## Analytics or audit implications

None for directory reads.

## Astryx reference patterns

- [Input](../../references/astryx/input.md) — ready search behavior.
- [Button](../../references/astryx/button.md) — ready authorized navigation behavior.
- [Table and dense list](../../references/astryx/table.md) — Phase 2 ready.
- [Badge](../../references/astryx/badge.md) — Phase 2 ready.

## Design Flow reference screens or components

- `public.team_directory` database view.
- `docs/team-settings.md`.

## Acceptance criteria

- Directory fields and privacy match `docs/team-settings.md`.
- Viewer + Admin is never rendered as a valid state.
- Desktop/mobile, keyboard, empty, loading, error, no-results, and unauthorized behavior must pass before the Team slice is complete.

## Verification evidence

- The complete synthetic Phase 2 staging acceptance matrix passed on
  2026-07-21. Viewer, Designer, Lead, and Manager personas saw only active
  people and the approved display name, position, separate Admin badge, and
  `Reports to` fields; email, authentication, support, and performance data
  remained absent.
- Adding or removing Admin privilege from eligible positions did not change
  position, reporting line, or default people scope. Viewer + Admin remained
  invalid, and inactive, password-restricted, and unauthorized principals did
  not receive directory data.
- Desktop and mobile directory layouts, keyboard order, loading, empty,
  no-results, retry/error, long-content, and unauthorized states passed the
  approved brief. Only conspicuously synthetic staging records were used.

## Open questions

No product or presentation question is open for Phase 2 Slice 2.
