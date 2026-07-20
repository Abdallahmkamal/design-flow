# Reports UI and export specification

**Version:** 1.2
**Decision date:** 2026-07-20
**Status:** Approved for MVP planning

Reports turns the approved reporting definitions into three usable views: Tickets, Designers, and Visual Work. Every value must remain traceable to source records and must not imply that recorded activity equals effort, quality, complexity, or performance.

## 1. Shared report frame

Each report uses the same hierarchy:

1. Shared period and scope filters
2. Period-activity cards
3. Current or period-end snapshot cards, where applicable
4. A small set of charts
5. A detailed table
6. Source drill-down
7. Filtered CSV export for Lead, Manager, or Admin-privileged users

Period activity and snapshot values must be visually separated. Historical snapshot values are labelled **As of [period end date]**.

### Tabs

- Tickets
- Designers
- Visual Work

Switching tabs preserves compatible period, people, and Area/Squad filters.

### Date presets

- This week
- Last week
- This month — default
- Last month
- Last 30 days
- Custom range

Week presets span Sunday through Saturday so manually logged Friday/Saturday work remains reportable. Stale and other working-day calculations still skip Friday and Saturday. Current-period presets end today rather than including future dates.

### People scope

| Position | Default |
|---|---|
| Designer | Me |
| Lead | My reporting group, including the Lead |
| Manager | My Manager group, including the Manager, reporting Leads, and their Designers |
| Viewer | All; read-only and without export; Viewer cannot hold Admin privilege |

A Lead or Manager can select All, another Lead/Manager group, or specific people. Admin privilege grants full access but does not replace the position-based default. Reporting groups are never visibility boundaries.

### Shared interaction rules

- Filters, selected tab, date range, and sorting are represented in the URL.
- Selecting a chart segment applies or refines the corresponding table filter.
- Every card and chart exposes its source records through drill-down where permissions allow.
- Charts use accessible labels and patterns/contrast rather than color alone.
- Mobile stacks cards and charts and converts wide tables into expandable records without changing definitions.
- No saved report configurations in the MVP.
- No Reports PDF in the MVP; the approved Work Item PDF remains separate.

## 2. Tickets report

### Period cards

- **Tickets worked on** — distinct tickets with valid work during the period
- **Completed** — tickets entering Done during the period
- **Reopened** — Done tickets moved to another status during the period

### Snapshot cards

- **Active workload**
- **Blocked**
- **Overdue**
- **Stale**

For historical ranges, reconstruct and label these as of the selected period end.

### Charts

1. **Recorded ticket activity over time** — distinct tickets with work by day or week.
2. **Completions and reopenings over time** — two clearly labelled series.
3. **Status distribution** — horizontal bars as of the period end.
4. **Tickets by Area/Squad** — horizontal bars, with status breakdown where legible.

Avoid pie charts and raw work-entry charts as primary visuals.

### Detail table

One row per ticket, never one row per ticket-designer relationship:

- Ticket ID and title
- Area/Squad
- Labels
- Status as of period end
- Primary assignee as of period end
- Contributors during the period
- Planned start and due date
- Due state
- First and last actual work date during the period
- Active work days during the period
- Work-entry count as secondary detail
- Completion and reopen counts during the period
- Active blocker as of period end and blocked duration during the period
- Subtask completed/total as of period end
- Archived state as of period end

Selecting a row reveals contribution by designer, primary/contributor activity, logged work types, status/assignment/blocker history, planned versus actual dates, and an Open Work Item action.

### Ticket filters

- Shared period, people, and Area/Squad
- Owned, Contributed to, or Owned or contributed to
- Status
- Labels
- Blocked
- Due state
- Stale
- Archived state
- Ticket work type

## 3. Designers report

Designer selection uses the normal people filter:

In this report, `Designer` is the work-attribution subject, not a restriction to the Designer organizational position. Leads and Managers appear when they own, contribute to, or log work. Their position and reporting line remain visible; Admin privilege does not create separate work credit.

- One person produces an individual report.
- Two people automatically produce aligned side-by-side values and charts.
- Three or more produce the neutral overview.
- Never show Compare, versus, winner, score, rank, or difference arrows.

### Period metrics per designer

