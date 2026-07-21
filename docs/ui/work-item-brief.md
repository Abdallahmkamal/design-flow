# Work Item brief

**Status:** Approved for Phase 3 implementation on 2026-07-21

**Routes:** `/work-items/:displayId`, `/work-items/:displayId/edit`

**Phase:** 3 — Work-item Foundation

## Purpose

Show the authoritative current state and Phase 3 lifecycle of one Work Item,
and expose only the lifecycle actions the current principal may perform.

## Primary users and permissions

- Every valid active principal may read a visible current or archived Work Item,
  safe lifecycle history, visible comments, and Figma URL.
- Viewer is read-only.
- Designer may edit/status/reassign/subtask an own/related Work Item, may create
  or resolve a blocker on any visible Work Item, and may add comments.
- Lead, Manager, or Admin privilege grants whole-team lifecycle authority;
  archive/restore requires one of those authorities.
- Capability flags returned by `get_work_item_detail` drive presentation. UI
  position labels never substitute for server authorization.

## Entry points

- Ticket ID/title or row/card space from All Tickets.
- Successful ticket creation navigates to the returned display ID.
- Direct authenticated URL using stable display ID.
- Edit action opens `/work-items/:displayId/edit`; Cancel/success returns to the
  same detail route.
- Notification, Work Dates, and recorded-activity deep links are deferred.

## Primary and secondary actions

- Header: Figma when present, Edit when permitted, and eligible Archive/Restore.
- Controlled lifecycle: status and assignee changes.
- Blocker: create or resolve according to current state/capability.
- Subtasks: add, rename, move up/down, complete/reopen, withdraw.
- Comments: add; author edit/withdraw; Lead/Manager/Admin moderation withdrawal.
- No Log Work, Work Dates, export, notification, or work-log correction action
  appears in Phase 3.

## Information hierarchy

1. Two-level header and at-a-glance summary.
2. Prominent active blocker when present.
3. Details and description.
4. Subtasks.
5. Phase 3 lifecycle timeline.
6. Comments.

The Phase 4 Recorded work overview/Work Dates section is deliberately omitted,
so the remaining order closes up without an empty placeholder.

## Header and details content

Primary row:

- display ID and title;
- workflow Badge plus separate Blocked/Archived indicators;
- independent Figma link;
- Edit and eligible Archive/Restore.

Summary row:

- Area/Squad and labels with visual overflow;
- primary assignee and derived contributors;
- due date with overdue/due-soon text;
- subtask completion badge; and
- Active work days as a read-only derived count.

Details:

- description;
- Area/Squad, primary assignee/contributors, planned start, due date, labels,
  Figma direct link, and created date;
- first actual work date, Last worked on, and Last activity when present.

Planned dates and actual work dates have separate labels/groups. No continuous
effort is implied between planned start and due date.

## Business rules

- `get_work_item_detail(display_id text)` returns safe current data, sanitized
  Phase 3 events, visible comments/withdrawal markers, and capability flags.
- Core edit, reassign, transition, archive, restore, blocker, subtask, and
  comment operations use their unchanged RPC contracts, operation IDs,
  expected versions/state, lock order, and exactly-once effects.
- Active statuses require an eligible assignee. Backlog, Paused, and Done cannot
  coexist with an active blocker. Done with incomplete subtasks requires an
  explicit acknowledgement but remains allowed.
- Only Backlog, Paused, or Done may be archived. Archived Work Items reject new
  Phase 3 writes until authorized restore.
- Withdrawn comments/subtasks and resolved blockers are never hard-deleted.
  Normal reads never expose a withdrawn comment body or restricted revisions.

## Editing core fields

- Edit uses the full-page WorkItemForm with current title, description,
  Area/Squad, planned start, due date, labels, and Figma URL.
- Status and assignee are excluded from the edit payload and remain separate
  controlled lifecycle operations.
- The form preserves changes on validation, network, or conflict failure.
  Successful update refreshes detail and focuses the updated heading/summary.

## Status and assignee controls

- Each control opens an in-context labelled form/panel; no Modal or Popover is
  used for these consequential actions.
