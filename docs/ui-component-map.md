# Phase 3 UI component map

**Status:** Phase 3 complete — staging acceptance verified on 2026-07-22

**Scope:** Phase 3 Work-item Foundation only

**Prepared:** 2026-07-21

## Authority and boundaries

This map applies the approved behavior in `build-plan.md`, `all-tickets.md`,
`work-item.md`, `permission-matrix.md`, `operation-contracts.md`, and the Phase
3 screen briefs. Vodafone owns color and typography. The ready Astryx notes
under `references/astryx/` own the preferred remaining component presentation
and behavior.

All components are implemented and owned by Design Flow. Astryx packages,
source, styles, and public APIs are not imported, wrapped, or copied.

## Shared components reused unchanged

| Component | Phase 3 use | Constraints |
| --- | --- | --- |
| `Button` | Submit/cancel, filter actions, lifecycle actions, confirmations, subtask movement | Visible labels remain required; no generic icon-only Button mode |
| `Input` | Title, search, dates through native `type="date"`, and Figma URL | Visible label by default; server/client errors remain associated with the field |
| `Select` | Single-choice status, assignee, view, relationship, attention filters, and sort controls | Bounded choices only; multi-select filters do not overload Select |
| `Checkbox` | Status, Area/Squad, label, and people multi-select groups; incomplete-subtask acknowledgement | Use labelled `fieldset` groups where several values share a question |
| `Badge` | Workflow status, Blocked, Archived, stale/due attention, labels, and subtask progress | Workflow colors use the six approved `product/status/*` aliases; Blocked and Archived stay separate |
| `SkipLink` | Existing shell bypass link on every Phase 3 route | No Phase 3 change |

## Shared component extension

### `DataTable`

Phase 3 extends the existing component without changing its semantic desktop
table baseline.

Proposed public additions:

- optional `renderMobileCard(row)` for feature-owned structured card content;
- optional `onRowActivate(row)` for pointer activation from otherwise
  noninteractive row/card space; and
- optional `rowActivationLabel(row)` used only for visible pointer affordance
  and test naming, never to turn `tr` or `li` into a button.

Rules:

- Ticket ID/title remain native router links and the only keyboard navigation
  path for the record.
- Pointer activation ignores events originating from links, buttons, form
  controls, or popover content.
- Desktop keeps `table`/caption/header/body/cell semantics. Mobile remains a
  semantic list and uses the purpose-built ticket hierarchy supplied by the
  feature.
- The desktop and mobile branches expose only the visible branch below/above
  the existing `48rem` shell breakpoint.
- Sorting and pagination stay controlled by the feature and server read model;
  DataTable does not sort, filter, paginate, select, or mutate rows.
- Existing generic mobile definition-list rendering remains the default for
  Team and Settings, preserving Phase 2 callers.

Reference: `references/astryx/table.md`.

## New shared components

### `Textarea`

Purpose: native multi-line plain-text entry for Work Item descriptions, blocker
notes/reasons, and comments.

Proposed public API:

- required `label`;
- optional `description`, `error`, and `hideLabel`;
- native textarea attributes including `rows`, `required`, and `readOnly`;
- forwarded native textarea ref; and
- default `rows={3}` with vertical resize.

It reuses Input field anatomy and state mappings. Phase 3 adds no autosize,
rich-text, mentions, Markdown preview, or character counter.

Reference: `references/astryx/textarea.md`.

### `Tooltip`

Purpose: concise noninteractive hover/focus help, initially for the independent
Figma icon link.

Proposed public API:

- one focusable `children` trigger;
- required concise string `content`;
- optional logical placement, defaulting above; and
- optional controlled visibility only for tests and composed components.

The trigger supplies its own accessible name. Tooltip supplies description,
`200ms` hover delay, Escape dismissal, hoverable surface behavior, and
viewport-safe placement. Interactive tooltip children are rejected.

Reference: `references/astryx/tooltip.md`.

### `Popover`

Purpose: small focus-managed supplementary content, initially the contributor
name list.

Proposed public API:

- required native-button trigger;
- required dialog `label` and content;
- optional logical placement/alignment;
- optional controlled `open` and `onOpenChange`; and
- an exposed close callback for the component's visible close action.

It owns expanded/control ARIA, focus entry/trap/return, Escape and light
dismiss, collision-safe positioning, and visible close. It is not a Menu,
Tooltip, Modal, or Drawer.

Reference: `references/astryx/popover.md`.

### `Pagination`

Purpose: numbered navigation for a known, server-paginated result count.

Proposed public API:

- required one-based `page`, positive `pageSize`, and nonnegative `totalCount`;
- required `onPageChange(page)`;
- optional landmark `label`, loading, and disabled state; and
- no page-size selection in Phase 3.

