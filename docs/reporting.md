# Reporting definitions

**Version:** 0.7
**Checkpoint date:** 2026-07-20
**Status:** Core attribution/metrics approved with D-110 scope/CSV and D-118 calendar/deadline/archive amendments

Reporting is a primary product outcome. Every metric must be explainable, traceable to source records, and exportable without implying that activity frequency equals effort, quality, complexity, or performance.

## 1. Reporting views

The Reports module has three separate views:

1. **Tickets** — what happened to each work item.
2. **Designers** — what each person owned, contributed to, and actually worked on.
3. **Visual Work** — standalone visual/graphic activity outside the ticket workflow.

Visual work must never inflate ticket counts, ownership, contribution, completion, or ticket activity metrics.

The Designers report may include people whose organizational position is Designer, Lead, or Manager when they have attributable work. Admin privilege is not a reporting identity and never changes work credit.

### Reporting-group scope

- Designer without Admin is restricted to Me at the authorization boundary, including direct URLs, RPC filters, drill-downs, and CSV.
- Lead defaults to My reporting group: the Lead plus their direct-report Designers.
- Lead without Admin may select All or Me in addition to the default group.
- Manager and every Admin-privileged principal default to All; individual reporting groups and Me remain available.
- Viewer defaults to All with read-only report access and no export; Viewer cannot hold Admin privilege.
- These changed defaults and boundaries become effective only when modernization Slices 6 and 7 deploy. Ordinary whole-team ticket visibility remains unchanged.
- Current snapshot metrics use current reporting relationships.
- Period activity and event metrics use the reporting relationship effective on the applicable work/event date so a reassignment does not rewrite historical group reporting.
- The selected Lead/Manager group and scope definition must be included in export metadata.

## 2. Time rules

- Work reporting uses `work_date`, not the time an entry was submitted.
- Audit history uses submission/edit timestamps.
- Backfilled work appears in the period when it happened.
- Ticket completion uses the Done transition timestamp.
- Current-open metrics are snapshots at the report end time.
- Ticket reports and CSV exports default to not archived. Archived tickets remain available through the explicit archived-state filter; the selected archive scope applies to cards/counts, charts, table rows, source drill-downs, and exported rows.

Example: work performed on 10 July but entered on 15 July belongs to 10 July activity reporting and 15 July audit history.

## 3. Metric glossary

### Active calendar day

A distinct date on which a designer has at least one valid work entry. Multiple ticket and visual entries on the same date still equal one overall active calendar day.

### Ticket active day

A distinct date on which a designer has at least one valid ticket-work entry.

### Ticket-level active work day

A distinct Sunday–Thursday date on which at least one designer has valid work recorded for a particular ticket. Multiple designers or entries on the same ticket/date count once. Friday/Saturday logs remain visible in history and detail exports but do not increase **Days Active**.

### Ticket-day

A unique `(designer, ticket, work_date)` combination.

- Multiple logs by the same designer on the same ticket and date count as one ticket-day.
- Work on two tickets on the same date counts as two ticket-days.
- Ticket-days show breadth/frequency of recorded ticket involvement, not hours.

### Visual activity-day

A distinct date on which a designer has at least one valid standalone visual-work entry. Multiple visual entries on the same date count as one visual activity-day.

### Ticket worked on

A distinct ticket with at least one valid work entry by the designer during the selected period.

### Owned ticket

A ticket where the designer is the primary assignee for the relevant snapshot or event. Reports must label whether a count is current ownership, ownership during the period, or ownership at completion.

### Contributed ticket

A distinct ticket where the designer logged valid work while someone else was primary assignee for that work date.

### Completed as primary

A ticket that entered Done while the designer was primary assignee. Count the ticket once for that completion event; contributors remain visible separately.

### Reopened ticket

A Done ticket moved to another status during the selected period. Previous completion remains in history.

### Active workload

Current tickets in To do, In Progress, or In Review. Backlog and Paused are separate groups. Archived tickets are excluded from current workload.

### Blocked ticket

