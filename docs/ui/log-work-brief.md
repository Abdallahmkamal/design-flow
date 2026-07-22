# Log Work flow

**Status:** Approved for Phase 4 implementation — 2026-07-22
**Scope:** Phase 4 Work Logging only
**Prepared:** 2026-07-22

## Purpose

Capture actual ticket work by default, or secondary standalone Visual Work,
without confusing actual work dates with planned dates or system timestamps.
The same flow supports audited correction and withdrawal; it does not expose
Phase 5/6 work, notification, export, or reporting controls.

## Primary users and entry points

Active Designer, Lead, Manager, and their valid Admin overlays may submit.
Viewer has no Log Work entry point and is read-only. Inactive,
password-restricted, and rejected Viewer+Admin accounts are handled by the
existing auth boundary before this feature loads.

Entry is `/work-logs/new` from the authenticated shell, All Tickets' permitted
Log Work action (with its ticket selected), and the Work Item permitted Log
Work action. Correction opens `/work-logs/:batchId/edit` from an eligible Work
Item history event. Successful ticket work returns to the authoritative Work
Item; standalone work returns to its Log Work confirmation. Creation returns to
the preserved ticket-mode draft, not a submitted state.

## Flow and fields

Ticket mode is the initial mode and shows, in order: title/context, searchable
ticket selection, `Worked by`, one date-row list, the optional once-per-batch
blocker action, independently authorized optional status change, then Submit.
Ticket search is a feature-owned Input plus explicit result buttons, not a new
generic typeahead or an overloaded Select. Results expose ticket ID, title,
status, and primary assignee; selecting one has a visible selected state.

Each submission has one to five ordered rows. A row has native `date`, required
controlled work type, optional detail, and remove action (except the required
first row). It defaults to the team-local current date; future dates are
invalid. Friday/Saturday are valid only through manual date entry and receive
help text rather than a prohibition. An optional Apply to all action copies a
chosen type only; every row remains independently editable. Ticket vocabulary,
visual vocabulary, and optional Other detail are exactly those in
`product-spec.md` and `data-model.md`.

The secondary `Log standalone Visual Work` action switches the same unsaved
form to visual context after an explicit discard-or-continue decision only when
ticket-only values are present. Visual context replaces ticket/blocker/status
fields with optional active Area/Squad and the visual work vocabulary. It has
no ticket lifecycle, assignee, contributor, planned-date, or status content.

`Worked by` defaults to the actor. It is shown as a read-only identity for a
Designer and a bounded eligible-person Select for Lead, Manager, or Admin.
Correction shows the same complete current batch form plus context-aware
withdraw action. Withdrawal is a visible labelled destructive action with an
in-context confirmation; it is not a restore path.

## Integrated ticket operations

`Create New Ticket` appears only in ticket mode and only when the existing
create capability is present. It launches the existing creation route with a
return marker while retaining every unfinished Log Work value in client state.
On a successful independent creation it restores the draft with that ticket
selected; it neither submits work nor changes status.

The optional status Select is shown only after the selected ticket's
authoritative `can_edit_work_item` capability says it is available. Submit
first invokes `submit_work_log` with its own operation ID. After success, the
client refreshes the Work Item and invokes the independent status transition
with a distinct ID/current version only when still needed. A failed log retains
the draft and prevents transition. A failed transition leaves the submitted log
committed, announces partial success, and offers only status retry.

## Work Item integration

Phase 4 extends the existing Work Item page with a **Work Dates** index and
complete work-log events in the vertical timeline. The index contains only
valid actual ticket work dates, runs first-to-last chronologically in five
desktop columns, combines multiple people/entries per date, and links each cell
to its timeline date. It displays a compact initials/count summary and work-type
summary; it is not a planned calendar. Mobile uses fewer visible columns with
horizontal movement while retaining date order and the same destination.

Timeline work events show actual work date, `worked_by`, primary/contributor
relationship effective on that date, work type, optional description, and
submitted/corrected metadata. Normal history and normal reports hide withdrawn
bodies; withdrawal/correction remains explicit audit metadata.

## Layout and responsive behavior

The two Log Work routes are focused full-page forms, preserving deliberate
context and resilient draft recovery. Desktop uses one readable form column
with a compact contextual ticket summary; date rows preserve field alignment.
On narrow screens fields stack in their existing semantic order, date-row
actions remain adjacent to their row, the primary submit stays after all fields,
and a sticky action area is used only when it does not obscure an invalid field
or keyboard target. The Work Dates grid changes to horizontally reachable
columns rather than pretending to be a desktop calendar.

## Components and reference patterns

Reuse `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Badge`, `Tooltip`,
and the existing Work Item timeline composition. The feature owns
`LogWorkForm`, `TicketPicker`, `WorkDateRows`, `WorkDatesGrid`, and
`WorkLogTimelineEvent`; feature components call the domain/API layer, never
Supabase directly.

Add one shared noninteractive `Avatar` initials/image fallback primitive for
the Work Dates summaries. Its source-linked proposal is
`references/astryx/avatar.md`; group overflow is feature-owned and opens no
popover in Phase 4. Existing ready Input, Select, Textarea, Button, Badge,
Tooltip, Table, and accessibility notes supply their documented geometry and
keyboard behavior. No Modal, Drawer, Radio, Calendar, Typeahead, Tabs, or
generic AvatarGroup is introduced.

## Interaction, states, and accessibility

Native fields preserve Tab/Shift+Tab, date entry, selection, and Enter/Space
behavior. Result buttons have descriptive ticket labels; selection is announced
through the selected summary. Add/remove/apply actions have explicit names.
Submission focuses the error summary then the first invalid field. Status/error
and partial-success messages are polite, textual live feedback. The creation
return restores focus to the selected ticket summary; cancellation returns to
the launch control. A Work Dates cell is a native link/button with an accessible
date, people count, and work-type summary.

Loading keeps field layout and disables duplicate submission. Ticket search has
loading, no-result, and retry states inside its labelled region. Initial empty
ticket availability explains that no unarchived ticket can be selected and
offers Create New Ticket only when authorized. Network, validation, conflict,
and permission errors preserve the draft and explain the recovery; a stale
correction refreshes authoritative values before retry. Long names/descriptions
wrap in form/timeline; rows do not hide required actions. Disabled controls
include a reason; forbidden controls are absent rather than disabled.

## Audit and acceptance criteria

Each successful submit/correct/withdraw follows its approved RPC contract,
history, audit, idempotency, and recalculation effects. The UI never sends
`logged_by`, status targets, or ticket-creation fields to `submit_work_log`.

- Ticket default, Visual Work secondary mode, 1–5 date rows, no future dates,
  manual weekend dates, controlled vocabularies, and optional detail work on
  desktop, mobile, keyboard, and both themes.
- Every valid role has its approved own/on-behalf/correct/withdraw behavior;
  Viewer, inactive, password-restricted, and Viewer+Admin paths are denied.
- Create New Ticket restores the full unfinished draft and selects only the
  independently created ticket; optional status handles success/failure
  separately from logging.
- Work Dates/timeline show actual dates, contributor attribution, corrections,
  and withdrawal metadata without exposing withdrawn content or Phase 5/6 UI.
- Staging verification will compare the implemented flow against this brief.

## Open questions

None after approval. Approval authorizes the full-page route presentation and
the documented Avatar fallback; it does not authorize implementation yet.