It renders visible Previous/Next actions, first/last boundaries, one sibling
around the current page, inert ellipses, `aria-current`, and a polite page
announcement. It is omitted for zero or one page.

Reference: `references/astryx/pagination.md`.

## Feature-owned compositions

| Owner | Composition | Shared dependencies |
| --- | --- | --- |
| `features/work-items/components/FigmaLink` | Native external anchor, icon, destination-specific accessible name, new-tab announcement, Tooltip | Tooltip |
| `features/work-items/components/WorkItemStatusBadge` | Six workflow mappings plus separate Blocked/Archived attention | Badge |
| `features/work-items/components/WorkItemForm` | Create/edit field layout and error summary; returns a reusable creation result | Input, Textarea, Select, Checkbox, Button |
| `features/work-items/components/TicketFilters` | URL-backed search, view, people/relationship, multi-select groups, attention filters, sort, clear-all | Input, Select, Checkbox, Button |
| `features/work-items/components/TicketResults` | Desktop ticket table and mobile ticket cards over one read model | DataTable, Badge, Popover, Tooltip, Pagination |
| `features/work-items/components/ContributorPopover` | Labelled contributor list with explicit close | Popover |
| `features/work-items/components/BlockerPanel` | Prominent current blocker plus create/resolve in-context forms | Textarea, Input, Button |
| `features/work-items/components/SubtaskList` | Checklist, add/rename, complete/reopen, withdraw, keyboard move-up/down | Checkbox, Input, Button |
| `features/work-items/components/LifecycleTimeline` | Chronological Phase 3 events only | Badge where a status label is useful |
| `features/work-items/components/CommentThread` | Chronological visible comments, edited/withdrawn markers, author/moderator actions | Textarea, Button |

Feature components map RPC/read payloads through the feature API/domain layer;
they never call Supabase directly from shared UI components.

## Route ownership

| Route | Thin route responsibility | Feature surface |
| --- | --- | --- |
| `/work-items` | Parse URL, invoke list query, set document title | All Tickets page |
| `/work-items/new` | Route guard and safe return target | Ticket creation page |
| `/work-items/:displayId` | Validate display ID, load authoritative detail | Work Item page |
| `/work-items/:displayId/edit` | Validate display ID, route guard, load edit snapshot | Edit Work Item page using WorkItemForm |

## State and permission ownership

- Read RPC capability flags drive action presentation; the browser never
  derives permission from position text alone.
- Viewer sees read-only surfaces and no mutating controls. A directly entered
  create/edit route shows a permission state before any mutation call.
- Inactive and password-restricted principals are handled by the existing auth
  boundary. Rejected Viewer+Admin is never treated as a valid UI combination.
- Loading, empty, no-results, error, unauthorized, conflict, archived, and
  long-content states are owned by each feature screen brief.
- Mutation forms retain their draft on validation, network, and conflict
  failures. Success always refreshes the authoritative read model.

## Explicitly deferred

- Modal, Drawer, Tabs, Avatar, Radio, and Work Dates shared components.
- Log Work, work-log correction/withdrawal, the Work Dates grid, and the final
  integrated work-history timeline (Phase 4/5).
- Notification inbox (Phase 5), recorded-activity deep link, Work Item PDF, and
  report exports (Phase 6).
- Inline ticket editing, bulk actions, saved views, customizable columns,
  attachments, generic links, rich text, and drag-and-drop reordering.

Phase 3 uses full-page create/edit routes and accessible in-context confirmation
panels. No deferred component is represented by a nonfunctional control.

## Readiness acceptance

- Every shared addition has a Design Flow-owned API, ready Astryx note,
  Vodafone color/type mapping, keyboard contract, and responsive contract.
- All three briefs reference only the components above.
- No Phase 4+ interaction is needed to complete a Phase 3 journey.
- Approval of this map approves the pending Phase 3 mappings in
  `docs/design-system.md`; implementation still must verify each mapping with
  component and browser tests.

## Verification evidence

- The complete synthetic Phase 3 staging acceptance matrix passed on
  2026-07-22 against this map and the three approved Work-item briefs.
- Desktop and mobile checks confirmed the owned table/card, Textarea, Tooltip,
  Popover, Pagination, form, and lifecycle-control mappings without importing
  an Astryx runtime package or exposing a deferred control.
- Viewer staging checks confirmed read-only list/detail presentation, direct
  creation denial, and absence of mutating controls.

## Open questions

None. Any material change to component ownership, new shared primitives, or a
deferred capability requires a new readiness decision before implementation.

---

# Phase 4 UI component map — Work Logging

**Status:** Phase 4 complete — staging acceptance verified on 2026-07-22
**Scope:** Phase 4 Work Logging only
**Prepared:** 2026-07-22

