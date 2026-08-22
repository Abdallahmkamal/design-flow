# Dashboard specification

**Version:** 1.3
**Decision date:** 2026-07-16  
**Status:** Approved MVP contract with D-110/D-112 team-ready amendments and D-118 reporting semantics

The Dashboard is a position-aware view over one team. Reporting groups change the default people scope; they never create separate teams or restrict a Lead's or Manager's visibility.

## 1. People scope

| Position | Default scope |
|---|---|
| Viewer | Everyone |
| Designer | Me |
| Lead | My reporting group: the signed-in Lead plus their current direct-report Designers |
| Manager | All people |

Where people filtering applies, support:

- My reporting group, when the user is a Lead.
- Individual reporting groups, when the user is a Manager or Admin.
- All eligible work contributors.
- Specific people where the view supports person-level multi-selection.

Designer without Admin is restricted to Me at the authorization boundary; URL or RPC filters cannot broaden that scope. Lead without Admin defaults to My reporting group and may select All or Me. Manager and every Admin-privileged principal default to All and may select individual reporting groups or Me. Viewer remains whole-team read-only at All. Reporting-group scope is a filter preset for broader-authorized principals, not a tenant boundary. These changed defaults and the Designer boundary become effective only when modernization Slice 6 is deployed. They do not narrow assignee choices or ordinary whole-team Work Item visibility.

## 2. Permanent page-wide scope controls

- Dashboard has exactly two permanent page-wide scope controls: **People** and
  **Area/Squad**. Both remain visible in the shared module header and refresh
  every applicable card, chart, signal, list, and workload row.
- People uses the position defaults and authorization rules above.
- Area/Squad defaults to All and preserves the existing single-Area URL and RPC
  contract. Archived Areas are unavailable for ordinary new selection while a
  valid historical/current value remains representable under the controlled-list
  contracts.
- `All` is the non-restrictive default/reset value where permitted and is not
  presented as an active restrictive filter.
- The Area/Squad menu keeps `All` as an explicit selectable option after a
  restrictive Area has been chosen so the filter can be cleared in place.
- These controls reuse the active-filter chip visual language from All Tickets,
  but remain persistent scope selectors rather than removable optional filters.
  They use a light outlined resting treatment; a restrictive selection may use
  a subtle filled state. They have clear labels and current values and never
  show remove actions.
- Dashboard has no generic Add filter control and no page-wide Status, Labels,
  or date-range filters. This Dashboard-only rule does not change the approved
  Add filter model on All Tickets or Reports.
- Archived tickets are excluded.
- Snapshot cards use the current ticket state.
- Activity summaries default to the current Sunday-through-Saturday reporting week, ending today, and use actual `work_date` values. Friday/Saturday work appears when manually recorded; working-day thresholds still skip those days.
- Valid People and Area values are URL-backed so reload, deep links, navigation,
  and Browser Back preserve Dashboard scope.

## 3. Primary cards

Show these six scoped, clickable summary cards:

1. **Active work items** — current unarchived tickets in To do, In Progress, or In Review, with a small status breakdown.
2. **Blocked** — active work items with an unresolved blocker.
3. **Overdue** — unarchived To Do or In Progress tickets whose Next Deadline is before today; Backlog, In Review, Paused, and Done are excluded.
4. **Due soon** — active work items due today or within the next five working days.
5. **Stale work items** — active work items meeting the stale definition below.
6. **Unassigned backlog** — unarchived Backlog tickets without a primary assignee.

Selecting a card filters or opens the relevant ticket list; cards are not dead-end totals.
Use restrained semantic color on the metric number or a narrow card accent;
do not use competing full-card color fills or rely on color alone.
The Stale card explanation is `No logged work for five days.` The Overdue
numeral uses the approved Dashboard-specific error value `#230709`; this is a
scoped card treatment and does not redefine the global functional-error token.

## 4. Stale-work definition

An unarchived ticket in To do, In Progress, or In Review is stale after five Sunday-through-Thursday working days pass without valid logged ticket work.

- A newly active ticket receives a five-working-day grace period.
- A future planned start prevents staleness before that date.
- The comparison anchor is the latest applicable date among the most recent valid ticket work, entry into the current active run, and planned start.
- Backlog, Paused, Done, and archived tickets are never stale.
- A ticket may be both Blocked and Stale because the signals describe different facts.
- The five-day threshold is fixed in the MVP.

