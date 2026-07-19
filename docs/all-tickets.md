# All Tickets specification

**Version:** 1.1  
**Decision date:** 2026-07-16  
**Status:** Approved for MVP planning

All Tickets is the primary searchable and filterable ticket list. It is optimized for scanning ownership, status, planned dates, actual work recency, and attention signals without becoming an editable spreadsheet.

## 1. Default view

The default view is **Current**, containing unarchived tickets in:

- Backlog
- To do
- In Progress
- In Review
- Paused

Done and Archived remain available through view/status filters. Archived tickets are never included silently in Current.

Default people scope follows the shared rules:

| Position | Default people scope |
|---|---|
| Viewer | Everyone |
| Designer | Me |
| Lead | My reporting group: the Lead plus their direct-report Designers |
| Manager | My Manager group: the Manager, reporting Leads, and Designers beneath them |

A Lead or Manager may switch to All, another Lead/Manager group, or specific people. Admin privilege grants full access but does not replace the position-based default. Reporting groups are filter presets, not visibility boundaries.

## 2. Ownership relationship filter

People scope and ticket relationship are separate controls:

- **Owned** — default; the selected people are current primary assignees.
- **Contributed to** — the selected people have valid derived contributor activity on the ticket.
- **Owned or contributed to** — either relationship matches.

Contribution never turns into primary ownership, and contributor matches do not inflate the ticket count. When Everyone is selected, relationship filtering may be omitted where it would not narrow the result.

## 3. Desktop table

Use these columns:

1. **Ticket** — display ID and title, with labels and the derived subtask badge such as `2/4` inside the same cell.
2. **Area/Squad**.
3. **Status** — workflow status plus separate Blocked/Stale attention indicators where applicable.
4. **People** — primary assignee plus contributor count.
5. **Planned dates** — planned start and due date, with overdue/due-soon treatment.
6. **Last worked on** — actual ticket work date; show `No work logged` when empty.
7. **Figma** — a compact direct-link icon only when the ticket has a Figma URL.
8. **Actions** — the position/Admin-permitted Log Work shortcut and any accessible overflow actions approved elsewhere.

Do not create a separate Subtasks column. Selecting the contributor count reveals contributor names in a keyboard- and touch-accessible popover.

## 4. Row interactions

- Selecting the row, ticket ID, or title opens the Work Item page.
- The Figma icon opens the stored Figma URL directly in a new browser tab and does not trigger row navigation.
- The Figma control uses an accessible label and tooltip such as `Open in Figma`.
- Log Work opens ticket mode with that ticket preselected.
- Designer may log work on any visible ticket and becomes a contributor when they are not the primary assignee for the work date.
- Lead, Manager, and Admin-privileged users may also log on another person's behalf under the approved work-log rules.
- A Viewer has no Log Work action and cannot hold Admin privilege.

There is no inline table editing in the MVP. Ticket changes occur on the Work Item page or through a purpose-built flow.

## 5. Search

- Search display ID, title, and description.
- Use case-insensitive partial matching.
- Search combines with every active filter rather than replacing them.
- Do not add advanced query syntax in the MVP.
- A no-results state distinguishes `no tickets exist` from `no tickets match these controls` and offers Clear filters where applicable.

## 6. Filters

Support:

- View: Current, Done, Archived, or All
- People scope: position default, All, named Lead/Manager group, or specific people
- Relationship: Owned, Contributed to, or Owned or contributed to
- Status: multi-select
- Area/Squad: multi-select
- Labels: multi-select
- Blocked: any, blocked, or not blocked
- Due state: overdue, due soon, no due date, or any
- Stale: any, stale, or not stale
- Archived state where it is not already determined by the selected view

Show active filters clearly and provide Clear all. Search, filters, view, and sort state are represented in the URL so the list can be refreshed, bookmarked, or shared without creating saved views.

## 7. Sorting

Default to **Due date ascending**, with tickets lacking due dates last. Supported sorts:

- Due date
- Last worked on
- Created date
- Status
- Title
- Ticket ID

Ascending/descending direction is available where meaningful. Use a stable Ticket ID tie-breaker so pagination or refresh does not reorder equal values unexpectedly.

## 8. Mobile card

Each mobile result card shows:

- Ticket ID
- Status plus separate Blocked/Stale indicator
- Title
- Subtask badge in the title area
- Figma icon when available
- Primary assignee and contributor count
- Area/Squad and a limited label preview with `+n` overflow
- Due date and Last worked on

Selecting the card opens the Work Item. The Figma icon and Log Work action remain independently tappable.

## 9. Deliberate MVP limits

- No inline editing
- No bulk actions
- No user-customizable columns
- No saved filter/view presets
- No drag-and-drop status board inside this module
- No All Tickets CSV export; portable reporting exports belong to Reports

Pagination method, page size, responsive breakpoints, exact icon treatment, and loading skeletons are implementation decisions as long as they preserve this behavior.

## 10. Acceptance criteria

- Current excludes Done and Archived while keeping them reachable through explicit filters.
- Position-based people defaults match Dashboard and Reports.
- A Lead or Manager can view the full team, another Lead/Manager group, or specific people.
- Admin privilege does not alter the user's position-based default people scope.
- Owned and Contributed results follow primary-assignment and derived-contribution rules without duplicate ticket rows.
- Subtask progress appears only within the Ticket/title cell on desktop and the title area on mobile.
- The Figma icon appears only when a URL exists and opens that URL without opening the Work Item.
- Search, filters, sorting, and view state survive refresh through the URL.
- Friday/Saturday-aware due-soon and stale definitions match the Dashboard specification.
- A Viewer never receives a Log Work action and cannot hold Admin privilege.
- Empty, filtered-empty, mobile, and permission-sensitive states are implemented.
