# Phase 3 UI component map

**Status:** Phase 3 complete — staging acceptance verified on 2026-07-22

**Scope:** Phase 3 Work-item Foundation only

**Prepared:** 2026-07-21

> **Team-ready amendment (2026-08-08):** This map remains the verified MVP inventory. D-109 and the nine-slice build plan govern new/migrated components: Design Flow-owned shadcn source and Tailwind may extend or replace legacy entries slice by slice, with Vodafone color/typography retained and global Tailwind Preflight disabled during coexistence.

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

---

# Phase 5 UI component map — Operational Experience

**Status:** Phase 5 complete — staging acceptance verified on 2026-07-26

**Scope:** Dashboard, Notifications, and final Work Item History only

**Prepared:** 2026-07-26

## Authority and readiness boundary

This addition applies `docs/ui/dashboard-brief.md`,
`docs/ui/notifications-brief.md`, and `docs/ui/history-brief.md` to the approved
Phase 5 contracts. Vodafone owns color/typography; the ready source-linked
Astryx notes named below own the remaining component baseline. All runtime code
remains Design Flow-owned and no Astryx dependency, source, style, or API is
introduced.

## Shared components reused unchanged

| Component | Phase 5 use | Constraint and ready reference |
| --- | --- | --- |
| `Button` | Quick actions, mark-one/all read, scoped retry/disclosure | Visible action labels remain required; `references/astryx/button.md` |
| `Select` | People-scope preset and Area/Squad controls | Bounded single-choice values only; `references/astryx/select.md` |
| `Checkbox` | Specific-people scope selection | Labelled group, never an overloaded Select; `references/astryx/checkbox.md` |
| `Badge` | Workflow/attention reasons and textual unread count | Color-independent labels; `references/astryx/badge.md` |
| `Avatar` | Workload and Work Dates identity summaries | Noninteractive approved fallback only; `references/astryx/avatar.md` |
| `DataTable` | Desktop workload-by-person comparison | Structured mobile records, no output ranking; `references/astryx/table.md` |
| `Pagination` | Notification pages and only genuinely paged source lists | Existing numbered behavior; inbox fixes page size at 25; `references/astryx/pagination.md` |

The approved shell, accessibility, and responsive behavior continue to use
`references/astryx/patterns.md` and `references/astryx/accessibility.md`.

No shared component is added or extended. Dashboard summary cards are native
feature-owned links. The header notification control is a native link with a
decorative bell, visible label, and Badge, so it does not create an icon-only
Button mode. The durable paginated inbox does not use Popover, Drawer, Menu, or
Modal.

## Feature-owned compositions

| Owner | Composition | Shared dependencies |
| --- | --- | --- |
| `features/dashboard/PeopleScopeControl` | Position default plus deliberate group/all/specific-person alternatives | Select, Checkbox, Button |
| `features/dashboard/DashboardSummaryCards` | Six linked, source-reconciled ticket totals | Badge |
| `features/dashboard/ManagementSignals` | Recorded/no-recent/no-active/review-waiting source summaries | Avatar, Badge |
| `features/dashboard/NeedsAttentionList` | Deduplicated tickets with every applicable reason and All Tickets drill-down | Badge, Pagination when needed |
| `features/dashboard/WorkloadByPerson` | Alphabetical desktop comparison and structured mobile records, including Planned until disclosure | DataTable, Avatar, Badge |
| `features/dashboard/RecentRecordedWork` | Actual-date ticket activity plus separate standalone Visual Work | Avatar, Badge, Pagination when needed |
| `features/notifications/NotificationHeaderLink` | Bell, visible label, recipient unread count, inbox navigation | Badge |
| `features/notifications/NotificationList` | Newest-first 25-item recipient page and mark-all state | Button, Pagination |
| `features/notifications/NotificationItem` | Safe event summary, unread state, mark-one, native Work Item link | Button, Badge |
| `features/work-items/WorkDatesGrid` | Final five-column actual-date index and deep-link target | Avatar, Badge |
| `features/work-items/LifecycleTimeline` | Complete sanitized system/work narrative | Badge |
| `features/work-items/WorkLogTimelineEvent` | Independently addressable actual dates plus submission/correction/withdrawal metadata | Badge, Button |

Feature components receive authoritative API/domain payloads. They do not infer
permissions, people defaults, working-day rules, derived counts, or notification
recipients in the browser. Shared components never call Supabase.

## Route, state, and source ownership

| Route | Thin route responsibility | Feature surface |
| --- | --- | --- |
| `/` | Parse shared URL filters and set title | Dashboard |
| `/notifications` | Parse one-based page and set title | Recipient inbox |
| `/work-items` | Continue existing URL-backed source drill-down | All Tickets |
| `/work-items/:displayId` | Resolve optional actual-date fragment and load authoritative detail | Final Work Dates and timeline |