## 5. Management people signals

For Lead, Manager, and Admin-privileged views, show a compact people summary under the primary cards:

- **Work recorded this week** — people with at least one valid ticket or standalone-visual work entry during the current Sunday-through-Saturday reporting week, shown as `recorded / people in scope`.
- **No recent work recorded** — active people with no valid ticket or standalone-visual work entry in the last five working days. This is a logging fact, not an inactivity or performance judgment.
- **No active owned tickets** — people with zero current tickets in To do, In Progress, or In Review. Contribution and visual work may still exist and must remain visible.
- **Review waiting** — In Review tickets ordered by time in the status so Leads and Managers can identify review bottlenecks without creating a productivity score.

Do not use authentication login recency as a work signal. Last sign-in belongs only in Admin account management for access and security support.

## 6. Dashboard sections

### Needs attention

Show a deduplicated ticket list that can expose multiple applicable reasons:

- Blocked
- Overdue
- Due soon
- Stale
- Unassigned backlog
- Active owned work without a next deadline
- Longest-waiting In Review items

Present each result as a compact, headerless three-part row: ticket identity,
current assignee or Unassigned, and status plus every applicable reason badge.

### Workload by person

Show one neutral row per person in scope with:

- Active owned tickets, split by To do, In Progress, and In Review
- Contributed tickets during the selected activity period
- Blocked and overdue owned tickets
- Last recorded work date
- Planned until
- Standalone visual activity shown separately

Default ordering is alphabetical. The UI may prioritize an attention filter, but must not rank people by output or imply that ticket counts equal effort.
Keep this detailed table rather than replacing it with a comparative people
chart. Activating a person row opens All Tickets with that person in the visible
People filter and carries the selected Dashboard Area when present. Mobile
cards expose the same destination explicitly.

### Recent recorded work

- Show ticket activity using actual work dates.
- Group ticket records under their actual work date and prioritize ticket
  identity/title over person and work-type metadata.
- Show standalone visual activity in a visibly separate subsection.
- Backfilled work belongs to the date when the work happened, while audit history retains the later submission time.

## 7. Planned until

`Planned until` is a Next Deadline outlook, not availability or capacity.

- Calculate it from the latest Next Deadline among the person's current unarchived owned tickets in To Do or In Progress only.
- Contributor activity does not affect it because contribution history does not establish future ownership.
- If some active owned tickets lack next deadlines, show the latest date plus the missing-date count, for example `Planned until 28 Aug · 2 without next deadlines`.
- If all active owned tickets lack next deadlines, show `No next deadlines set`.
- If there is no active owned work, show `No active owned tickets`.
- Do not call the result `Available from`, and do not add manual availability statuses, date ranges, or availability reports in the MVP.

## 8. Actions and responsive behavior

- Dashboard does not duplicate Create ticket or Log work in its module header;
  authorized users retain those actions in the persistent application sidebar
  or mobile action surface.
- A Viewer sees no mutating actions and cannot hold Admin privilege.
- Mobile preserves the same definitions and filters; cards may wrap or scroll, and workload rows may become expandable cards.
- Every aggregate must link to or reveal the source people, tickets, or work records when permissions allow.

## 9. Acceptance criteria

- Position defaults resolve correctly on first load.
- People and Area/Squad are the only permanent Dashboard scope controls; no
  generic Add filter or Dashboard-wide Status, Labels, or date-range control is
  present.
- Designer without Admin remains Me-only even with forged URL/RPC scope. Lead without Admin defaults to their group and may select All or Me. Manager/Admin defaults to All and may select approved group/Me refinements. Viewer remains All/read-only.
- Adding Admin privilege changes the Dashboard default to All without changing organizational position or reporting-line attribution.
- Reporting-group changes refresh all scoped Dashboard content consistently.
- Active, blocked, overdue, due-soon, stale, and backlog totals match their documented definitions.
- Friday and Saturday are excluded from working-day thresholds.
- Planned until handles complete, partial, and missing Next Deadline states without presenting availability as fact.
- Ticket and standalone-visual activity remain visually and numerically separate.
- No card, signal, ordering, or label implies a productivity score or designer ranking.
