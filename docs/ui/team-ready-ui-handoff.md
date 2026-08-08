# Design Flow — Team-Ready UI Handoff

Status: Approved post-MVP repository contract
Last updated: 2026-08-08
Figma file: https://www.figma.com/design/2c9QoPS8BLcTdiIoBEeeni/DesignFlow

## Repository reconciliation — 2026-08-08

This repository version incorporates the approved implementation reconciliation against the completed MVP contracts:

- The team-ready rollout retains exactly one primary assignee. The reviewed multi-assignee direction is consciously deferred until after rollout rather than discarded; contributors remain derived from valid work logs and separate from assignment.
- Priority remains absent from the product and every export.
- All Tickets has no CSV action. Portable CSV exports remain owned by Reports.
- Viewer retains Dashboard, Work Items, and whole-team read-only Reports, but has no global mutation actions, Team, Settings, Create Ticket, Log Work, or Reports CSV. Authorization must enforce these restrictions independently of navigation visibility.
- Designer without Admin is restricted to their own Dashboard and Reports data, including direct URLs, RPC calls, and personal CSV export. Lead without Admin defaults to their reporting group and may select All or Me. Manager and every Admin-privileged principal default to All. Viewer retains whole-team read-only report scope.
- Log Work, optional status transition, and selected subtask completions remain independent operations. The work log is submitted first; authoritative ticket state and permissions are refreshed before status and subtask attempts. A later failure never rolls back or resubmits a successful work log. The UI distinguishes complete from partial success, identifies each failed follow-up, preserves successful outcomes, retries only failed operation IDs, and refreshes ticket state after each completed operation.
- Reports owns one tab-aware CSV action whose active tab selects the Designers, Tickets, or Standalone Visuals row model. All exports apply the visible period, people scope, filters, and server-enforced authorization boundary.
- The password-policy change to a minimum of eight characters with no composition rule becomes effective only with the Authentication uplift slice.
- Every changed permission becomes effective only when its owning implementation slice is deployed. Until then, the existing deployed contract remains truthful.

The approved modernization sequence has exactly nine slices:

1. Foundation, shell, and navigation — `codex/ui-modernization-foundation-shell` (two internal checkpoints: foundation/primitives; shell/navigation).
2. Work actions: Log Work and Create Ticket — `codex/ui-modernization-work-actions` (two internal checkpoints: overlay/Log Work; Create Ticket/nested workflow).
3. All Tickets.
4. Route-backed inline Ticket Details.
5. Authentication uplift.
6. Dashboard uplift.
7. Reports uplift and revised exports.
8. Settings uplift.
9. Integrated release and staging gate.

The first two slices use their internal checkpoints on one branch and as one staging unit each. Do not split them into separate slices or merge any further slices.

## Purpose

This document records the UI decisions agreed while reviewing the post-MVP team-ready release. It should be updated after each module review, then attached to the next Codex implementation prompt.

This is a handoff brief, not the repository's permanent source of truth. Before implementation, Codex must reconcile it into the repository decision, architecture, and build-plan documents and explicitly report any conflict.

## Release goal

Ship the smallest UI modernization that makes Design Flow usable by the team in day-to-day work before controlled rollout.

The first release prioritizes:

1. Clear navigation and global actions.
2. Log Work as the highest-frequency workflow.
3. Create Ticket.
4. Finding and understanding active work.
5. Inline ticket opening and essential ticket actions.

Broader visual consistency and secondary-module refinement must not delay rollout unless they block these workflows.

## UI architecture direction

- Vodafone Foundations remain authoritative for brand colors, semantic colors, typography, and light/dark themes.
- shadcn/ui becomes the approved starting point for the new component layer.
- Tailwind is authorized for the new shadcn-based layer.
- Design Flow owns the resulting component source and product-specific compositions under `src/ui/`.
- Existing CSS Modules and current screens may coexist temporarily during incremental migration.
- Current backend contracts, permissions, routing, data behavior, and test expectations remain unchanged unless separately approved.
- The old production UI remains available until each replacement slice passes local/staging verification.

## Team-ready scope order

1. Record the post-MVP architecture decision and update repository plans.
2. Configure the Vodafone-mapped shadcn/Tailwind foundation and only the required primitives.
3. Implement the new responsive shell.
4. Implement the Log Work overlay.
5. Implement the Create Ticket overlay.
6. Improve All Tickets for daily use.
7. Add inline ticket opening.
8. Make only the essential Work Item adjustments needed to support the new workflow.
9. Verify mobile, accessibility, permissions, state refresh, and regression behavior.
10. Complete the focused staging gate, then begin controlled rollout and stabilization.

## Locked: shell and navigation

