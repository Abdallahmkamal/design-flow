# Reporting definitions

**Version:** 0.6
**Checkpoint date:** 2026-07-20
**Status:** Core attribution, metrics, UI layouts, and CSV export contracts approved

Reporting is a primary product outcome. Every metric must be explainable, traceable to source records, and exportable without implying that activity frequency equals effort, quality, complexity, or performance.

## 1. Reporting views

The Reports module has three separate views:

1. **Tickets** — what happened to each work item.
2. **Designers** — what each person owned, contributed to, and actually worked on.
3. **Visual Work** — standalone visual/graphic activity outside the ticket workflow.

Visual work must never inflate ticket counts, ownership, contribution, completion, or ticket activity metrics.

The Designers report may include people whose organizational position is Designer, Lead, or Manager when they have attributable work. Admin privilege is not a reporting identity and never changes work credit.

### Reporting-group scope

- Designer defaults to Me.
- Lead defaults to My reporting group: the Lead plus their direct-report Designers.
- Manager defaults to My Manager group: the Manager, reporting Leads, and Designers beneath them.
- Viewer defaults to All with read-only report access and no export; Viewer cannot hold Admin privilege.
- Admin privilege does not change the user's position-based default scope.
- A Lead or Manager may switch to All, another Lead/Manager group, or specific people; reporting groups never restrict visibility.
- Current snapshot metrics use current reporting relationships.
- Period activity and event metrics use the reporting relationship effective on the applicable work/event date so a reassignment does not rewrite historical group reporting.
- The selected Lead/Manager group and scope definition must be included in export metadata.

## 2. Time rules

- Work reporting uses `work_date`, not the time an entry was submitted.
- Audit history uses submission/edit timestamps.
- Backfilled work appears in the period when it happened.
- Ticket completion uses the Done transition timestamp.
- Current-open metrics are snapshots at the report end time.
- Archived tickets remain available in historical reports and exports.

Example: work performed on 10 July but entered on 15 July belongs to 10 July activity reporting and 15 July audit history.

## 3. Metric glossary

### Active calendar day

A distinct date on which a designer has at least one valid work entry. Multiple ticket and visual entries on the same date still equal one overall active calendar day.

### Ticket active day

A distinct date on which a designer has at least one valid ticket-work entry.

### Ticket-level active work day

A distinct date on which at least one designer has valid work recorded for a particular ticket. Multiple designers or entries on the same ticket/date count once. This is the Work Item header's **Active work days** measure and differs from designer Ticket active days.

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

An unarchived active-workload ticket whose due date is before the relevant snapshot date and which is not Done or Paused. Tickets without due dates are not overdue.

### Planned until

The latest due date among a designer's current unarchived primary-owned tickets in To do, In Progress, or In Review.

- It is a current planning horizon, not availability, capacity, or effort.
- Contributor tickets do not affect it.
- Reports must expose how many qualifying active owned tickets have no due date.
- Use `No due dates set` when all active owned work lacks due dates, and `No active owned tickets` when there is no active ownership.

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
- Planned start and due date
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
- Planned until, with the count of active owned tickets lacking due dates
- Last recorded work date and the factual No recent work recorded signal where applicable
- Visual activity-days, shown in a separate section
- Overall active calendar days, carefully labeled to avoid summing overlapping categories

The individual drill-down should separate:

### Owned work

- Ticket
- Status
- Due date
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
- Friday/Saturday entries count normally when manually logged.
- Corrections move activity to the corrected date/type/context.
- Withdrawn logs are excluded from normal reports.
- Contributor and completion summaries must be recalculated after relevant corrections.

## 10. CSV portability

Exact columns are locked in [reports-ui.md](reports-ui.md); exports follow these shapes:

### Ticket summary CSV

One row per ticket. Contributor and label lists may be serialized as delimited values.

### Designer summary CSV

One row per designer for the selected period, with organizational position, Admin privilege, applicable reporting Lead/Manager, and clearly defined ownership, contribution, ticket-day, active-day, blocker, overdue, planned-until, missing-due-date, last-recorded-work, and visual fields.

### Designer-ticket detail CSV

One row per designer-ticket relationship with a relationship type such as `primary` or `contributor`, plus actual activity dates/counts.

### Visual-work detail CSV

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

- Reports use filter-aware CSV exports for Lead, Manager, and Admin-privileged users.
- Reports do not include saved configurations or PDF output in the MVP.
- Work Item PDF export remains a separate approved feature.
