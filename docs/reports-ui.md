# Reports UI and export specification

**Version:** 1.4
**Decision date:** 2026-08-15
**Status:** Approved MVP report content with D-110 scope/export and D-118 metric/archive amendments

**Implementation note (2026-08-12):** Slice 7 was implemented locally in the
combined Slices 7–8 run on `codex/ui-modernization-reports-settings`. The owned
Tabs, Chart, Table, and Alert Dialog primitives live under `src/ui/primitives/`;
Charts remain Recharts-backed with exact-value semantic tables. Applied report
context appears as plain slash-separated text in one compact filter container;
all fields are edited through a responsive side overlay with draft, Reset,
Cancel, and Apply behavior and no removable chips. The three-tab strip and
contained tables scroll without page-level overflow at the 390 px target. The
contextual export inside the filter container uses the exact schemas below
and the `20260812100000_modernize_reports_scope_and_exports.sql` migration
activates the D-110 server scope/export boundary. Publishing is not implied by
this local implementation record.

Reports turns the approved reporting definitions into three usable views: Tickets, Designers, and Visual Work. Every value must remain traceable to source records and must not imply that recorded activity equals effort, quality, complexity, or performance.

## 1. Shared report frame

Each report uses the same hierarchy:

1. Shared period and scope filters
2. Period-activity cards
3. Current or period-end snapshot cards, where applicable
4. A small set of charts in a balanced two-column desktop grid
5. A detailed table
6. Source drill-down
7. One direct, tab-aware filtered CSV export for every export-authorized scope

The Reports header contains only the title and does not repeat the
report-definition disclaimer. A compact filter container presents applied
values as plain slash-separated text and contains a neutral **Edit filters**
action plus a dominant black **Export CSV** action when authorized. The filter
overlay's Period and People fields reuse the same `FormSelect` and
`FormDatePicker` anatomy as Log Work. Labels use the matching dropdown field
with a scrollable multi-select list rather than an exposed checkbox group.

Period activity and snapshot values must be visually separated. Historical snapshot values are labelled **As of [period end date]**.
The snapshot date and period-activity range occupy two deliberate text lines on
every report tab.

### Tabs

- Tickets
- Designers
- Visual Work

Switching tabs preserves compatible period, people, and Area/Squad filters.

### Date presets

- Month to date — default
- Last month
- Last 3 months, including month to date
- Last 6 months, including month to date
- Custom range

Week presets span Sunday through Saturday so manually logged Friday/Saturday work remains reportable. Stale and other working-day calculations still skip Friday and Saturday. Current-period presets end today rather than including future dates.

### People scope

| Position | Default |
|---|---|
| Designer | Me |
| Lead | My reporting group, including the Lead |
| Manager | All people |
| Viewer | All; read-only and without export; Viewer cannot hold Admin privilege |

Designer without Admin is restricted to Me at the authorization boundary, including URL/RPC inputs and personal CSV. Lead without Admin defaults to My reporting group and may select All or Me. Manager and every Admin-privileged principal default to All and may select individual reporting groups or Me. Viewer remains All/read-only and cannot export. These changes become effective only when modernization Slice 7 is deployed; reporting groups remain filters rather than tenant boundaries for broader-authorized principals.

### Shared interaction rules

- Filters, selected tab, date range, and sorting are represented in the URL.
- Selecting a chart segment applies or refines the corresponding table filter.
- The detailed source section remains the controlled record destination. Summary
  cards reveal a compact matching-source preview on desktop hover/focus and
  mobile tap without replacing their period label; chart frames do not repeat
  source-anchor links.
- Charts use accessible labels and patterns/contrast rather than color alone.
- Desktop presents charts as a balanced two-by-two grid. Mobile presents both
  compact metric cards and charts as contained horizontal snap scrollers with a
  partial-next-card cue; metric cards use two scroller rows and reveal the same
  matching-source preview on tap that desktop exposes on hover. Wide tables become collapsed, expandable All
  Tickets-style records without changing definitions.
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

Chart exact-value tables remain in the accessibility tree but are visually hidden to avoid duplicating every plotted value below the chart. The visible detailed report table uses the same sticky-header, bordered-cell presentation as All Tickets and retains structured mobile records.

### Detail table

One row per ticket, never one row per ticket-designer relationship:

- Ticket ID and title
- Area/Squad
- Labels
- Status as of period end
- Primary assignee as of period end
- Contributors during the period
- Planned Start Date and Next Deadline
- Due state
- First and last actual work date during the period
- Canonical Days Open and Days Active at the snapshot
- To Do Days, In Progress Days, Review Days, and Paused Days using end-of-day ownership
- Work-entry count as secondary detail
- Completion and reopen counts during the period
- Active blocker as of period end and blocked duration during the period
- Subtask completed/total as of period end
- Archived state as of period end

Selecting a row reveals contribution by designer, primary/contributor activity, logged work types, status/assignment/blocker history, planned versus actual dates, and an Open Work Item action.

### Ticket filters

The archived-state filter defaults to **Not archived**. Choosing **Archived** or **All** explicitly overrides that default and applies the same scope to cards/counts, charts, source previews, detail rows, pagination, and CSV export. URL-backed filter state preserves an explicit override.

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
- Active owned tickets without next deadlines

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
- Next Deadline
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

The recorded ticket activity table does not add another CSV schema. Under D-110, the Designers tab has one contextual one-row-per-designer export; detailed activity remains visible and traceable in the UI and ticket history rather than a separate export choice.

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
- Planned until and active owned tickets without next deadlines
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

