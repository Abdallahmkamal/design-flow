# Settings brief

**Status:** Approved for Phase 2 Slice 2 implementation
**Owning phase:** Phase 2 — Authentication, Team, and Settings

## Purpose

Provide Admin-privileged users with closed portal administration for members/access, Areas/Squads, labels, team timezone, and append-only administration audit.

## Primary users and permissions

- Designer + Admin, Lead + Admin, and Manager + Admin may access Settings.
- Viewer, Designer, Lead, and Manager without Admin are denied; Manager position alone grants no Settings access.
- Viewer + Admin is invalid.

## Entry points

- `/settings` route from an Admin-only shell navigation item.
- Account creation/reset/deactivate/reactivate server operations implemented by the authentication/account-lifecycle slice are dependencies of Members and access UI.

## Primary and secondary actions

- Create member, issue temporary reset, deactivate/reactivate member.
- Change position/Admin/reporting line through `set_member_access`.
- Create/rename/reorder/archive/reactivate Areas/Squads and labels.
- Change team timezone.
- Read administration audit.

## Information hierarchy

1. Settings section navigation.
2. Current administrative state and consequences.
3. Primary action and permission/validation guidance.
4. Append-only audit context.

## Content and fields

Exact fields and controlled values follow `docs/team-settings.md`, `docs/schema-contract.md`, and `docs/operation-contracts.md`. Temporary credentials are displayed once and never persisted, audited, or logged.

## Business rules

- Every mutation uses its approved RPC or Edge Function boundary and caller-stable operation ID.
- Final active Admin protection, Viewer + Admin rejection, effective hierarchy, usage disclosure, archive/reactivate behavior, and audit effects are authoritative.
- Product-controlled statuses, work types, permissions, thresholds, calendar rules, Dashboard definitions, metrics, and exports are not editable.

## Components to reuse, extend, or create

- Reuse Input and Button.
- Phase 2 components: Select, Checkbox, Badge, and DataTable/list.
- Settings section navigation uses native route/anchor links rather than a tab
  widget. Confirmations are in-context panels rather than modal overlays, and
  the closed-team read models do not introduce pagination.
- Every implemented shared component has a source-linked Astryx note marked
  ready and its presentation mappings are recorded in `docs/design-system.md`.

## Desktop layout

- Persistent section navigation with moderately dense administration content and explicit consequences near destructive/restrictive actions.

## Mobile layout

- Sections become a single-column sequence or dedicated pages; forms and confirmations preserve labels, consequences, and action order.

## Responsive transitions

- The section navigation becomes a wrapping horizontal anchor list on narrow
  viewports; forms, confirmations, and data records remain single-column.

## Interaction and keyboard behavior

- Native forms where possible.
- In-context confirmation panels move focus to their heading on entry and
  return focus to the initiating action on cancel or completion. Because they
  do not obscure the page, focus containment and Escape dismissal do not
  apply.
- Reordering must have a keyboard-accessible alternative to drag interaction.

## Loading, empty, no-results, error, disabled, and permission states

- Every section defines scoped loading and retry.
- Empty controlled lists provide an Admin creation action.
- Audit/search zero-results are distinct from empty history.
- Stale confirmation counts and version conflicts require refresh and reconfirmation.
- Unauthorized users receive no Settings data or controls.

## Long-content and overflow behavior

- Emails, names, audit values, and usage disclosures wrap or expand without hiding actions.
- Temporary credentials remain selectable/copyable during their one-time display.

## Success feedback

- Confirm the exact completed operation without implying that an independent operation succeeded.
- Account lifecycle partial/fail-closed outcomes retain precise retry guidance.

## Analytics or audit implications

Every approved Settings mutation writes the contracted append-only administration audit event; credentials never appear in audit payloads.

## Astryx reference patterns

- [Input](../../references/astryx/input.md) and [Button](../../references/astryx/button.md) are ready.
- [Table and dense list](../../references/astryx/table.md),
  [Select](../../references/astryx/select.md),
  [Checkbox](../../references/astryx/checkbox.md), and
  [Badge](../../references/astryx/badge.md) are Phase 2 ready.
- Modal, Tabs, and Pagination are not implemented by this slice.

## Design Flow reference screens or components

- `docs/team-settings.md`
- `docs/permission-matrix.md`
- `docs/operation-contracts.md`

## Acceptance criteria

- Only Admin-privileged eligible positions access Settings.
- Every account, hierarchy, controlled-list, timezone, and audit behavior matches its contract and proves allowed/denied server paths.
- Desktop/mobile, keyboard, state, confirmation, long-content, and staging behavior must pass before the Settings slice is complete.

## Open questions

No product or presentation question is open for Phase 2 Slice 2.