- Tickets worked on
- Ticket active days
- Ticket-days
- Completed as primary
- Contributed tickets
- Primary ticket-days
- Contributor ticket-days

### Snapshot information

- Current/as-of-period-end active owned tickets
- Blocked owned tickets
- Overdue owned tickets
- Owned tickets without work during the selected period
- Last recorded work date
- Planned until
- Active owned tickets without due dates

### Charts

1. **Recorded ticket activity over time** — ticket-days by day/week, explicitly labelled as recorded activity rather than effort.
2. **Primary versus contributor activity mix** — aligned stacked bars using ticket-days.
3. **Logged activity by work type** — activity-day based, not hours.
4. **Logged ticket activity by Area/Squad** — ticket-days.

One- and two-person views use identical scales. Multi-person charts must not default-sort people by output; use alphabetical order.

### Detail sections

#### Owned work

- Ticket
- Status
- Due date
- Actual work dates
- Contributors
- Last worked on
- Blocked/overdue state

#### Contributions

- Ticket and primary assignee
- Area/Squad
- Contribution dates and work types
- First and last contribution date
- Current/period-end ticket status

#### Recorded ticket activity

The one-person view includes a period-filtered table across all tickets with one row per valid ticket work-log entry:

- Work date
- Ticket ID and title
- Area/Squad
- Work type
- Primary or contributor relationship on the work date
- Optional description
- Submitted by
- Logged at
- Corrected indicator/time where applicable
- Open Work Item

Credit belongs to the selected `worked_by` person. Show `Submitted by [name]` prominently when `logged_by` differs, without transferring credit to the submitter. Use corrected current values, exclude withdrawn entries, and sort by work date descending with logged-at time and entry ID as stable tie-breakers. The Work Item timeline remains the full ticket-specific audit narrative.

The table uses the shared period, person, and Area/Squad filters and may additionally refine by relationship or ticket work type. It is source drill-down, not a raw-entry productivity chart. On mobile, each row becomes an expandable record retaining the same fields and Open Work Item action.

#### Standalone visual activity

- Date
- Visual-work type
- Optional Area/Squad
- Optional description

Visual activity stays in a separate section and never increases ticket completion, ownership, contribution, or ticket-day values.

The recorded ticket activity table does not add a sixth CSV schema. The existing designer-ticket detail export remains one row per designer-ticket relationship with its defined activity dates and counts.

### Designer overview table

Use alphabetical order by default and show:

- Designer
- Organizational position
- Applicable reporting Lead
- Applicable reporting Manager
- Current/as-of active owned tickets
- Tickets worked on
- Ticket active days
- Ticket-days
- Completed as primary
- Contributed tickets
- Primary/contributor ticket-days
- Blocked and overdue owned tickets
- Owned tickets without period work
- Last recorded work date
- Planned until and active owned tickets without due dates
- Visual activity-days in a separate column group
- Overall active calendar days, clearly labelled

Do not provide output-ranked default ordering or a productivity column.

## 4. Visual Work report

Visual Work contains no ticket workflow concepts.

### Cards

- **Visual activity-days**
- **Visual entry count** — secondary activity detail
- **Designers with visual activity**
- **Areas/Squads represented**, including Unassigned

### Charts

1. **Visual activity over time** — visual activity-days by day/week.
2. **Activity by visual-work type** — activity-days.
3. **Activity by designer** — neutral alphabetical display.
4. **Activity by Area/Squad** — include Unassigned explicitly.

### Detail table

- Work date
- Designer
- Reporting Lead applicable on the work date
- Reporting Manager applicable on the work date
- Visual-work type
- Optional Area/Squad
- Optional description
- Logged by
- Logged at
- Edited indicator/time where applicable

Exclude ticket ID, status, assignee, contributor, completion, blocker, planned date, due date, subtask, and comment fields.

### Visual Work filters

- Shared period, people, and Area/Squad
- Visual-work type
- Logged by
- Edited state where useful for audit review

## 5. Export-current-view behavior

Export is available only to Lead, Manager, and Admin-privileged users in Reports.

- Export uses the selected report tab, date range, people scope, reporting group, filters, and sort order.
- Export includes every matching row, not only the current paginated/virtualized screen.
- Chart selections that refine the visible table also refine export.
- Withdrawn records are excluded.
- Stable export columns do not depend on screen width or responsive hiding.
- Each row repeats report metadata so a standalone CSV remains interpretable.
- Empty results export the defined header row without fabricated data.
- Filenames include report type and period, for example `tickets-summary_2026-07-01_2026-07-31.csv`.

