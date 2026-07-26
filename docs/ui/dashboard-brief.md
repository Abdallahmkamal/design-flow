# Dashboard brief

**Status:** Approved for Phase 5 implementation — 2026-07-26

**Route:** `/`

**Phase:** 5 — Operational Experience

## Purpose and users

Provide one explainable, position-aware operational view of current ticket state
and recorded work. Every valid active principal may read the Dashboard. Viewer
is read-only; Designer, Lead, Manager, and valid Admin overlays receive only
their already-approved quick actions. Inactive, password-restricted, and
Viewer+Admin states remain outside the normal application boundary.

The initial people scope is position-owned: Viewer = Everyone, Designer = Me,
Lead = current Lead group, and Manager = current Manager group. Admin privilege
never changes that default. Leads and Managers may deliberately choose All, any
Lead/Manager group, or specific people. A Designer+Admin keeps Me by default but
may deliberately select another allowed scope.

## Information hierarchy and actions

1. Page heading, current people scope, Area/Squad, and current-week context.
2. Six linked summary cards: Active, Blocked, Overdue, Due soon, Stale, and
   Unassigned backlog.
3. Management people signals when the position or Admin overlay qualifies.
4. Deduplicated Needs attention tickets with every applicable reason.
5. Workload by person, alphabetically ordered.
6. Recent recorded ticket work, then visibly separate standalone Visual Work.

Create ticket and Log work use existing authorization and routes. Viewer sees
neither. Every card, count, person signal, and recent-work item links to or
reveals its controlled source records; ticket totals drill into URL-filtered All
Tickets, while actual-work records link to the relevant Work Item/date. No
Reports/export control or nonfunctional Phase 6 affordance appears.

## Business and content rules

- Shared filter changes refresh every applicable card, list, signal, and row as
  one query state. Archived tickets are excluded.
- Snapshot cards use current ticket state. Activity uses actual `work_date` in
  the current Sunday-through-Saturday week ending today.
- Stale means five elapsed Sunday-through-Thursday working days since the latest
  valid anchor: actual ticket work, entry into the current active run, or
  planned start. A future planned start prevents early staleness. Backlog,
  Paused, Done, and archived tickets are never stale. Sign-in recency is never
  consulted.
- Workload rows show active owned status counts, period contributions, blocked
  and overdue owned tickets, last recorded work date, Planned until, and a
  separate standalone-visual fact. Counts never imply effort or rank people.
- Planned until uses only current active primary-owned ticket due dates. Partial
  coverage reads `Planned until <date> · <n> without due dates`; all missing
  reads `No due dates set`; no active ownership reads `No active owned tickets`.
  It is never labelled or described as availability or capacity.
- Management signals use ticket and standalone-visual work where specified, but
  keep those sources visibly and numerically distinct. The labelled synthetic
  standalone record in staging may appear only in the standalone source region
  and must retain its synthetic identity.

## Components and ownership

Reuse `Button`, `Select`, `Checkbox`, `Badge`, `Avatar`, `DataTable`, and
`Pagination` only where the result set requires it. Reuse the existing
URL-backed people-filter/domain logic rather than deriving position defaults in
the page. Feature-own `PeopleScopeControl`, `DashboardSummaryCards`,
`ManagementSignals`, `NeedsAttentionList`, `WorkloadByPerson`, and
`RecentRecordedWork`. Shared UI never calls Supabase.

Summary cards are semantic links composed by the feature, not a new generic
Card component. Status/attention badges keep text labels; standalone activity
does not reuse ticket status presentation.

## Desktop, mobile, and interaction

Desktop presents filters before a wrapping six-card summary, then readable
section regions; workload uses a semantic table because values are compared by
column. Below `48rem`, filters stack, cards remain linked summaries, and each
workload row becomes a structured expandable record preserving labels, source
links, and alphabetical order. No required value depends on horizontal scroll.

Native controls preserve Tab, Shift+Tab, Enter, and Space. Scope changes are
announced, update the URL/query state, reset dependent pagination, and move
focus to the refreshed results heading or announce the new source range.
Expandable mobile rows expose `aria-expanded` and return focus predictably.
Status and attention reasons never rely on color alone.

## Required states

- Loading preserves headings/filter context and marks each dependent region
  busy without showing stale totals as current.
- Empty distinguishes no source records from filtered no-results and offers
  Clear filters where applicable; quick actions appear only when authorized.
- Error identifies the failed region, retains filters, and offers scoped Retry.
- Viewer is a normal read-only result, not a disabled form. Unauthorized account
  states use the existing auth boundary.
- Long titles/names/reasons wrap; dense source lists paginate or disclose more
  without clipping actions.

## References and acceptance

Presentation and behavior reuse ready notes in
`references/astryx/{button,select,checkbox,badge,avatar,table,pagination,patterns,accessibility}.md`.
Vodafone color/type and existing Design Flow aliases remain authoritative; no
new presentation gap or shared primitive is proposed.

Acceptance requires desktop/mobile/keyboard/axe coverage; Light/Dark checks;
all default and allowed alternate scopes; Admin-overlay default preservation;
exact reconciliation of every value and drill-down to controlled fixtures;
weekend/stale boundary cases; all Planned-until states; and visible separation
of ticket and standalone work. Staging verification must use only labelled
synthetic data.

## Open questions

None. Material changes require a new readiness decision.