- Status lists all valid different MVP statuses but the server rechecks current
  assignee, blocker, archive, and capability state.
- Selecting Done while current subtasks are incomplete reveals a required
  acknowledgement Checkbox naming the consequence.
- Reassignment permits `Unassigned` only when the resulting status allows it.
- Conflict keeps the requested value visible, refreshes authoritative current
  state, explains what changed, and requires deliberate resubmission with a new
  operation intent/version.

## Active blocker

- When active, show reason, creator/time, optional expected-resolution date,
  and Resolve where permitted in a prominent early panel.
- Create blocker is available to any active non-Viewer only when the ticket is
  unarchived, in To do/In Progress/In Review, and has no active blocker.
- Create uses required plain-text reason and optional expected-resolution date.
  Resolve uses optional plain-text resolution note.
- Resolved blockers move into the lifecycle timeline and cannot be reopened.

## Subtasks

- Show the full one-level current checklist with completed/total progress.
- Authorized users may add/rename, complete/reopen, withdraw, and reorder.
- Reordering uses visible Move up/Move down Buttons and announces the new
  position; it does not use drag-and-drop. First/last boundaries disable only
  the impossible direction.
- Rename and withdraw use in-context forms/confirmations that preserve focus and
  identify the subtask. Withdraw is soft and has no restore action.
- Completing every item never changes parent status.

## Lifecycle timeline

Phase 3 includes creation, core/label changes, assignment, status/reopen,
blocker create/resolve, subtask changes, archive, and restore. Events are
chronological, identify actor/time, and use safe display values. Comment content
and comment lifecycle markers remain in the separate Comments section.

Work-log submit/correct/withdraw events and the final integrated work-history
presentation remain Phase 4/5. Existing fixture/read data may influence derived
dates and contributor counts, but Phase 3 does not render a partial Work Dates
or work-log timeline UI.

## Comments

- Visible plain-text comments appear oldest to newest with author and timestamp.
- Any active non-Viewer may add to an unarchived ticket.
- Only the author edits the current body. Author, Lead, Manager, or Admin may
  withdraw; another person can never rewrite the author's body.
- Edited state is explicit. Withdrawn state displays author/time and a
  withdrawal marker without former body; it cannot be edited or restored.
- Comment forms use Textarea, retain drafts on failure, and move focus to the
  added/updated comment or confirmation after success.

## Components to reuse, extend, or create

- Reuse Button, Input, Select, Checkbox, Badge, and SkipLink.
- Reuse Textarea, Tooltip, and the feature-owned FigmaLink from the Phase 3 map.
- Feature-own WorkItemStatusBadge, WorkItemForm, BlockerPanel, SubtaskList,
  LifecycleTimeline, and CommentThread.
- Popover/Pagination/DataTable are not required on detail. Modal, Drawer, Tabs,
  Avatar, Radio, and Work Dates remain deferred.

## Desktop layout

- Primary and summary header rows span the page. Figma and permitted actions
  stay visually associated with the title without crowding it.
- Content follows the approved hierarchy. Details may use a secondary column,
  but blocker, subtasks, lifecycle timeline, and comments retain their reading
  order in the DOM.
- In-context mutation panels appear adjacent to the state they change and have
  explicit Save/Cancel or Confirm/Cancel actions.

## Mobile layout

- One ordered flow: header, summary, blocker, details, subtasks, timeline,
  comments.
- Summary wraps without hiding status, due date, Area/Squad, or Active work
  days. Actions wrap into labelled controls; no icon-only overflow menu.
- Subtask movement and comment actions remain reachable by touch and keyboard
  without horizontal scrolling.

## Responsive transitions

At `48rem`, optional desktop columns collapse into the single DOM reading order.
No information or permitted Phase 3 action is removed at the transition.

## Interaction and keyboard behavior

- Heading/section landmarks provide a predictable reading order. Each in-
  context form is labelled by its section/state.
- Figma is a native external link with Tooltip and does not activate edit or
  lifecycle controls.
- Save/Confirm reports pending state and prevents duplicate activation. Cancel
  restores focus to the action that opened the panel.
