# Settings brief

**Status:** Approved behavior brief; implementation deferred from `feature/auth-account-lifecycle`
**Owning phase:** Phase 2 — Authentication, Team, and Settings

## Purpose

Provide Admin-privileged users with closed portal administration for members/access, Areas/Squads, labels, team timezone, and append-only administration audit.

## Primary users and permissions

- Designer + Admin, Lead + Admin, and Manager + Admin may access Settings.
- Viewer, Designer, Lead, and Manager without Admin are denied; Manager position alone grants no Settings access.
- Viewer + Admin is invalid.

## Entry points

- Future `/settings` route from an Admin-only shell navigation item.
- Account creation/reset/deactivate/reactivate server operations implemented by the authentication/account-lifecycle slice are future dependencies of Members and access UI.

## Primary and secondary actions

- Create member, issue temporary reset, deactivate/reactivate member.
- Change position/Admin/reporting line through `set_member_access` in its future owning slice.
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

- Expected future reuse: Input and Button.
- Expected future components: Select, Checkbox, Badge, Tabs, Modal/confirmation, Table/list, and possibly pagination.
- Implementation is blocked until every required component has a source-linked Astryx note marked ready and its presentation mappings are recorded in `docs/design-system.md`.

## Desktop layout

- Persistent section navigation with moderately dense administration content and explicit consequences near destructive/restrictive actions.

## Mobile layout

- Sections become a single-column sequence or dedicated pages; forms and confirmations preserve labels, consequences, and action order.

## Responsive transitions

- Exact transitions are finalized only after the relevant Tabs, Modal, Select, and Table/list notes are ready.

## Interaction and keyboard behavior

- Native forms where possible.
- Future modal/confirmation flows must define focus entry, containment, Escape behavior, dismissal, and focus return before implementation.
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
- [Modal](../../references/astryx/modal.md) and [Table](../../references/astryx/table.md) are scaffolded and not implementation-ready.
- Select, Checkbox, Badge, Tabs, and Pagination notes do not yet exist and are required before their components are implemented.

## Design Flow reference screens or components

- `docs/team-settings.md`
- `docs/permission-matrix.md`
- `docs/operation-contracts.md`

## Acceptance criteria

- Only Admin-privileged eligible positions access Settings.
- Every account, hierarchy, controlled-list, timezone, and audit behavior matches its contract and proves allowed/denied server paths.
- Desktop/mobile, keyboard, state, confirmation, long-content, and staging behavior must pass before the future Settings slice is complete.

## Open questions

No product question is open. Component-reference readiness and the excluded `set_member_access`/Settings implementation remain future work.