An active-workload ticket with an unresolved blocker. Blocked is independent of workflow status.

### Overdue ticket

An unarchived To Do or In Progress ticket whose Next Deadline is before the relevant team-local snapshot date. Backlog, In Review, Paused, Done, archived tickets, and tickets without a Next Deadline are not overdue.

### Planned until

The latest Next Deadline among a designer's current unarchived primary-owned tickets in To Do or In Progress.

### Days Open and status durations

Days Open counts Sunday–Thursday dates after planned Start Date through the snapshot date, stopping at the latest applicable Done transition while a ticket is Done and resuming from the original Start Date after reopen. To Do Days, In Progress Days, Review Days, and Paused Days are derived from ordered status history; the status effective at the end of each team-local working date owns that date, so same-day transitions never double count.

- It is a current planning horizon, not availability, capacity, or effort.
- Contributor tickets do not affect it.
- Reports must expose how many qualifying active owned tickets have no next deadline.
- Use `No next deadlines set` when all active owned work lacks next deadlines, and `No active owned tickets` when there is no active ownership.

### No recent work recorded

An active profile with no valid ticket or standalone-visual work entry in the preceding five Sunday-through-Thursday working days. This is a logging-completeness signal, not evidence of absence, inactivity, or performance. Authentication sign-in time is never used for this metric.

## 4. Ticket report

Each ticket appears once in the summary, regardless of assignee changes, contributors, work-log count, or subtasks.

Recommended summary fields:

- Ticket ID and title
- Area/Squad
- Current primary assignee
- Contributors
- Current status
- Active blocker indicator and blocked duration
- Planned start and Next Deadline
- First actual work date
- Last worked on
- Distinct active work dates
- Work-entry count as a secondary detail
- Reopen count
- Subtask completion badge
- Archived state

Selecting a ticket may reveal:

- Contribution breakdown by designer
- Primary versus contributor ticket-days
- Work-type distribution
- Status and assignment history
- Blocker history
- Actual-work dates against the planned window
- Comments and audit events where permitted

Ticket totals count tickets, not ticket-designer relationships. A ticket with three contributors is still one ticket.

## 5. Designer report

Designer selection is a normal multi-select filter, not a competitive mode:

- One selected designer shows an individual report.
- Two selected designers show neutral side-by-side values automatically.
- Multiple/all designers show the team overview.
- Do not display a Compare button, winner, score, ranking, or versus language.

Recommended designer summary fields:

- Current open owned tickets
- Tickets worked on during the period
- Ticket active days
- Ticket-days
- Completed as primary
- Contributed tickets
- Primary versus contributor ticket-days
- Current blocked owned tickets
- Current overdue owned tickets
- Owned tickets with no work in the selected period
- Planned until, with the count of active owned tickets lacking next deadlines
- Last recorded work date and the factual No recent work recorded signal where applicable
- Visual activity-days, shown in a separate section
- Overall active calendar days, carefully labeled to avoid summing overlapping categories

The individual drill-down should separate:

### Owned work

- Ticket
- Status
- Next Deadline
- Designer's actual work dates
- Contributors
- Last worked on
- Blocked/overdue state

### Contributions

- Ticket and primary assignee
- Area/Squad
- Designer's contribution dates and types
- First and last contribution date
- Current ticket status

### Recorded ticket activity

The one-person view includes a chronological, cross-ticket source table for the selected period. It contains one row per valid ticket work-log entry rather than one row per ticket or ticket-day. Multiple entries on the same ticket/date therefore remain individually visible.

Each row shows:

- Actual work date
- Ticket
- Area/Squad
- Work type
- Primary-assignee or contributor relationship effective on that work date
- Optional description
- Submitted by, while credit remains with the selected `worked_by` person
- Logged-at timestamp
- Corrected indicator/time where applicable
- Open Work Item action

Use corrected current values and exclude withdrawn entries. A changed `worked_by` moves the entry to the newly credited person's activity. `logged_by` remains the original submitter and never receives work credit. Full correction/withdrawal audit reconstruction remains in the Work Item timeline and restricted revision sources rather than this normal activity table.

