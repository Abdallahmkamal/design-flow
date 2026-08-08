# Reports brief

**Status:** Approved, implemented, and staging-reconciled

**Route:** `/reports`

**Phase:** 6 — Reports and Exports

> **Team-ready amendment (2026-08-08):** Modernization Slice 7 and `team-ready-ui-handoff.md` supersede scope defaults, responsive presentation, and the five-export menu. Designer without Admin is self-only and may export only personal authorized data; Viewer remains whole-team read-only and cannot export. One direct tab-aware CSV action produces the reconciled three schemas with one Primary Assignee and no Priority.

## Purpose and users

Provide explainable Tickets, Designers, and Visual Work reporting over the
approved team-readable sources. Every valid active principal may read Reports.
Viewer and Designer remain read-only; CSV controls appear only for Lead,
Manager, or an eligible Admin overlay. Position determines the initial people
scope and Admin never changes that default. Inactive, password-restricted, and
Viewer+Admin states remain outside the normal application boundary.

## Information hierarchy and report behavior

1. Heading, report period, people scope, Area/Squad, and tab navigation.
2. Period-activity cards, visually separate from snapshot cards labelled
   `As of <period end>`.
3. A small approved set of bar/line charts with an always-available semantic
   summary/table over the same values.
4. The current tab's detailed table or structured mobile records.
5. Source drill-down and authorized current-view CSV controls.

The default is This month, ending today. Week presets span Sunday–Saturday;
working-day calculations still skip Friday/Saturday. URL state owns tab, period,
scope, reporting group, filters, refinements, sorting, and pagination. Compatible
period/people/Area filters survive tab changes. Planned dates, actual
`work_date`, and system timestamps retain separate labels and formulas.

## Tab-specific content

- **Tickets:** the three period cards, four snapshot cards, four approved charts,
  and one row per ticket. Contributors never duplicate ticket totals. Row/source
  disclosure shows attribution, work types, status/assignment/blocker history,
  and planned versus actual dates with an Open Work Item link.
- **Designers:** one person produces the individual view and recorded-activity
  source table; two people use aligned identical scales; three or more use the
  alphabetical neutral overview. No rank, score, difference arrow, Compare, or
  output-sorted default. `worked_by` owns credit and `logged_by` remains visible
  as submitter. Standalone Visual Work remains a separate section/column group.
- **Visual Work:** the four approved activity cards, four approved charts, and
  one row per valid standalone entry/date. Ticket lifecycle, planned-date,
  assignee, contributor, blocker, subtask, and comment concepts never appear.

Every card, chart segment, table row, and aggregate exposes controlled source
records. Chart selection refines the same URL-backed table filters. A visible
labelled control provides every refinement so charts are never the only input.

## Components and ownership

Reuse `Button`, `Input`, `Select`, `Checkbox`, `Badge`, `Avatar`, `DataTable`,
and `Pagination`. Add the approved Design Flow-owned `TabList` described in the
Phase 6 component map. Reuse the Dashboard/All Tickets people-scope domain,
calendar helpers, status buckets, source links, and corrected valid work-log
rules rather than re-deriving them in React.

Feature-own `ReportFilters`, `ReportMetricCards`, `ReportChartFrame`,
`ReportAccessibleTable`, `TicketReport`, `DesignerReport`,
`RecordedTicketActivity`, `VisualWorkReport`, and source-disclosure
compositions. Recharts remains behind the reports feature and consumes
centralized chart-token roles; shared UI never imports it or calls Supabase.

## Desktop, mobile, and interaction

Desktop uses the three-tab frame, wrapping filter toolbar, compact metric grid,
bounded chart grid, and semantic comparison/detail tables. Below `48rem`,
filters and cards stack, charts remain labelled, and wide tables become
expandable structured records preserving fields, source links, sort meaning,
and alphabetical order. No definition changes by viewport.

Tab arrow keys plus Home/End follow the ready Tab List reference. Native links
and buttons are the only row keyboard destinations; pointer row activation may
remain a convenience. Filter changes update the URL, reset dependent pagination,
and announce the refreshed result count/range. Charts expose names/descriptions
and an adjacent semantic equivalent; focus never depends on SVG marks.

## Required states

- Loading preserves headings, selected controls, and period/snapshot labels;
  affected regions are busy and do not present stale totals as current.
- Empty distinguishes no controlled source data from filtered no-results.
- Errors are region-scoped where possible, retain URL state, and offer Retry.
- Viewer/Designer are normal report readers without disabled or hidden-export
  placeholders. Unauthorized account states use the auth boundary.
- Long names, titles, labels, descriptions, and axis text wrap or disclose
  without hiding source actions. Large sources paginate with stable ordering.

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

## References and acceptance

Use `references/astryx/{tab-list,reporting-patterns,table,pagination,button,input,select,checkbox,badge,avatar,patterns,accessibility}.md`.
Vodafone color/type and the existing data-visualization appendix remain
authoritative. The documented absence of an Astryx chart component prevents any
unsupported chart-fidelity claim.

Acceptance requires exact controlled-fixture reconciliation for every card,
chart/table alternative, filter, sort, row, and drill-down; all valid positions
and Admin overlays; global denial states; Sunday–Saturday period and
Sunday–Thursday threshold edges; corrected/withdrawn attribution; responsive,
keyboard, axe, Light/Dark, empty, loading, error, and long-content behavior.

## Open questions

None. Material changes require a new readiness decision.

## Verified progress

Implemented through merged PR #20 (`a879af4`): the three report views,
Sunday–Saturday presets, URL-backed scopes/refinements, historical snapshot
labels, source tables, Recharts views with exact semantic table alternatives,
mobile records, and capability-gated all-row CSV. Local evidence on 2026-07-26:
93 unit/component tests, 400 pgTAP/RLS assertions, 26 applicable Playwright/axe
scenarios with two device-specific skips, 16 Edge Function tests, strict
typecheck, lint, formatting, generated types, and production build. Workflow
#50 passed the complete staging gate and deployed the merged Phase 6 build.
The opt-in Phase 6 fixture also passed a clean local load with nine Areas,
fourteen tickets, twenty batches, fifty entries, all six statuses, and its
internal count checks. The same guarded fixture passed two staging loads for
idempotency and reconciled to nine personas, nine Areas, fourteen tickets,
twenty batches, fifty entries, all six statuses, and zero non-synthetic
profiles. Hosted all-people source totals were 13 Tickets, seven Designers,
and six standalone Visual Work entries. It remains separate from the automatic
test seed.