- Successful mutations refresh authoritative detail, announce the specific
  completed operation, and focus the changed heading/item/confirmation.
- Subtask move buttons and polite announcements provide complete keyboard
  reordering without a custom composite widget.
- Escape only dismisses Tooltip; it does not silently discard an open in-
  context form.

## Loading state

Initial load preserves the page heading context using the display ID and shows
section-shaped loading placeholders plus an accessible status. Mutations mark
only their owning panel busy while preserving readable current detail.

## Empty state

- Optional description, labels, planned dates, Figma URL, blocker, subtasks,
  and comments each have plain absent-state text.
- Authorized users receive the relevant add action; Viewer receives only the
  readable absence. No empty timeline is fabricated when creation is present.

## No-results state

Not applicable; Phase 3 detail has no timeline/comment filter.

## Error state

- A missing or unavailable display ID shows a safe not-found state and return
  to All Tickets. Load failure is distinct and offers Retry.
- Validation/network failures remain in the owning panel and preserve input.
- Expected-version conflict explains that authoritative state changed, refreshes
  it, preserves the user's draft where safe, and never claims partial success.
- Forbidden/inactive/password-restricted errors leave no stale usable action.

## Disabled and permission states

- Viewer sees no mutation controls; the page is not a fieldset of confusing
  disabled inputs.
- Designer unrelated-ticket core/status/assignment/subtask controls are absent,
  while whole-team blocker and comment capabilities remain independently shown.
- Archived detail is explicitly read-only except eligible Restore. State-based
  unavailable actions have visible explanations near their owning section.

## Long-content and overflow behavior

- Titles, descriptions, blocker/comment text, people, Area/Squad, labels, and
  timeline details wrap and preserve user-entered line breaks where meaningful.
- Label overflow uses `+n` with access to full labels in the details section.
- Timeline content never relies on horizontal scrolling. Figma URLs display a
  concise link label rather than the full unbroken URL.

## Success feedback

Every mutation confirms only its own result: updated fields, reassigned person,
new status, archive/restore, blocker, subtask, or comment. Refreshed authoritative
state is the durable confirmation. Notifications are written transactionally
where contracted but no inbox feedback is implied.

## Analytics or audit implications

No product analytics are added. Each domain mutation writes its approved
history/event/notification effects exactly once; reads and panel opening do not.

## Astryx reference patterns

- `references/astryx/button.md`
- `references/astryx/input.md`
- `references/astryx/textarea.md`
- `references/astryx/select.md`
- `references/astryx/checkbox.md`
- `references/astryx/badge.md`
- `references/astryx/tooltip.md`
- `references/astryx/patterns.md`

These notes govern control geometry, fields, status presentation, focus, and
responsive hierarchy. Vodafone governs color/type. Full-page and in-context
flows deliberately avoid the unready Modal reference.

## Design Flow reference screens or components

- `docs/ui-component-map.md`
- `docs/ui/ticket-creation-brief.md` for WorkItemForm conventions
- Existing shared components under `src/ui/`

## Acceptance criteria

- The two-level header exposes all approved Phase 3 current data while keeping
  planned and actual dates distinct and Blocked/Archived separate from status.
- Viewer, Designer own/related/unrelated, Designer+Admin, Lead, Manager, and
  Admin-overlay capability presentations match the RPC tests.
- Status/assignee, archive/restore, blocker, all five subtask operations, and
  comment add/edit/withdraw paths preserve expected-version/idempotency rules
  and exactly-once history.
- Active-blocker/status, active-assignee, incomplete-subtask acknowledgement,
  archive eligibility, archived-write denial, and conflict states are visible
  and tested.
- Desktop/mobile keyboard journeys and axe checks cover read-only, long content,
  empty sections, load/mutation failure, and focus restoration.
- No withdrawn body, restricted revision, Phase 4 control, Phase 5 inbox, or
  Phase 6 export is exposed.

## Open questions

None. The Work Dates/final work-history insertion point remains reserved by the
approved later-phase hierarchy and is not a Phase 3 implementation gap.