## Authority and boundaries

This addition applies `docs/ui/log-work-brief.md` to the approved Phase 4
contracts. Vodafone owns color/typography; ready Astryx notes own the remaining
component baseline. Every component remains Design Flow-owned; no Astryx
package, source, style, or API is introduced.

## Shared components reused unchanged

| Component | Phase 4 use | Constraint |
| --- | --- | --- |
| `Button` | Submit, add/remove date, Apply to all, launch, retry, correction/withdraw confirmation | One visible primary submit; destructive withdrawal retains explicit confirmation |
| `Input` | Native date, ticket search, optional short detail | Native date preserves platform keyboard/mobile behavior; future-date validation is server authoritative |
| `Textarea` | Optional long detail and blocker reason | Native multiline editing and labelled validation |
| `Select` | Work type, on-behalf `worked_by`, optional independently authorized status, Area/Squad | Only bounded choices; it does not implement ticket search |
| `Checkbox` | Optional blocker selection/confirmation where a boolean is required | No context-mode toggle or mutually exclusive use |
| `Badge` | Ticket status and compact work-type metadata | Status remains distinct from blocker state |
| `Tooltip` | Concise helper text only | No required information or form interaction in a tooltip |

## New shared component: `Avatar`

Purpose: compact, noninteractive person marker in Work Dates summaries.

Proposed public API: required accessible `name`; optional approved `imageUrl`;
optional `size` limited to `small` for Phase 4; and decorative mode only beside
the same visible person name. It does not expose presence, status, upload,
click, group, or menu behavior.

Reference: `references/astryx/avatar.md`. The source confirms initial/image
fallback and group-overflow purpose. The proposed `28px`/full-radius/no-overlap
fallback is explicitly pending approval and must be added centrally to
`docs/design-system.md` before implementation.

## Feature-owned compositions

| Owner | Composition | Shared dependencies |
| --- | --- | --- |
| `features/work-logs/LogWorkForm` | Ticket-default/Visual-Work-secondary form, draft retention, operation-outcome presentation | Button, Input, Textarea, Select, Checkbox, Badge |
| `features/work-logs/TicketPicker` | Labelled search plus explicit ticket-result buttons and selected summary | Input, Badge, Button |
| `features/work-logs/WorkDateRows` | One-to-five actual-date rows, per-row type/detail, add/remove/apply controls | Input, Select, Textarea, Button |
| `features/work-items/WorkDatesGrid` | Actual-date index linking to timeline, initials/count and type summary | Avatar, Badge |
| `features/work-items/WorkLogTimelineEvent` | Valid work, correction, and withdrawal event content | Badge, Button |

No generic Typeahead, Calendar, AvatarGroup, Modal, Drawer, Radio, Tab, or
reporting component is added. TicketPicker is a bounded feature composition;
it is not a reusable ARIA-combobox surface.

## Route and state ownership

| Route | Thin responsibility | Feature surface |
| --- | --- | --- |
| `/work-logs/new` | Read optional preselected ticket/return marker; route guard | Log Work form |
| `/work-logs/:batchId/edit` | Validate batch ID, load authoritative editable batch, route guard | Work-log correction form |
| `/work-items/:displayId` | Continue thin detail composition | Work Dates grid and work-log timeline events |

The feature/domain layer owns operation IDs, API payload shaping, authoritative
refresh, query invalidation, and preserved drafts. Shared components never call
Supabase. Capability flags own control visibility; the client never infers
authority from position labels.

## Readiness acceptance and deferrals

On approval, add the Avatar fallback mapping to `docs/design-system.md`, mark
`references/astryx/avatar.md` ready, and implement only the listed Phase 4
surfaces. Verify loading, empty/no-result, error, conflict, disabled,
permission, long-content, keyboard, desktop/mobile, and Light/Dark behavior.

Deferred: notifications, recorded-activity deep links, Work Item PDF, report
exports, dashboard/report pages, generic attachment controls, and all Phase
5/6 controls. No deferred item receives a disabled or placeholder control.

## Verification evidence

- Synthetic staging acceptance on 2026-07-22 verified the owned Log Work form,
  ticket picker, actual-date rows, Work Dates presentation, correction form,
  and submitted/corrected/withdrawn timeline events against this map.
- Ticket withdrawal removed valid Work Dates and contributor/aggregate values
  without changing planned dates. Standalone Visual Work remained outside the
  ticket lifecycle and ownership surfaces.
- Automated desktop/mobile and axe checks passed without an Astryx runtime
  package, later-phase control, or direct browser write path. The Colima-backed
  role/RLS suite confirmed every valid position/Admin overlay and all required
  denial states.

## Open questions

None. Any material change to component ownership, shared primitives, or a
deferred capability requires a new readiness decision before implementation.