- Database read models own position defaults, alternate-scope expansion,
  working-day/stale formulas, Next Deadline coverage, source counts, and management
  signals. Admin changes capability, never the underlying default.
- Notification source mutations remain atomic/idempotent RPC effects. Only
  recipient-filtered `read_at` updates are direct browser writes.
- Loading, empty/no-results, error, permission, disabled, long-content,
  responsive, keyboard, and Light/Dark behavior is owned by each approved brief.
- Dashboard sources expose only normal team-readable records. Notifications
  expose only recipient rows and never grant Work Item access.

## Explicitly deferred or excluded

- Phase 6 Reports views, charts, CSV/PDF controls, exports, saved reports, and
  report-period drill-down.
- Availability/capacity claims, output ranking, productivity scores, sign-in
  recency signals, and manual availability.
- Notification email/push/reminders/digests/mentions/preferences/subscriptions,
  group-wide or work-log events, delete controls, and copied comment/blocker text.
- Calendar, generic Card/Timeline, icon-only Button, Menu, Drawer, Modal, Tabs,
  virtualized list, and generic notification-center primitives.

No excluded feature receives a placeholder or disabled control.

## Readiness acceptance

- The three briefs and this map were explicitly approved on 2026-07-26 before
  Phase 5 migration, API/domain, UI, or test implementation began.
- Existing shared components and notes cover all proposed needs; there is no
  unapproved presentation fallback or new shared API.
- Tests must reconcile every Dashboard value/source for V, D, D+A, L, L+A, M,
  and M+A; repeat global denial states; prove direct-write denial and recipient
  isolation; and prove source-event retry idempotency.
- Staging checks must retain labelled synthetic data, keep standalone activity
  separate, and verify Dashboard, Notifications, and History against the
  approved briefs without Phase 6 UI.

## Verification evidence

- Merged PRs #18/#19 at `cd9cdff` and GitHub workflow #48 delivered the final
  Phase 5 checkpoint; all frontend/browser,
  local Supabase/Deno, hosted migration/type, Edge Function, build, Pages, and
  live smoke jobs passed.
- Authenticated staging checks reconciled Manager and Lead people scopes,
  Dashboard sources and Next Deadline wording, notification empty state, and
  DF-000003 actual-date history against the three approved briefs.
- The Phase 5 exit-gate follow-up removes the exposed Phase 6 Reports placeholder
  and upgrades the smoke check to Phase 5 markers with bounded Pages-propagation
  retry coverage.

## Open questions

None. Approval includes the full-page inbox navigation and fixed 25-item inbox
page. Any material change requires a new readiness decision.

---

# Phase 6 UI component map — Reports and Exports

**Status:** Phase 6 implemented and staging-reconciled

**Scope:** Reports views, Reports CSV, and Work Item PDF only

**Prepared:** 2026-07-26

## Authority and readiness boundary

This addition applies `docs/ui/reports-brief.md` and
`docs/ui/export-brief.md` to the approved reporting, Reports UI, Work Item,
permission, operation, and data contracts. Vodafone owns color/typography;
ready Astryx notes own available non-color presentation. Recharts is the single
approved report renderer, not a component authority. All runtime components
remain Design Flow-owned.

## Shared components reused unchanged

| Component | Phase 6 use | Constraint and ready reference |
| --- | --- | --- |
| `Button` | Drill-down, clear/retry, CSV download, PDF actions | Visible labels and native keyboard behavior; `references/astryx/button.md` |
| `Input` | Custom period dates | Native date inputs and labelled validation; `references/astryx/input.md` |
| `Select` | Presets, scope, Area/Squad, sort, export type | Bounded single choice only; `references/astryx/select.md` |
| `Checkbox` | People/multi-value filters and Include comments | Labelled groups; comments default false; `references/astryx/checkbox.md` |
| `Badge` | Status/relationship/attention metadata | Text remains sufficient without color; `references/astryx/badge.md` |
| `Avatar` | Neutral person identity | Noninteractive identity only; `references/astryx/avatar.md` |
| `DataTable` | Detail, source, chart-alternative, and overview data; Reports opts into the All Tickets sticky-header/bordered-cell presentation | Native links/buttons are keyboard paths; pointer row activation only; `references/astryx/table.md` |
| `Pagination` | Visible report/source pages | Export never inherits page limits; `references/astryx/pagination.md` |

## New shared component: `TabList`

Purpose: switch among the three related, URL-backed report views.

