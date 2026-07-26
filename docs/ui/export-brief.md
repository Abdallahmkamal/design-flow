# Reports and Work Item Export brief

**Status:** Approved, implemented, and staging-reconciled

**Surfaces:** `/reports`, `/work-items/:displayId`

**Phase:** 6 — Reports and Exports

## Purpose and permissions

Provide portable, complete CSV files for the approved Reports views and a
human-readable PDF snapshot/history for a visible Work Item. Reports CSV is
available only to Lead, Manager, or an eligible Admin overlay. Work Item PDF is
available to Designer, Lead, Manager, or an eligible Admin overlay. Viewer has
neither export capability and sees no placeholder control.

Every export request rechecks the global gates and capability server-side.
Inactive, password-restricted, Designer-without-Admin CSV, Viewer, and rejected
Viewer+Admin states receive no export data. Export functions cannot widen the
normal visible record set. The Designer-summary work-email field is exposed
only through its approved authorized export projection.

## Reports CSV experience

The Reports action region shows a labelled export-type `Select` and `Export
CSV` Button: two types on Tickets, two on Designers, and the single Visual Work
type preselected. This avoids a new menu primitive while preserving the exact
tab-specific export choices.

Export captures the current tab, period, people scope, reporting group,
Area/Squad, all refinements including chart-derived filters, and sort order. It
contains every matching row beyond the visible page, repeats the eight shared
metadata fields, uses the five locked schemas and ISO formats, documents the
list delimiter, applies CSV escaping, excludes withdrawn rows/bodies, and emits
the header row for an empty result. Filenames use the approved report-type and
period pattern.

While generating, the controls remain labelled and expose progress without
showing partial data. Success starts one local download and announces the exact
export type. Failure preserves report state and offers Retry. Repeated clicks
while one request is active do not start duplicate downloads.

## Work Item PDF experience

`Export work item` appears with the existing Work Item actions only when the
server capability is true. Activating it reveals an in-page export region with
an `Include comments` Checkbox off by default, a primary `Download PDF` Button,
and Cancel. No Modal, Drawer, or hidden overflow-menu dependency is introduced.

The PDF contains the approved identity/generation metadata, current snapshot,
planned and actual dates, Figma URL as a link without fetching content,
blockers, subtasks, chronological valid work, status/assignment history, and
meaningful field events. Comments appear only when opted in. Withdrawn content
is represented only by sanitized withdrawal events; former bodies and revision
tables never enter the browser payload or PDF. Ticket work, comments, and
system timestamps remain distinct.

The PDF uses a stable `work-item_<display-id>_<generated-date>.pdf` filename,
clear page headings, repeated ticket/page context, page numbers, wrapping, and
continuation across pages. Download generation is deterministic from the
authorized sanitized export payload and does not contact Figma or external
services.

## Components, boundary, and accessibility

Reuse `Button`, `Select`, and `Checkbox`; export status uses semantic text/live
status rather than a new shared component. Feature-own `ReportExportControl`,
CSV serialization/download, `WorkItemExportPanel`, and PDF document rendering.

Dedicated security-definer read functions authorize and return only the fixed
export projections. Reports CSV reads are unpaginated but bounded by the
current filter contract; the Work Item function accepts the visible ticket and
comments flag. Browser code receives no base-table or revision access and never
uses service-role credentials. Export is a read/download operation, not a
direct table write or mutation RPC.

Controls keep native Tab/Space/Enter behavior, labelled progress, visible
focus, and an error summary. Cancel returns focus to `Export work item`.
Generated PDF structure and links are verified by text extraction and rendered
page inspection in addition to source-value reconciliation.

## Required states

- Authorized idle, generating, success-announced, empty CSV, and retryable
  failure states.
- Viewer/Designer CSV and Viewer PDF controls are absent, not disabled teasers.
- Server denial after a permission/account change discards any response and
  starts no download.
- Long titles, descriptions, labels, comments, and histories wrap/page without
  clipping, overlap, missing sections, or exposed withdrawn content.
- Mobile keeps export controls in document order and uses the same schemas and
  PDF content as desktop.

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

## Acceptance

Reconcile every CSV header/field/row/order/metadata value and every PDF value to
controlled fixtures. Prove all-row export beyond the UI page, current-view
filter/sort preservation, delimiter/escaping/ISO behavior, empty headers,
permission overlays and global denials, visibility isolation, corrected and
withdrawn behavior, comments default/opt-in, no Figma fetch, responsive and
keyboard behavior, axe coverage, PDF extraction/rendering, and one-download
retry behavior.

## Open questions

None. Material changes require a new readiness decision.

## Verified progress

The five locked CSV projections use the authorized unpaginated RPC and repeat
the eight metadata fields. The Work Item PDF uses a sanitized authorized
projection, keeps comments opt-in, lazy-loads its renderer, and never fetches
Figma. A labelled synthetic three-page fixture passed text extraction and
rendered-page inspection for wrapping, continuation, links, planned/actual/date
separation, history, comments, and page context; the temporary fixture was
removed. The complete local counts are 93 unit/component tests, 400 pgTAP/RLS
assertions, 26 applicable Playwright/axe scenarios with two device-specific
skips, and 16 Edge Function tests. Workflow #50 deployed merged PR #20
(`a879af4`) through the complete staging gate.
The guarded lightweight acceptance fixture loaded locally with fifty matching
work-log entries plus two sanitized PDF comments; exact CSV/PDF reconciliation
against that fixture passed under the preserved synthetic Manager + Admin:
ticket summary 13 rows, ticket activity 44, designer summary seven,
designer-ticket detail fourteen, and standalone Visual Work six. Hosted PDF
generation passed with comments off by default and opt-in; DF-000007 reconciled
to sixteen actual work dates, one history event, zero default comments, two
opt-in comments, and no raw events/comments/capabilities in the sanitized Work
Item projection.