Exclude ticket ID, status, assignee, contributor, completion, blocker, planned date, next deadline, subtask, and comment fields.

### Visual Work filters

- Shared period, people, and Area/Squad
- Visual-work type
- Logged by
- Edited state where useful for audit review

## 5. Team-ready contextual export behavior

Reports owns one direct **Export CSV** action in the compact filter container. All Tickets has no CSV action.

- The active tab selects the Designers, Tickets, or Standalone Visuals row model; there is no Summary/Detail menu.
- Export uses the visible Period, People scope, optional filters, and authorization boundary and includes every matching row beyond the visible page.
- Designer without Admin exports only their own permitted data. Lead, Manager, and Admin export their authorized selected scope. Viewer is denied by server authorization even if a request is forged.
- Use human-readable values, ISO `YYYY-MM-DD` dates, one consistent empty representation, semicolons for multiple names/labels, and normal CSV escaping.
- Withdrawn records and bodies remain excluded.
- Filenames identify the active tab and period: `design-flow-designers_<start>_to_<end>.csv`, `design-flow-tickets_<start>_to_<end>.csv`, or `design-flow-standalone-visuals_<start>_to_<end>.csv`.

## 6. Exact team-ready CSV schemas

### Designers-tab CSV

One row per designer in the permitted People scope; Designer without Admin receives only their own row.

1. Designer
2. Reporting Group
3. Period Start
4. Period End
5. Tickets Assigned
6. Tickets Contributed To
7. Open Tickets
8. Completed Tickets
9. Work Log Entries
10. Active Workdays
11. Standalone Visual Entries
12. Last Recorded Work Date

`Tickets Contributed To` counts distinct tickets with valid work by the designer. `Active Workdays` counts distinct historical work dates. `Completed Tickets` counts tickets completed within the selected Period.

### Tickets-tab CSV

One row per filtered ticket:

1. Ticket
2. Area
3. Status
4. Primary Assignee
5. Contributors
6. Labels
7. Planned Start Date
8. Next Deadline
9. First Worked Date
10. Last Worked Date
11. Days Open
12. Days Active
13. To Do Days
14. In Progress Days
15. Review Days
16. Paused Days
17. Work Log Entries
18. Last Activity
19. Figma URL
20. Archived

One primary assignee remains the schema contract; contributors are derived. The reviewed multi-assignee direction is consciously deferred until after rollout. Priority remains absent.

### Standalone-Visuals-tab CSV

One row per dated standalone visual entry; a multi-date submission produces one row per historical work date.

1. Work Date
2. Designer
3. Reporting Group
4. Work Type
5. Description
6. Recorded At

Sort primarily by Work Date. Recorded At remains audit information.

## 7. Responsive tab/export presentation

- Use the shared tabs for Designers, Tickets, and Standalone Visuals and preserve the active tab while context/filters change.
- Keep all three tabs reachable on mobile through horizontal scrolling rather than compression or awkward wrapping.
- Wrap the slash-separated applied values naturally and stack the Edit filters
  and Export CSV actions without clipping.
- Inset the desktop Edit filters overlay by exactly `24px` from the viewport
  top, right, and bottom; mobile retains its full-width, full-height treatment.
- Use the shared `16px` overlay radius for the inset desktop surface rather than
  an isolated drawer radius.
- Report tables become structured record cards on mobile while preserving every field and action.
- Keep desktop charts/cards bounded and use contained horizontal snap scrollers
  on mobile without creating page-level horizontal overflow.
- Period presets are Month to date, Last month, Last 3 months including the
  current month to date, Last 6 months including the current month to date, and
  Custom range. Multi-month presets begin on the first day of the earliest
  included calendar month and end today.
- Each populated chart card exposes exactly one `Filter by` composer. Its
  selectable chart values refine the URL-backed report; exact-value table labels
  remain plain semantic row headers rather than exposed filter actions.
- Status-distribution bars use centralized muted chart-status colors that retain
  the workflow mapping. Other report charts use the centralized muted, non-red categorical chart palette; chart
  color remains supplemented by labels, exact values, and line-dash differences.
- Modernization Slice 7 must close the known 390 px page-level overflow and record the responsive regression evidence.
- Do not render an empty summary-card grid when a response has no summary cards;
  Charts follows the summary explanation at normal spacing.

## 8. Acceptance criteria

- Period and snapshot metrics are visually and semantically distinct.
- Week presets include Sunday–Saturday data while working-day calculations skip Friday/Saturday.
- One/two/multi-designer views adapt automatically without competitive language or ranking.
- Designer without Admin cannot broaden Me through UI, URL, direct RPC, drill-down, or export; their CSV contains only personal authorized rows.
- Viewer can read whole-team Reports but every CSV request is denied by authorization, not only by UI visibility.
- Lead without Admin defaults to their reporting group with All/Me available; Manager and Admin default to All.
- Ticket totals never duplicate a ticket because it has contributors.
- Visual activity remains separate from ticket metrics everywhere.
- Every chart and aggregate can reveal supporting records.
- Export applies the complete visible filter/sort state and includes all matches beyond the current screen page.
- CSV headers, date/timestamp formats, relationship semantics, and metadata match this specification.
- The active tab produces exactly one contextual schema; Tickets CSV uses one Primary Assignee, has no Priority, and All Tickets exposes no CSV action.
- Withdrawn records and bodies never appear in normal reports or exports.