**Figma source:** [Shell and navigation frames](https://www.figma.com/design/2c9QoPS8BLcTdiIoBEeeni/DesignFlow?node-id=105-14719&t=uzu9Ey4iYueOYTBH-11)

### Module removal

- Delete the Team module and remove its navigation entry for every role.
- Do not show disabled or empty placeholders for unavailable modules.

### Role-based destinations

| Role | Destinations |
| --- | --- |
| Admin | Dashboard, Work Items, Reports, Settings |
| Manager | Dashboard, Work Items, Reports |
| Lead | Dashboard, Work Items, Reports |
| Designer | Dashboard, Work Items, Reports |
| Viewer | Dashboard, Work Items, Reports |

### Designer Reports boundary

- Reports is a visible navigation destination for Designers, but it is restricted to the signed-in Designer's own reporting scope.
- A Designer may view their own summary and metrics, Recorded Activity across tickets, work logs including standalone visual work, and tickets where they are an assignee or contributor.
- Date, area, status, label, and work-type filters may refine this personal dataset. They must never broaden it beyond the signed-in Designer.
- The reporting identity is a permission boundary, not a removable default filter. Hide the Designer selector or show it as a locked value such as **Designer: You**.
- Designers cannot select or compare other designers, view team/reporting-group aggregates, open another designer's report, or bypass the restriction through URL parameters or direct links.
- Designer CSV exports contain only data within the same personal reporting scope.
- Ordinary shared-ticket visibility remains governed by the existing ticket permissions; this reporting boundary does not change ticket access.
- Admin and Manager retain access to all reports. Lead reporting visibility remains unchanged, with the Lead's reporting group used as the default scope rather than a hard boundary.

### Desktop shell

- Use a persistent sidebar.
- Group role-available navigation destinations together.
- Show a clear active destination state.
- Show global actions separately from navigation:
  - Log Work first and visually primary.
  - Create Ticket second and visually secondary.
- Only show actions permitted for the current role.
- Keep user identity in the sidebar footer/profile area.
- The shell must support old and newly migrated views during the transition.

### Mobile shell

- Use a compact top header containing:
  - Design Flow logo.
  - Theme toggle.
  - Notifications.
  - Profile/avatar.
- Use a labelled bottom navigation containing only destinations available to the current role.
- Fix the bottom navigation to the viewport so it remains visible while page content scrolls; it must not sit after the page content or scroll away with it.
- Keep the circular Quick Actions `+` visually separate at the trailing end of the bottom navigation, regardless of destination count.
- The `+` is an action, not a selected navigation destination.
- Tapping it opens a bottom sheet with:
  1. Log Work, primary.
  2. Create Ticket, secondary.
- Filter quick actions by permission.

### Theme, notifications, and profile

- Place the theme icon beside Notifications on desktop and mobile.
- Toggle theme immediately; do not open a separate menu.
- In light mode, show a moon with the accessible label “Switch to dark mode.”
- In dark mode, show a sun with the accessible label “Switch to light mode.”
- Follow the device preference for a first-time user, then persist the user's explicit selection.
- Keep Notifications accessible from the shell.
- The profile dropdown shows the user's name and role as context and Sign out as its only action for this release.
- Editable profile/display-name functionality may add a profile action later without changing the shell structure.

## Shell review verdict

The Figma direction is approved for the team-ready release. No further structural redesign is required before moving to Log Work.

Implementation notes:

- Treat the desktop sidebar, mobile header, bottom navigation, and trailing quick-action button as responsive shell components rather than screen-specific layers.
- Ensure mobile labels and touch targets remain legible at the 390 px acceptance width.
- Keep the fixed mobile bottom bar above device safe-area insets and add sufficient page-bottom padding so content and controls are never obscured behind it.
- Hide the fixed bottom navigation during full-screen mobile workflows, including Log Work, Create Ticket, and Ticket Details. This rule does not require the mobile top header to be fixed.
- The desktop sidebar should remain fixed/sticky while the page content scrolls.
- Profile dropdown, Quick Actions sheet, Notifications, and overlays must have correct focus management, keyboard behavior, accessible names, and dismissal behavior.
- Settings' mobile tab overflow is a Settings-module issue, not a reason to delay the shell.

## Locked: Log Work overlay

**Figma source:** [Log Work overlay frames](https://www.figma.com/design/2c9QoPS8BLcTdiIoBEeeni/DesignFlow?node-id=105-21599&t=uzu9Ey4iYueOYTBH-11)

### Presentation

- Log Work is a right-positioned side overlay on desktop, opened above the current view with a dimmed backdrop.
- Use a consistent generous width suitable for the form; do not center it as a small modal.
- On mobile, Log Work becomes a full-screen workflow with no application header or bottom navigation visible behind it.
- Keep the overlay header and submit area fixed while the form body scrolls.
- The primary submit action remains visible at the bottom without covering form content or the device safe area.
- The same overlay can launch from the global shell action, mobile Quick Actions sheet, a ticket row/drawer, or the full Work Item page.

### Opening context

- When opened globally, no ticket is preselected.
- When opened from a ticket context, preselect that ticket while still preserving the existing permission and validation rules.
- Ticket work remains the default mode; Standalone Visual Work remains the secondary mode.
- In Standalone Visual Work mode, hide ticket-specific fields and options that do not apply.

### Field and role behavior

- Keep ticket search and the inline Create New Ticket entry point together.
- Creating a ticket from Log Work is a separate operation: preserve the unfinished Log Work draft, return to it after ticket creation, and select the new ticket.
- Designers logging for themselves should not have to choose themselves in a redundant `Worked by` field.
- Show the `Worked by` selector only to roles permitted to log on behalf of another user; default it to the current user.
- Keep optional status change, blocker, and **Complete subtasks** controls under progressive disclosure so the core logging flow stays short.
- When a ticket is selected, **Complete subtasks** shows its incomplete subtasks as a multi-select checklist. It is hidden for Standalone Visual Work and for tickets with no incomplete subtasks.
- Blocked remains a ticket label/condition, not a separate ticket status.

### Create-ticket `+` action

- The trailing `+` inside the Work Item search control means **Create new ticket**; it is not a third segment or a generic add action.
- Show it only while `Ticket work` is selected and only to users who have permission to create tickets.
- Give the icon button the accessible name `Create new ticket` and show the same wording in a desktop tooltip. Its touch target must meet the same minimum size as other icon buttons.
- Activating it transitions the existing right-side overlay from Log Work to Create Ticket. Do not stack a second drawer, backdrop, or focus trap over Log Work.
- Preserve the entire Log Work draft during that transition.
- Cancelling or navigating back from Create Ticket returns to the preserved Log Work form without changing its values.
- Successful ticket creation returns to Log Work, selects the newly created ticket, retains the rest of the draft, and lets the user complete the work log.
- If ticket creation fails, keep the Create Ticket values and provide a clear way to return to the preserved Log Work draft.

### Work dates

- Support one to five dates in a submission.
- Default the first entry to today; allow past dates and reject future dates.
- Each date has its own required work type and optional description.
- Use vertically stacked, full-width date entries inside the overlay on both desktop and mobile. Do not use horizontally clipped or horizontally scrolling date cards.
- Provide an explicit `Add another date` action and a clear remove action for additional entries.
- Disable the add action after five dates.

### Optional subtask completion

- Label the progressive-disclosure control **Complete subtasks** rather than `Finish Subtask`.
- Show only incomplete subtasks belonging to the selected ticket and allow one or more to be selected.
- Selecting subtasks does not change them immediately; completion occurs only when the Log Work submission succeeds.
- Submit the work log first. After it succeeds, refresh the authoritative ticket state and permissions, then attempt any optional status transition and selected subtask completions as independent operations with independent operation IDs.
- A status or subtask failure never rolls back or causes resubmission of a successful work log. Preserve every successful outcome, identify the failed follow-up precisely, retry only failed operations, and refresh the displayed ticket state after each completed operation.
- Store the actual submitting user and submission timestamp as the subtask completion actor/time, including when the work log contains backdated work dates.
- Keep adding, renaming, reordering, reopening, and removing subtasks in Ticket Details rather than expanding the Log Work workflow.
- Completing all subtasks must not automatically mark the parent ticket Done.

### Validation, dismissal, and completion

- Disable submission until the required visible fields are valid and show inline errors near the affected field.
- Closing an untouched overlay is immediate.
- Closing through the X, Escape, backdrop, or mobile back gesture after edits requires a discard confirmation.
- Submitting shows an in-progress state and prevents duplicate submissions.
- On success, close the overlay, show concise confirmation, and refresh the relevant underlying ticket/list/report state without a full navigation.
- On failure, keep every entered value and show an actionable error.
- Preserve focus trapping, restore focus to the launcher after close, and provide accessible titles, labels, and error announcements.

### Review verdict

The Figma direction is approved for the team-ready release with one structural adjustment: replace the horizontal multi-date presentation with stacked full-width entries. Generic spacing, borders, radius, shadows, and control styling should be finalized through the Vodafone-mapped shadcn primitives rather than redesigned separately now.

Ticket details are not locked by this decision. Whether ticket details use a route-backed right drawer or the dedicated Work Item page will be decided during the All Tickets and Inline Ticket reviews; the Log Work overlay establishes a reusable overlay pattern but does not require every large surface to use the same width or behavior.

## Locked: Create Ticket overlay

**Figma source:** [Create Ticket overlay frames](https://www.figma.com/design/2c9QoPS8BLcTdiIoBEeeni/DesignFlow?node-id=105-28464&t=uzu9Ey4iYueOYTBH-11)

### Presentation

- Create Ticket uses the same interaction family as Log Work: a right-positioned side overlay on desktop and a full-screen workflow on mobile.
- Keep the application context behind the desktop overlay with a dimmed backdrop.
- Hide the application header and bottom navigation behind the mobile full-screen workflow.
- Keep the overlay header and primary Create Ticket action fixed while the form body scrolls.
- Closing behavior, discard confirmation, focus management, loading protection, failure retention, and success feedback follow the locked Log Work overlay contract.

### Default assignee

- On a fresh Create Ticket form, initialize the assignee selection with the current creator.
- The creator remains only the default: the user may remove or replace the one primary assignee before submission within the existing permission rules.
- Do not overwrite a restored draft or an explicit assignee choice when the overlay rerenders or reopens from preserved state.
- If the creator is not an eligible assignee under the current permission/data rules, leave the field unselected and require a valid choice rather than bypassing those rules.
- This is form-default behavior, not a new automatic post-creation assignment rule and not a database default.

### Implementation boundary

- Reuse the current ticket-creation operation, assignee relationship, permissions, and validation.
- If the current operation already accepts the creator's user ID as an assignee, this requires only form initialization plus tests; it should not require a schema or RLS change.
- Verify the behavior for each role allowed to create tickets, primary-assignee removal or replacement, draft restoration, successful reset, and failed submission.
- Multi-assignee support remains an approved post-rollout consideration and is intentionally deferred from the team-ready release; do not change the one-primary-assignee schema in this workstream.

### Review verdict

The right-side overlay direction is approved for the team-ready release. Defaulting the assignee to the creator is approved and should be included in this slice rather than deferred. It removes a repetitive choice from a high-frequency workflow while preserving the user's ability to change the assignment.

This default-assignee rule is locked for the team-ready release: it must not be treated as an optional post-rollout enhancement unless repository inspection reveals a concrete permission or data-contract conflict.

## Locked behavior: All Tickets

**Figma source:** [All Tickets desktop and mobile frames](https://www.figma.com/design/2c9QoPS8BLcTdiIoBEeeni/DesignFlow?node-id=111-39710&t=uzu9Ey4iYueOYTBH-11)

The product behavior and core responsive presentation below are locked. Implementation may derive generic component styling from the Vodafone-mapped shadcn layer but must not silently change these definitions.

### Desktop table structure

- Use a vertically and horizontally scrollable data table sized to the available desktop viewport.
- Keep the header row sticky during vertical scrolling.
- Keep **Ticket** as the first column and sticky at the left edge.
- Keep **Link** as the final column and sticky at the right edge.
- Horizontally scroll every column between Ticket and Link.
- Add a subtle separator or elevation cue to a sticky edge only while content is passing beneath it.
- Keep the Link column compact and use the ticket's Figma-link icon as its row action.
- Use the approved mobile card treatment recorded below; do not force the full desktop table into the 390 px layout.

### Column order and definitions

Use this exact desktop order:

1. **Ticket** — ticket name plus the existing subtask indicator when applicable.
2. **Area** — existing Area/Squad value.
3. **Status** — current ticket status.
4. **People** — the primary assignee and derived contributors using the compact cell contract below.
5. **Last Activity** — date and time of the latest meaningful ticket activity, including work logs, status changes, comments, and ticket edits. Use the event's actual recorded timestamp rather than a backdated work date. Expose the activity type in a tooltip or accessible detail.
6. **Start Date** — manually managed ticket date; do not derive it from the first work log.
7. **Due Date** — existing due date.
8. **Days Open** — elapsed working days from Start Date using the Design Flow workweek of Sunday through Thursday; exclude Friday and Saturday.
9. **Days Active** — count distinct dates that contain at least one work log across all people. Multiple logs or people on the same date count as one active day.
10. **Labels** — existing labels.
11. **Link** — Figma-link action.

Days Open follows these edge rules:

- A ticket whose Start Date is today shows `0 days`.
- Exclude every Friday and Saturday crossed by the elapsed period.
- Freeze the value on the date the ticket becomes Done.
- If a Done ticket is reopened, resume counting from its original Start Date while continuing to exclude Fridays and Saturdays.
- Show `—` when Start Date is missing.
- Show `0 days` rather than a negative number for a future Start Date.

### Column sorting

- On desktop, sort from the column heading itself; do not add a separate desktop Sort control.
- In the default list state, show no sort icon on any column heading.
- An icon appears only beside the actively selected sort column.
- The first click activates the column's useful initial direction: descending for dates and numeric values, ascending for Ticket and Area.
- Each later click on the active heading alternates between ascending and descending.
- Allow only one active user-selected sort at a time and persist it in the URL so opening and closing an inline ticket preserves the list state.
- Sortable columns are Ticket, Area, Status, Last Activity, Start Date, Due Date, Days Open, and Days Active.
- People, Labels, and Link are not sortable and must not show inactive sorting affordances.
- Keep sorting on mobile even though tickets render as cards. Place a dedicated **Sort** control beside the mobile Filter control; opening it presents the same sortable fields plus ascending/descending direction in a compact bottom sheet.
- The mobile Sort control has no active treatment in the default list state. After the user chooses a sort, show the selected field and direction and allow a reset to the default ordering.
- Desktop and mobile sorting use the same URL-backed sort state and result ordering.

### Filters

- Keep Search permanently visible.
- Remove the existing All, Active, Done, and Archived tabs. They mix ticket status with archival visibility and must not remain as a parallel navigation/filtering model.
- By default, show only non-archived tickets across every status.
- Continue to expose Done through the existing Status filter rather than through a permanent tab.
- Replace the current exposed filter controls with an **Add filter** chip.
- The Add filter menu lists available filter dimensions; selecting one adds a dedicated active-filter chip.
- Clicking an active-filter chip reopens its own compact dropdown.
- Allow one chip per filter type with multi-selection inside the filter.
- Allow each filter to be cleared independently and show **Clear all** only while filters are active.
- Multiple values inside one filter use OR logic; different filter types combine with AND logic.
- Remove the Ownership Relationship filter entirely.
- The People filter matches tickets where any selected person is either an assignee or a contributor.
- Add **Archived only** as a boolean option in the Add filter menu on desktop and in the mobile filter sheet.
- Activating Archived only switches the result set from non-archived tickets to archived tickets only; it does not combine archived and non-archived tickets.
- Render the active state as an `Archived only` chip that can be removed like any other filter.
- Allow Archived only to combine with Status, People, Area, dates, labels, and the other available filters using the same AND logic.
- Apply Archived only to the result count and pagination. All Tickets has no CSV action; Reports remains the sole owner of portable CSV exports.
- Add **Days Open** and **Days Active** as the final two choices in the Add filter menu.
- Each day-count filter uses optional minimum and maximum whole-day values, supporting exact (`5` to `5`), at least (`5` to blank), at most (blank to `5`), and range (`5` to `10`) filtering without adding separate operator controls.
- Render the resulting chips in a concise form such as `Days Open: 5–10`, `Days Active: ≥5`, or `Days Open: ≤5`.
- Apply both calculated-day filters to the complete filtered query before pagination. Never filter only the rows already loaded on the current page.

### Pagination and result count

- Use page-based pagination rather than infinite scroll on desktop and mobile.
- Use a default page size of 25 tickets and offer 25, 50, and 100 tickets per page on desktop. Keep 25 per page on mobile without a page-size selector.
- Show the exact filtered-result range and total: `1–25 of 137`. Do not use an ambiguous label such as `Showing 25`.
- On desktop, show the result count, page-size control, page numbers, and Previous/Next controls.
- On mobile, use the compact `1–25 of 137` label with Previous/Next controls; page numbers are not required.
- Reset to page 1 when search, filters, page size, or sorting changes.
- Persist the current page and desktop page size in the URL so opening and closing an inline ticket preserves the user's position.
- Empty results show `0 of 0` and disable pagination controls.
- Reports exports continue to export their complete filtered result sets rather than a current UI page; All Tickets itself has no export action.

### People cell and avatar palette

- Render the compact row format as: **avatar/initials — regular-weight name — bold `+N`**.
- Use the primary assignee as the displayed person. If there is no assignee, use the first contributor.
- `+N` counts the remaining unique people involved in the ticket; never count the displayed person twice if they are both an assignee and contributor.
- Hovering or activating the cell reveals a compact detail that separates **Assigned** from **Contributors**.
- Use a profile image when available and initials as the fallback.
- Assign fallback avatar colors deterministically from the stable user ID so the same person keeps the same color even if their display name changes.
- Use a curated, muted, accessible palette with light/dark variants. Avoid Vodafone red and status colors so avatar color does not imply product state.
- Do not add manual avatar-color administration in the MVP.

### Approved responsive presentation

- The proposed desktop direction is approved: a compact operational table inside the persistent desktop shell, with Search, active filter chips, and Add filter above the result count and table.
- The visible Figma columns are illustrative of the viewport rather than a reduction of scope. Implement the complete locked column order and horizontal scrolling behavior recorded above.
- Use the navigation label **Work Items** and the page title **All Tickets** consistently on desktop and mobile. Do not use `Work Items` as the desktop page title while mobile uses `All Tickets`.
- Keep the desktop table visually dense enough to scan many tickets without making row actions or text targets too small.
- The proposed mobile card direction is approved. Do not compress the desktop table into the mobile viewport.
- A collapsed mobile card shows the ticket ID and name, Figma-link action when available, compact People treatment, Area, Status, subtask progress when applicable, and an expand/collapse control.
- An expanded mobile card additionally exposes Days Open, Days Active, Start Date, Due Date, and Last Activity. Show the Last Activity date and time using the locked definition rather than a generic `Last updated` value.
- Labels do not need to occupy permanent space in every collapsed mobile card. When present, expose them in the expanded card and in ticket details.
- Preserve the user's expanded/collapsed choice only for the current rendered list; expanding a card must not navigate or disturb filters, sort, or pagination.
- The mobile Sort and Filter controls must have accessible text labels even if the compact visual treatment is icon-led. Do not rely on a red dot alone to communicate the active sort/filter state.

### Implementation-owned component details

- Codex may compose the pagination controls from the Vodafone-mapped shadcn Pagination, Select, and Button primitives; no separate bespoke Figma component is required before implementation. The resulting component must still satisfy the exact range, page-size, URL-state, disabled-state, desktop, and mobile behaviors locked above.
- Codex may create the avatar fallback component from the shadcn Avatar primitive, but shadcn does not supply the product palette or deterministic assignment rule. Implement the curated semantic avatar tokens and stable-user-ID mapping recorded above, then keep that palette in the Design Flow component/token layer for future maintenance.
- Generic radius, border, elevation, icon sizing, focus treatment, and menu styling should be resolved through the shared Vodafone-mapped shadcn primitives rather than copied as isolated screen-specific values.

### Visual review verdict

The All Tickets desktop table and mobile card directions are approved for the team-ready release. Pagination and avatar component styling may be finalized during shadcn implementation under the explicit contracts above. No additional Figma work is required for those two component details before starting this slice.

### Inline opening from All Tickets

- Clicking a desktop ticket row or mobile ticket card opens the route-backed Ticket Details overlay defined below.
- The row/card must also be keyboard operable and expose an accessible ticket-opening action.
- Interactive controls inside the row/card, including the final Figma-link action and mobile expand/collapse control, keep their own behavior and must not trigger ticket opening.
- Opening and closing ticket details preserves the current search, filters, sort, pagination, mobile card expansion state where practical, and desktop scroll position.

## Locked: Inline Ticket Details presentation

**Figma source:** [Ticket Details desktop and mobile frames](https://www.figma.com/design/2c9QoPS8BLcTdiIoBEeeni/DesignFlow?node-id=137-51497&t=uzu9Ey4iYueOYTBH-11)

### Overlay and routing

- Open Ticket Details as a wider right-positioned overlay in the same visual family as Log Work and Create Ticket.
- On desktop, use a responsive width equivalent to `clamp(720px, 58vw, 840px)` rather than reusing the narrower form-overlay width.
- Keep enough of the underlying All Tickets context visible on sufficiently wide desktop screens; progressively use the full viewport on smaller desktop/tablet widths.
- On mobile, Ticket Details is a full-screen route-backed view with the application header and bottom navigation hidden behind it.
- Opening a ticket updates the URL to its ticket route, such as `/work-items/:ticketId`.
- Browser Back closes the overlay and restores the preserved All Tickets state.
- Opening a copied ticket URL directly loads the relevant Work Items context with that ticket already open.
- Closing the overlay returns focus to the row/card or other launcher when it still exists.

### Component boundary

- Ticket Details may share the overlay shell, focus management, responsive breakpoints, dismissal behavior, and motion language used by Log Work and Create Ticket.
- It is a navigable content view, not a temporary form, and may use a wider configuration and its own internal layout.
- Do not stack Log Work, Create Ticket, or an editing drawer on top of Ticket Details. Transitions to those workflows must replace the overlay content or use an inline mode while preserving the ticket route/context.
- Use the approved desktop and mobile information hierarchy from the linked Figma section, together with the interaction contracts below.

### Header actions and dismissal

- Keep **Log Work** as the primary header action for the MVP.
- Keep comments in their dedicated section at the end of the ticket; no sticky comment shortcut or unified comment/activity treatment is required for the MVP.
- Keep the primary actions at the top for now. Do not add a sticky desktop header action area or mobile bottom action bar in this slice.
- Desktop uses the close `X` control. Mobile uses Back and does not show a redundant `X`.
- Mobile Back returns to All Tickets with its search, filters, sorting, pagination, and practical scroll/card state preserved. A directly opened ticket route must still provide a clear return to Work Items.
- Keep infrequent actions in the existing overflow treatment where shown; broader quick-action expansion is post-rollout unless a required operation has no accessible entry point.

### Inline field editing

- Do not add a general Edit mode or separate editing page/drawer.
- Ticket name, description, status, assignee, area, planned start date, due date, labels, and Figma URL are editable directly from their displayed values, subject to role permissions.
- Text fields reveal an inline editing state. Compact structured fields use a dropdown, searchable selector, or date picker and save when a selection is confirmed. Description uses explicit Save/Cancel.
- Values should look like readable content by default; hover, focus, tap, and empty-state prompts reveal editability.
- Show a concise saving/saved state. On failure, restore the prior value and show an actionable error.
- Record every successful ticket-field change in Ticket Activity.
- The People editing control changes the **one primary assignee only**. Contributors are read-only and are added/derived only when users log work on the ticket; do not let users manually add or remove contributors from Ticket Details.
- First/last worked date, Days Open, Days Active, Last Activity, Created By, and contributor history are read-only calculated/audit information.

### Subtasks

- Keep subtasks as a one-level checklist in Ticket Details with add, complete, reopen, rename, reorder, and remove behavior permitted by the existing role rules.
- Keep the compact progress badge in its approved visual form. Activating it scrolls to and focuses the Subtasks section; provide an accessible label such as `1 of 3 subtasks complete` even when the visible badge remains `1/3`.
- Subtask completion appears in Ticket Activity.
- Log Work may also complete selected incomplete subtasks through the optional transactional behavior defined in the Log Work section above.

### Work activity calendar

- The calendar is a compact visualization of work-log dates, not a productivity or effort score.
- Weeks run Sunday through Thursday; Friday and Saturday are omitted.
- Display weeks in reverse chronological order: the latest logged week is at the top, and **Show earlier weeks** progressively reveals older rows at the bottom.
- The top/latest boundary is the Sunday-starting week containing the latest logged work date. The bottom/earliest boundary is the Sunday-starting week containing the earliest logged work date.
- Do not show empty weeks before the earliest log or after the latest log. Preserve empty weeks between active weeks so gaps remain visible. A backdated log can extend the lower boundary.
- Keep the intentionally low-text visual treatment: do not add weekday headings or a date label to every row. Show a month label only where a displayed row begins a new month; assign the row to the month containing its Sunday. If the loaded range begins midway through a month, label its first visible row for orientation.
- Include the compact intensity legend shown in the design: light = 1 log, medium = 2 logs, dark = 3+ logs. Color intensity represents log count only, not duration, quality, or effort.
- Desktop hover and mobile tap expose the exact work date, log count, people, and work types. Each cell also has a complete accessible date/count label.
- Selecting a cell narrows or jumps the adjacent Activity & Work Log feed to that work date and provides a visible way to clear the selection.
- Desktop initially shows the latest six available week rows and reveals six more per **Show earlier weeks** action.
- Mobile intentionally uses smaller day cells, initially shows the latest three available week rows, and reveals three more per **Show earlier weeks** action. Keep all five workday cells visible without horizontal scrolling.
- If the ticket has no work logs, show a compact empty state rather than an empty calendar.

### Activity & Work Log

- Merge work logs and ticket-change events into one reverse-chronological feed because these operational events need to be read together.
- Keep the approved green and blue dot distinction: green identifies work logs; blue identifies ticket-change activity.
- Sort the feed by each event's effective activity date: work-log entries use the work date they refer to, while ticket-change events use the timestamp when the change occurred. A backdated work log therefore appears in its historical work-date position, matching its green calendar cell, rather than where it was submitted.
- When one Log Work submission contains multiple work dates, represent each dated work entry under its respective work date in the feed. The submission timestamp remains audit metadata and may be available in entry details, but it does not determine the visible ordering.
- Ticket-change events include creation; field changes; status, assignee, area, date, label, and Figma-link changes; subtask completion/reopen; and archive, restore, or reopen actions.
- Derived values such as Days Open, Days Active, first/last worked date, and Last Activity do not create their own change events.
- Initially show the latest ten entries on desktop and six entries on mobile; **Show earlier activity** reveals the same quantity again.
- Use the drawer/page's primary vertical scroll; do not create separate scrolling regions for the calendar and feed.

### Comments

- Keep Comments as the separate section at the end of the ticket exactly as intended in the approved design.
- Do not place comments in Activity & Work Log and do not add `All / Work logs / Comments / Changes` feed filters for the MVP.
- A comment remains attributable and timestamped, but comment creation and editing do not generate duplicate entries in the operational Activity & Work Log feed.
- Retain the existing Last Activity definition from All Tickets: a meaningful comment may still update Last Activity even though comments are presented separately in Ticket Details.

### Visual review verdict

The Ticket Details desktop drawer and mobile full-screen directions are approved for the team-ready release. The deliberate low-text calendar, separate Comments section, top-only primary actions, compact subtask badge, inline editing contract, and merged Activity & Work Log feed are locked. Additional sticky quick actions and broader comment treatment are post-rollout considerations rather than release blockers.

## Locked: authentication

Authentication does not require another detailed Figma redesign before implementation. Preserve the existing form structure and apply only a light visual uplift during the Vodafone-mapped shadcn pass.

### Credential and access rules

- Keep email as the username and sign-in identifier.
- Reduce the password minimum from 12 characters to 8 characters.
- Do not require an uppercase letter, number, symbol, or other composition rule beyond the eight-character minimum.
- Continue to support longer passwords, password-manager paste, and browser/device autofill.
- Keep show/hide-password controls and provide clear inline validation.
- Accounts remain controlled through the team invitation/account-creation process; do not introduce open public registration.
- Keep email verification and the existing Supabase authentication rate limits enabled.
- Do not force existing users to reset their passwords solely because this minimum changes.

### Visual uplift boundary

- Shorten overly explanatory copy where the action and field labels are already self-evident.
- Use the shared shadcn primitives and Vodafone-mapped tokens to improve spacing, hierarchy, responsive behavior, focus states, and validation presentation.
- Codex may add one restrained ambient treatment, such as a slow background gradient or abstract shape movement, without introducing a heavy animation dependency solely for Authentication.
- Motion must not delay interaction, compete with the form, or affect authentication behavior.
- Respect `prefers-reduced-motion` and provide an equivalent static presentation.
- Do not expand this uplift into new onboarding steps, credential methods, social sign-in, or MFA for the team-ready release.

### Visual review verdict

Authentication is approved for a light shadcn-based uplift without further dedicated Figma work. Email login and the eight-character password minimum are locked; broader authentication changes are outside the team-ready scope.

## Locked: Dashboard structure and filtering

The Dashboard receives a surgical usability and component-library uplift rather than a workflow or reporting redesign. Preserve its existing cards, metrics, calculations, and permission behavior unless a later card-by-card review explicitly changes them.

### Consistent module header

- Use the same module-header composition approved for All Tickets, adapted with the Dashboard title and any concise Dashboard-specific supporting text.
- Keep spacing, alignment, typography, responsive behavior, and the placement of filters consistent across modules.
- Do not retain a separate legacy Dashboard header pattern.

### Page-level filtering

- Keep one persistent **People scope** control visibly separate from the standard **Add filter** control.
- The People scope determines whose Dashboard data is being viewed and applies across every Dashboard card and chart.
- Role behavior is:
  - **Designer:** **Me** only. The scope is locked and cannot be changed or bypassed through filters or URLs.
  - **Lead:** default to **My reporting group**, with **All people** and **Me** available.
  - **Manager/Admin:** default to **All people**, with individual reporting groups and **Me** available.
- Use the same **Add filter** behavior approved for All Tickets: its menu lists available filter dimensions, selected filters appear as removable chips, and all active filters apply across the entire Dashboard dataset.
- Relevant Add filter dimensions may include Area, Status, Labels, and date range, subject to the existing data and permission contracts.
- Add filter must refine the selected People scope; it must never override or broaden role permissions.

### Card-level controls and visual uplift

- Remove rows of exposed filter buttons, filter chips, or view tabs currently repeated inside Dashboard cards.
- Replace each card's exposed control set with one compact dropdown in that card's header.
- A card dropdown changes only that card's presentation, grouping, threshold, or local view. It must not change the page-wide dataset or the persistent People scope.
- Keep page-level filters and card-level view controls visually and behaviorally distinct.
- Apply the Vodafone-mapped shadcn layer to cards, charts, spacing, loading states, empty states, and responsive behavior without changing the underlying Dashboard content model.
- Preserve each card's current data, calculation, and available local views when consolidating its exposed controls into the dropdown. Do not infer new metrics or controls solely from this structural decision.
- Further card-specific changes are deferred until actual team feedback is available and must not delay the team-ready release.

### Summary drill-down behavior

- Remove the current behavior in which activating a Dashboard card, metric, or chart segment automatically scrolls the user to embedded source items lower on the same page.
- Keep Dashboard cards and charts as summary surfaces. Do not duplicate the All Tickets list inside the Dashboard or add a new source-items drawer or modal.
- When a summary represents a filterable set of tickets, activate an explicit **View tickets** or **View all** action, or a clearly interactive chart segment, to open **All Tickets** with the corresponding filters already applied.
- Carry the Dashboard's current People scope and compatible page-level filters into All Tickets, together with the metric- or segment-specific filters. Show all transferred criteria as the normal visible filter controls or removable chips.
- Browser Back must return to the same Dashboard state and practical scroll position.
- Do not make an entire card clickable when the card contains its own controls or several possible destinations.
- A named ticket inside an alert or exception card may open Ticket Details directly through the existing route-backed behavior.
- If a metric cannot be represented accurately through the All Tickets filter model, keep it informational rather than forcing an inaccurate drill-down.

### Current review verdict

The Dashboard is locked for the team-ready release: use the shared header, persistent People scope, Add filter model, one-dropdown-per-card control pattern, and filtered-All-Tickets drill-down behavior recorded above. Preserve the current cards and defer further card-specific changes until real team feedback is available.

## Locked: Reports

Retain the existing three Reports tabs—**Designers**, **Tickets**, and **Standalone Visuals**—and their current calculations. Apply the shared module structure and simplify export without creating a second reporting model.

### Consistent module header and report context

- Use the same module-header composition approved for All Tickets and Dashboard, adapted with the Reports title and concise supporting text if needed.
- Keep **Period** and **People scope** permanently visible because together they define the report's fundamental context.
- Role behavior for People scope remains:
  - **Designer:** **Me** only. This is an authorization boundary and cannot be changed or bypassed through filters, exports, or direct URLs.
  - **Lead:** default to **My reporting group**, with **All people** and **Me** available.
  - **Manager/Admin:** default to **All people**, with individual reporting groups and **Me** available.
- Place the standard **Add filter** control beside the two persistent context controls. Use the same dropdown-and-removable-chip behavior approved for All Tickets.
- Optional filters refine the selected Period and People scope; they must never broaden role permissions.
- Place **Export CSV** in the top header action area rather than at the bottom of the page.

### One contextual export action

- Remove the current **Summary/Detail** export choice. Do not expose the broken Detail option or show a menu containing only one choice.
- Use one direct **Export CSV** action. The active Reports tab determines the exported row model and columns.
- Export the complete filtered result for the active tab, not only rows currently visible or paginated.
- Apply the visible Period, People scope, all optional filters, and the signed-in user's authorization boundary to every export.
- Use human-readable values rather than database IDs or raw enum values.
- Format dates as `YYYY-MM-DD`. Use a consistent representation for empty values and separate multiple names or labels with semicolons.

### Designers-tab CSV

Use one row per designer in the permitted People scope. For a Designer, this export contains only their own row.

Columns, in order:

1. `Designer`
2. `Reporting Group`
3. `Period Start`
4. `Period End`
5. `Tickets Assigned`
6. `Tickets Contributed To`
7. `Open Tickets`
8. `Completed Tickets`
9. `Work Log Entries`
10. `Active Workdays`
11. `Standalone Visual Entries`
12. `Last Recorded Work Date`

Definitions:

- **Tickets Contributed To** counts distinct tickets on which the designer logged work.
- **Active Workdays** counts distinct historical work dates, regardless of how many entries were recorded on the same date.
- **Completed Tickets** counts tickets completed within the selected Period.

### Tickets-tab CSV

Use one row per ticket in the filtered report.

Columns, in order:

1. `Ticket`
2. `Area`
3. `Status`
4. `Primary Assignee`
5. `Contributors`
6. `Labels`
7. `Planned Start Date`
8. `Due Date`
9. `First Worked Date`
10. `Last Worked Date`
11. `Days Open`
12. `Days Active`
13. `Work Log Entries`
14. `Last Activity`
15. `Figma URL`
16. `Archived`

This is a ticket-level reporting export, not a complete ticket-history export. Detailed history remains available through the individual ticket export.

### Standalone-Visuals-tab CSV

Use one row per dated standalone visual entry. If one submission covers several dates, export one row for each historical work date.

Columns, in order:

1. `Work Date`
2. `Designer`
3. `Reporting Group`
4. `Work Type`
5. `Description`
6. `Recorded At`

Sort and report primarily by **Work Date**. Keep **Recorded At** as audit information showing when the entry was submitted.

### Filenames

Identify the active tab and selected Period in the filename, for example:

- `design-flow-designers_2026-08-01_to_2026-08-31.csv`
- `design-flow-tickets_2026-08-01_to_2026-08-31.csv`
- `design-flow-standalone-visuals_2026-08-01_to_2026-08-31.csv`

### Tab presentation and responsive implementation

- Use the shared shadcn tab pattern for **Designers**, **Tickets**, and **Standalone Visuals** without changing the existing tab structure, report content, metrics, or calculations.
- Keep the active tab visually clear and preserve it when Period, People scope, or optional filters change.
- On mobile, keep all three tabs reachable. Allow the tab list to scroll horizontally when needed rather than compressing, truncating, or wrapping labels awkwardly.
- Stack or wrap Period, People scope, Add filter, and Export CSV controls cleanly at smaller widths without clipping actions.
- Report tables may scroll horizontally on mobile; keep the identifying column first and preserve readable targets.
- Resize or stack charts and summary cards without clipping, and use the shared application patterns for loading, empty, and error states.
- These presentation details are implementation-owned during the shadcn uplift; no additional Reports Figma work is required.

### Review verdict

Reports is locked for the team-ready release. Implement the shared header, persistent Period and People scope, Add filter behavior, top-positioned contextual export, active-tab CSV schemas, and responsive constraints above. The broken Detail export is removed. Do not reopen the tab structure, calculations, or export model without a concrete data need.

## Locked: Settings

Settings remains an Admin-only supporting module. Retain its current settings categories, fields, permissions, and underlying behavior, and apply the shared shadcn visual uplift without expanding scope.

### True tab behavior

- Replace the current anchor-navigation behavior with true tabs.
- Activating a tab switches the content panel in place; it must not scroll the user to a section farther down one shared page.
- Render only the active tab's settings section in the main content area. Do not keep every settings section stacked vertically beneath the tab list.
- Preserve the active tab across normal rerenders and refreshes through route or URL state, such as a tab query parameter, so a specific settings category can be linked directly.
- Browser Back and Forward should restore the previous active tab when tab changes create navigation history.
- If the route does not contain a valid tab value, open the existing first/default Settings tab.
- Changing tabs must not silently discard an unfinished edit. Preserve the existing save model and show a confirmation before leaving only when the current implementation can contain unsaved form changes.
- Keep the tab list visible at the top of the Settings content. On narrow screens, allow horizontal tab-list scrolling rather than wrapping labels into multiple rows or reverting to anchor links.

### Visual uplift boundary

- Use the shared module header and shadcn tab, form, table, dialog, and feedback primitives where applicable.
- Improve spacing, hierarchy, responsive behavior, loading, empty, success, validation, and error states through the shared application patterns.
- Do not redesign Settings in Figma or change its data model, authorization, categories, or administrative workflows unless implementation reveals a functional blocker.

### Review verdict

Settings is locked for the team-ready release. Its only structural interaction change is converting the existing long, anchor-linked page into true tab panels; the remaining work is a shadcn visual and responsive uplift.

## Review queue

When a module is reviewed, add its exact Figma node link directly beneath that module's section heading using the same **Figma source** pattern above. The top-level file link is only a fallback and must not replace section-specific links.

| Module | Status | Required outcome |
| --- | --- | --- |
| Shell and navigation | Locked | Implement as recorded above |
| Log Work overlay | Locked | Implement the right-side desktop/full-screen mobile behavior recorded above |
| Create Ticket overlay | Locked | Implement the right-side desktop/full-screen mobile behavior and default the assignee to the creator |
| All Tickets | Locked | Implement the approved desktop table, mobile card presentation, and route-backed inline opening behavior |
| Inline ticket | Locked | Implement the approved wider route-backed overlay, inline editing, work calendar, Activity & Work Log, subtasks, and separate Comments behavior |
| Work Item | Superseded for primary use | Retain direct-route compatibility as needed; Ticket Details is the primary operational ticket surface |
| Authentication | Locked | Keep email login, apply the eight-character password minimum, and make only the recorded light shadcn visual uplift |
| Dashboard | Locked | Implement the shared header, filtering, card-control consolidation, and filtered-All-Tickets drill-down behavior above; preserve current cards and defer further changes until team feedback |
| Reports | Locked | Implement the shared header, report context, Designer self-only scope, tab-aware CSV export, and responsive shadcn presentation recorded above |
| Settings | Locked | Keep it Admin-only, convert anchor scrolling into true tab panels, and apply the shared shadcn visual uplift without changing its underlying workflows |

## Comment triage rule

Use these labels while reviewing each module:

- `Team-ready blocker`: prevents confident daily use or creates correctness, permission, mobile, or accessibility risk.
- `Include if low effort`: clearly improves the core release without expanding the workflow.
- `Post-rollout improvement`: valuable, but should not delay team adoption.
- `Reassess after shadcn`: primarily generic styling, spacing, radius, icon, shadow, or component-consistency feedback likely to change through the new primitives.

If a comment would still matter with completely different visual styling, decide it now. If it is mainly about the appearance of the current generic component, reassess it after the shadcn uplift.

## Next implementation-thread instruction

Implement only **Slice 1 — Foundation, shell, and navigation** on branch `codex/ui-modernization-foundation-shell`.

Read the repository source-of-truth documents, D-109/D-110, and this handoff before changing code. Treat Slice 1 as one branch and one deployable unit with two internal checkpoints:

1. **Foundation and primitive layer:** add the pinned Vodafone-mapped Tailwind/shadcn foundation under `src/ui/`; keep global Tailwind Preflight disabled; retain legacy CSS Modules; add only Button, Badge, Avatar, Tooltip, Dropdown Menu, Sheet, and Separator plus required dependencies. Verify token/theme behavior, primitive accessibility, legacy visual regression, formatting, lint, type checks, unit tests, and production build before checkpoint 2.
2. **Shell and navigation migration:** implement the responsive desktop sidebar, mobile header, fixed bottom navigation, permission-filtered Quick Actions, theme, notifications, profile context, sign-out, and Team route/navigation removal. Verify the seven-principal destination/action matrix, Viewer read-only behavior, Settings/Admin behavior, 390 px safe-area/content clearance, keyboard/focus, theme persistence, notifications, sign-out, all checkpoint-1 regressions, and staging behavior.

Do not create a separate branch or staging deployment between checkpoints. The slice is incomplete until the shell is the first verified consumer of the new foundation and every unmigrated legacy screen remains unaffected. Do not begin Slice 2, change backend/data contracts, add broad shadcn primitives, commit, push, deploy, or open a pull request unless separately requested.