Proposed public API: required accessible `label`; three or more `items` with
stable value/label; controlled `value` and `onValueChange`; required panel ID
mapping; optional adjacent action slot; no badges, icons, overflow menu, dynamic
add/remove, or closable tabs in Phase 6.

It owns selected/tab/panel relationships, one tab stop, Left/Right plus Home/End
movement, URL-state activation supplied by the feature, visible focus, and
wrapped three-item mobile presentation. Reference:
`references/astryx/tab-list.md`.

## Feature-owned compositions

| Owner | Composition | Shared dependencies |
| --- | --- | --- |
| `features/reports/ReportFilters` | URL-backed period/scope/group/people/Area and tab refinements | Input, Select, Checkbox, Button |
| `features/reports/ReportMetricCards` | Period and labelled snapshot values with source actions | Button, Badge |
| `features/reports/ReportChartFrame` | Muted token-styled Recharts bar/line plus visually hidden exact-value table and filter refinement | Button; no `src/ui` Recharts dependency |
| `features/reports/TicketReport` | Cards, four charts, ticket detail/source table | DataTable, Pagination, Badge |
| `features/reports/DesignerReport` | One/two/multi neutral layout, overview and separated detail sections | DataTable, Pagination, Avatar, Badge |
| `features/reports/RecordedTicketActivity` | One-person valid-entry source table with immutable submitter attribution | DataTable, Pagination, Badge |
| `features/reports/VisualWorkReport` | Standalone-only cards, charts, and entry table | DataTable, Pagination, Avatar |
| `features/reports/ReportExportControl` | Current-tab export type and one CSV download | Select, Button |
| `features/work-items/WorkItemExportPanel` | Include-comments choice and PDF generation status | Checkbox, Button |

Chart presentation follows `references/astryx/reporting-patterns.md`; no
Astryx chart-component fidelity is claimed. Chart color roles consume the
existing Vodafone data-visualization palette through centralized Design Flow
aliases and preserve non-color labels/patterns.

## Route, source, and security ownership

| Route | Thin responsibility | Feature surface |
| --- | --- | --- |
| `/reports` | Parse/normalize URL state and set title | Current Reports tab, filters, source disclosure, authorized CSV |
| `/work-items/:displayId` | Continue authoritative detail composition | Authorized in-page Work Item PDF panel |

- Read RPCs own historical snapshots, people/group expansion, report formulas,
  stable sorting, pagination, and source reconciliation. React does not rebuild
  those rules.
- Dedicated authorized export functions use the same normalized filters without
  visible-page limits. Only the designer-summary export projection may expose
  work email.
- Work Item export reads a sanitized fixed projection and never exposes raw
  revisions or withdrawn bodies. No browser base-table grant, direct domain
  write, service key, or Figma fetch is introduced.
- The All Tickets single-person action deep-links to the Designers tab and
  preserves that person in URL state without reinterpreting All Tickets.

## State, responsive, and accessibility ownership

The two briefs own loading, empty/no-results, error, permission, generating,
success, long-content, mobile, Light/Dark, keyboard, and axe behavior. Desktop
uses semantic tables and bounded charts; below `48rem`, wide rows become
structured records with the same values/actions. Charts always have semantic
equivalents and labelled non-chart filter paths.

## Explicitly excluded

Reports PDF, saved reports, custom columns, bulk actions, ranking, productivity
or effort scores, availability/capacity, hours/points, generic chart/UI library
components, raw-entry productivity charts, Phase 7 controls, placeholder
routes, and unapproved export schemas.

## Efficiency and token use

- Use `rg` and read only relevant document/code sections.
- Reuse Phase 3–5 fixtures, formulas, scopes, calendar helpers, RPCs, and UI.
- Batch independent read-only inspections and targeted tests.
- Run targeted tests while building and the full suite only at completed
  vertical-slice boundaries and final handoff.
- Avoid repository dumps, repeated full-suite runs, duplicate screenshots, and
  re-reading unchanged documents.
- Keep evidence compact: changed files, exact test counts, reconciled fixtures,
  and unresolved gates.
- Do not use subagents unless explicitly requested.

## Implementation evidence

Approval covered the two briefs, this component ownership, the `TabList` API,
the documented Astryx chart gap, and the narrow pointer-only `DataTable`
correction. Implementation followed migration/RPC/types → API/domain → UI →
test slices. Local verification passes 93 unit/component tests, 400 pgTAP/RLS
assertions, 26 applicable Playwright/axe scenarios with two device-specific
skips, 16 Edge Function tests, formatting, lint, strict types, generated types,
and a production build. The synthetic Work Item PDF passed three-page render
and extraction review. Merged PR #20 (`a879af4`) passed workflow #50 and its
complete staging deployment gate. Authenticated hosted checks covered all three
tabs, exact chart tables, controlled-source drill-down, all-row export
projections, and the Work Item PDF control.
The guarded Phase 6 validation fixture additionally passed a clean local load
at nine Areas, fourteen tickets, twenty batches, and fifty entries while
remaining opt-in and outside normal pgTAP seed preconditions.
The identical staging fixture reconciled to nine reserved personas, zero
non-synthetic profiles, all six statuses, 13 ticket-source rows, seven
designer-source rows, and six visibly separate standalone Visual Work rows.