### Standalone visual activity

- Date
- Visual-work type
- Optional Area/Squad
- Optional description

## 6. Neutral two-designer presentation

When two designers are selected, show the same report fields in aligned columns. The view should support interpretation such as:

- One person owned and completed more tickets.
- Another contributed across more shared work.
- Both had similar active calendar days.
- One spent more recorded capacity on standalone visual work.

Do not conclude that one person “worked more” from these measures alone.

Ownership/contribution mix may use ticket-days:

`primary ticket-days / all ticket-days` and `contributor ticket-days / all ticket-days`.

Label these as the **mix of logged ticket activity**, not a share of time or effort.

## 7. Visual Work report

Standalone visual work has a dedicated report and no ticket workflow columns.

Recommended fields and breakdowns:

- Visual activity-days
- Entry count as a secondary detail
- Activity by designer
- Activity by visual-work type
- Activity by optional related Area/Squad
- Weekly/monthly trend
- Optional descriptions
- Work date and logged-at timestamp

Exclude:

- Ticket IDs
- Status and completion
- Primary assignees and contributors
- Blockers and overdue state
- Planned dates
- Subtasks and comments

## 8. Work-type reporting

Ticket and visual work types are fixed vocabularies. Distribution should preferably count distinct applicable activity-days or ticket-days rather than raw update count.

Examples of acceptable labels:

- “Logged ticket activity by work type”
- “Visual activity-days by type”
- “Ticket-days by Area/Squad”

Avoid labels such as:

- “Effort by type”
- “Productivity”
- “Utilization percentage”

unless hours or another validated effort input is added later.

## 9. Multi-date and corrected logs

- Every selected date in a batch is independently reportable with its own work type.
- The batch may appear once in history but is expanded for date metrics.
- Friday/Saturday entries remain visible and count normally in raw entry, designer activity, and standalone-visual reporting when manually logged. They do not increase ticket Days Active or status-duration counters.
- Corrections move activity to the corrected date/type/context.
- Withdrawn logs are excluded from normal reports.
- Contributor and completion summaries must be recalculated after relevant corrections.

## 10. CSV portability

Under D-110, Reports owns one direct Export CSV action. The active tab selects exactly one row model, and every export applies the visible Period, People scope, optional filters, and server authorization boundary to all matching rows rather than only the visible page. Exact columns are locked in [reports-ui.md](reports-ui.md) and [ui/team-ready-ui-handoff.md](ui/team-ready-ui-handoff.md).

### Tickets-tab CSV

One row per ticket. Use one `Primary Assignee`, keep Contributors separate, and include no Priority column. This is a ticket-level report rather than a complete ticket-history export.

### Designers-tab CSV

One row per permitted designer for the selected period. Designer without Admin receives only their own row; Viewer cannot export.

### Standalone-Visuals-tab CSV

One row per visual work-log entry/date, including designer, work date, visual type, optional Area/Squad, optional description, and logged-at timestamp.

CSV files must include:

- Human-readable headers
- Report period and generation time, either as metadata or companion fields
- Stable ticket IDs where applicable
- No hidden dependence on portal-only labels or colors

## 11. Reporting safeguards

- No overall productivity score.
- No ranking designers by update count.
- No implication that a ticket count represents complexity.
- No double counting a ticket because it has contributors.
- No combining standalone visual activity with ticket completion.
- Every aggregate must allow drill-down to source tickets or work entries where permissions allow.

## 12. Approved UI and export contract

The final card sets, charts, responsive behavior, presets, current-view export semantics, filenames, and exact CSV columns are defined in [reports-ui.md](reports-ui.md).

- Reports use the D-110 tab-aware, filter-aware CSV action. Designer without Admin may export only their personal authorized dataset; Lead, Manager, and Admin may export their authorized scope; Viewer cannot export.
- Reports do not include saved configurations or PDF output in the MVP.
- Work Item PDF export remains a separate approved feature.
