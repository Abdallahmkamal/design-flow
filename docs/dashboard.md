# Dashboard specification

**Version:** 1.1  
**Decision date:** 2026-07-16  
**Status:** Approved for MVP planning

The Dashboard is a position-aware view over one team. Reporting groups change the default people scope; they never create separate teams or restrict a Lead's or Manager's visibility.

## 1. People scope

| Position | Default scope |
|---|---|
| Viewer | Everyone |
| Designer | Me |
| Lead | My reporting group: the signed-in Lead plus their current direct-report Designers |
| Manager | My Manager group: the Manager, reporting Leads, and Designers beneath them |

Where people filtering applies, support:

- My reporting group, when the user is a Lead.
- My Manager group, when the user is a Manager.
- All eligible work contributors.
- Any named Lead's reporting group.
- Any named Manager's reporting group.
- Specific people where the view supports person-level multi-selection.

Leads and Managers may switch from their default group to All, another Lead/Manager group, or individual people. Admin privilege grants full access but does not replace the user's position-based default. Reporting-group scope is a filter preset, not a permission boundary. It applies consistently to Dashboard, All Tickets, and Reports. It does not narrow assignee choices in ticket forms.

## 2. Shared filters

- People scope uses the position defaults above.
- Area/Squad defaults to All.
- Archived tickets are excluded.
- Snapshot cards use the current ticket state.
- Activity summaries default to the current Sunday-through-Saturday reporting week, ending today, and use actual `work_date` values. Friday/Saturday work appears when manually recorded; working-day thresholds still skip those days.
- Changing a shared filter refreshes every applicable card, signal, list, and workload row.

## 3. Primary cards

Show these six scoped, clickable summary cards:

1. **Active work items** — current unarchived tickets in To do, In Progress, or In Review, with a small status breakdown.
2. **Blocked** — active work items with an unresolved blocker.
3. **Overdue** — active work items whose due date is before today; Paused and Done are excluded.
4. **Due soon** — active work items due today or within the next five working days.
5. **Stale work items** — active work items meeting the stale definition below.
6. **Unassigned backlog** — unarchived Backlog tickets without a primary assignee.

Selecting a card filters or opens the relevant ticket list; cards are not dead-end totals.

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
- Active owned work without a due date
- Longest-waiting In Review items

### Workload by person

Show one neutral row per person in scope with:

- Active owned tickets, split by To do, In Progress, and In Review
- Contributed tickets during the selected activity period
- Blocked and overdue owned tickets
- Last recorded work date
- Planned until
- Standalone visual activity shown separately

Default ordering is alphabetical. The UI may prioritize an attention filter, but must not rank people by output or imply that ticket counts equal effort.

### Recent recorded work

- Show ticket activity using actual work dates.
- Show standalone visual activity in a visibly separate subsection.
- Backfilled work belongs to the date when the work happened, while audit history retains the later submission time.

## 7. Planned until

`Planned until` is a due-date outlook, not availability or capacity.

- Calculate it from the latest due date among the person's current unarchived owned tickets in To do, In Progress, or In Review.
- Contributor activity does not affect it because contribution history does not establish future ownership.
- If some active owned tickets lack due dates, show the latest date plus the missing-date count, for example `Planned until 28 Aug · 2 without due dates`.
- If all active owned tickets lack due dates, show `No due dates set`.
- If there is no active owned work, show `No active owned tickets`.
- Do not call the result `Available from`, and do not add manual availability statuses, date ranges, or availability reports in the MVP.

## 8. Actions and responsive behavior

- Designer, Lead, Manager, and Admin-privileged users see Create ticket and Log work quick actions.
- A Viewer sees no mutating actions and cannot hold Admin privilege.
- Mobile preserves the same definitions and filters; cards may wrap or scroll, and workload rows may become expandable cards.
- Every aggregate must link to or reveal the source people, tickets, or work records when permissions allow.

## 9. Acceptance criteria

- Position defaults resolve correctly on first load.
- A Lead or Manager can switch from their position-based group to All, any other Lead/Manager group, or specific people without losing permitted data access.
- Adding Admin privilege does not change the user's default people scope.
- Reporting-group changes refresh all scoped Dashboard content consistently.
- Active, blocked, overdue, due-soon, stale, and backlog totals match their documented definitions.
- Friday and Saturday are excluded from working-day thresholds.
- Planned until handles complete, partial, and missing due-date states without presenting availability as fact.
- Ticket and standalone-visual activity remain visually and numerically separate.
- No card, signal, ordering, or label implies a productivity score or designer ranking.
