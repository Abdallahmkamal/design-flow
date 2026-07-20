# Team directory brief

**Status:** Approved for Phase 2 Slice 2 implementation
**Owning phase:** Phase 2 — Authentication, Team, and Settings

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

## Open questions

No product or presentation question is open for Phase 2 Slice 2.