Shared metadata columns on every CSV:

1. Report period start
2. Report period end
3. Snapshot at
4. Generated at
5. Generated by
6. People scope
7. Reporting group filter
8. Area/Squad filter

`Snapshot at` is blank for exports containing only period activity.

## 6. Exact CSV schemas

### Ticket summary CSV

After the shared metadata columns:

1. Ticket ID
2. Title
3. Area/Squad
4. Labels
5. Status at period end
6. Primary assignee at period end
7. Contributors during period
8. Planned start date
9. Due date
10. Due state at period end
11. First work date in period
12. Last work date in period
13. Active work days in period
14. Work entries in period
15. Completed transitions in period
16. Reopen transitions in period
17. Blocked at period end
18. Blocked calendar days in period
19. Completed subtasks at period end
20. Total subtasks at period end
21. Archived at period end

### Ticket activity detail CSV

After the shared metadata columns:

1. Work entry ID
2. Work batch ID
3. Ticket ID
4. Ticket title
5. Area/Squad
6. Work date
7. Worked by
8. Reporting Lead on work date
9. Reporting Manager on work date
10. Logged by
11. Primary assignee on work date
12. Relationship on work date — primary or contributor
13. Ticket status on work date
14. Work type
15. Description
16. Logged at
17. Last edited at

### Designer summary CSV

After the shared metadata columns:

1. Designer
2. Work email
3. Organizational position
4. Admin privilege
5. Reporting Lead at period end
6. Reporting Manager at period end
7. Reporting Leads during period
8. Reporting Managers during period
9. Active owned tickets at period end
10. Tickets worked on in period
11. Ticket active days in period
12. Ticket-days in period
13. Completed as primary in period
14. Contributed tickets in period
15. Primary ticket-days in period
16. Contributor ticket-days in period
17. Blocked owned tickets at period end
18. Overdue owned tickets at period end
19. Owned tickets without work in period
20. Last recorded work date
21. Planned until
22. Active owned tickets without due dates
23. Visual activity-days in period
24. Overall active calendar days in period

### Designer-ticket detail CSV

Use one row per designer-ticket-relationship type. A person who was both primary and contributor during the period receives separate rows.

After the shared metadata columns:

1. Designer
2. Reporting Lead during activity
3. Reporting Manager during activity
4. Ticket ID
5. Ticket title
6. Area/Squad
7. Relationship type — primary or contributor
8. First activity date in period
9. Last activity date in period
10. Ticket-days in period
11. Work types in period
12. Completed as primary transitions in period
13. Status at period end
14. Primary assignee at period end
15. Due date
16. Last worked on at period end

### Visual-work detail CSV

After the shared metadata columns:

1. Visual work entry ID
2. Work batch ID
3. Designer
4. Reporting Lead on work date
5. Reporting Manager on work date
6. Work date
7. Visual-work type
8. Area/Squad
9. Description
10. Logged by
11. Logged at
12. Last edited at

List-valued fields such as labels, contributors, reporting Leads/Managers, and work types use a documented delimiter and CSV escaping. Dates use ISO `YYYY-MM-DD`; timestamps use ISO 8601 with timezone.

## 7. Export menu by tab

- Tickets: Ticket summary CSV or Ticket activity detail CSV
- Designers: Designer summary CSV or Designer-ticket detail CSV
- Visual Work: Visual-work detail CSV

## 8. Acceptance criteria

- Period and snapshot metrics are visually and semantically distinct.
- Week presets include Sunday–Saturday data while working-day calculations skip Friday/Saturday.
- One/two/multi-designer views adapt automatically without competitive language or ranking.
- Ticket totals never duplicate a ticket because it has contributors.
- Visual activity remains separate from ticket metrics everywhere.
- Every chart and aggregate can reveal supporting records.
- Export applies the complete visible filter/sort state and includes all matches beyond the current screen page.
- CSV headers, date/timestamp formats, relationship semantics, and metadata match this specification.
- Withdrawn records and bodies never appear in normal reports or exports.