## Open questions

None. Any material component, export, formula, permission, or responsive change
requires a new readiness decision before implementation.

# Phase 7 UI component map — Production Hardening

**Status:** Phase 7 component/readiness review closed 2026-08-03 under D-108;
known narrow Reports overflow deferred by D-107

**Scope:** Cross-product review and monitoring presentation only; operational
workflows and runbooks have no product UI

**Prepared:** 2026-07-27 from clean `main` at `18233b9`

## Authority and readiness boundary

`docs/ui/phase-7-cross-product-readiness-brief.md` owns the final UI review.
Existing product specifications, briefs, Vodafone color/typography, and ready
Astryx notes remain authoritative. Phase 7 adds no product feature, deployment
control, quota dashboard, monitoring console, or post-MVP v1.1 behavior.

## Component ownership

All current `src/ui/` components are reused through their documented APIs. No
new shared component is proposed. Operational monitoring, backups, deployment,
recovery, bootstrap, and rollout remain repository automation/runbook concerns,
not Settings or application UI.

If the cross-product review finds a component defect, the smallest owning
component is corrected with its existing reference, API documentation, and
regression tests. A missing Astryx value or materially changed API requires an
explicit component-map update and approval before implementation.

## Route, state, responsive, and accessibility ownership

Every shipped route retains its current feature owner. The review inventories
loading, empty, no-results, error, permission, disabled, success,
partial-success, generating, long-content, Light/Dark, desktop/mobile,
keyboard, focus, accessible-name, and axe behavior. Route composition stays
thin; RLS and server authorization remain authoritative.

External monitoring has no user-facing surface and is excluded from the MVP by
D-103. The existing accessible failure view remains the only product surface;
no telemetry, replay, user identity collection, form capture, or monitoring
control is added.

## Explicitly excluded

New product screens/components, deployment or backup controls, quota metrics in
Settings, analytics, session replay, new notifications, real data,
availability/capacity claims, productivity/ranking, scope changes, Astryx
runtime code, and all documented post-MVP v1.1 items.

## Efficiency and token use

- Use `rg` and read only relevant document/code sections.
- Reuse existing CI, staging, Supabase, Cloudflare, test, fixture, security,
  backup, and runbook patterns.
- Batch independent read-only inspections and targeted tests.
- Test each slice narrowly, then run the full suite only at completed slice
  boundaries and final handoff.
- Use workflow evidence already produced by #50 and #52 instead of repeating
  equivalent checks without cause.
- Avoid repository dumps, repeated full-suite runs, duplicate screenshots,
  repeated browser snapshots, and re-reading unchanged documents.
- Keep evidence compact: changed files, exact test counts, workflow/run IDs,
  restore checksums, reconciled fixtures, and unresolved gates.
- Do not use subagents unless explicitly requested.

## Approval gate

This map and the two Phase 7 readiness briefs were approved for local
implementation on 2026-07-27. The configured staging gate later passed; D-103
approved the zero-billing correction. D-104 two-working-day acceptance passed
on 2026-07-30. The unchanged reviewed UI was delivered through production run
`30526117799` attempt 3; no production-only component or control was added.

D-105 counts Day 1 with two explicit staging exceptions: inactive owner test
profiles are outside the active persona set, and the 390 px Reports overflow is
nonblocking. D-107 defers its correction/retest to the separately scoped
post-MVP UI revamp without representing it as fixed.

D-108 closes the Phase 7 component/readiness boundary without adding a product
component or claiming real-team rollout occurred. Controlled release,
post-release monitoring, real-user Core Web Vitals, and stabilization are
post-MVP operating evidence.

## Local implementation evidence

No shared component or public API was added. The only material component-level
finding was constrained-browser-storage failure in `ThemeProvider`; its
persistence is now fail-soft and regression-tested. D-103 removes external
client telemetry entirely while preserving the accessible fail-safe error view.
The cross-product review and completed local Playwright/axe gate found no
remaining release-blocking UI issue. The configured staging delivery evidence
and D-104 two-working-day acceptance gate passed under D-105. D-107 records the
accepted 390 px Reports overflow as known nonblocking post-MVP UI-revamp work.
