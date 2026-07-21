# All Tickets brief

**Status:** Approved for Phase 3 implementation on 2026-07-21

**Route:** `/work-items`

**Phase:** 3 — Work-item Foundation

## Purpose

Provide the primary whole-team ticket list for scanning ownership, workflow,
planned/actual dates, attention signals, and direct Figma destinations without
turning the page into an editable spreadsheet.

## Primary users and permissions

- Every valid active Viewer, Designer, Lead, and Manager, with or without valid
  Admin privilege, may read the whole-team result space.
- Position determines the default people scope; Admin privilege grants no
  different default.
- Viewer remains read-only. Authorized non-Viewer users receive Create ticket;
  row-level lifecycle changes remain on Work Item.

## Entry points

- Work items shell navigation.
- Return from creation, edit, or Work Item using a preserved URL query.
- Bookmarked/shared URL containing valid view, search, filters, sort, direction,
  and page.
- Phase 3 does not expose notification or recorded-activity entry points.

## Primary and secondary actions

- Primary for authorized creators: **Create ticket**.
- Search, view, people/relationship, filters, sort/direction, pagination, and
  Clear all are list-navigation actions.
- Ticket ID/title and otherwise noninteractive row/card space open Work Item.
- Figma opens independently in a new tab. Contributor count opens a Popover.
- No Log Work, recorded-activity, export, inline edit, bulk, saved-view,
  customizable-column, or overflow action is shown in Phase 3.

## Information hierarchy

1. Page heading, result count, and Create ticket where permitted.
2. Current/Done/Archived/All view plus search.
3. People and ownership relationship.
4. Collapsible in-page filters and sort/direction.
5. Active-filter summary and Clear all.
6. Desktop table or mobile ticket cards.
7. Pagination below the results.

## Content and filters

The URL-backed query supports:

- `view`: Current, Done, Archived, All;
- `people`: position default, Everyone, named Lead/Manager group, or one/more
  specific profile IDs;
- `relationship`: Owned, Contributed to, Owned or contributed to;
- multi-select status, Area/Squad, and label IDs;
- blocked, due, and stale tri/choice filters;
- case-insensitive partial search over display ID, title, and description;
- sort: due date, last worked on, created date, status, title, or ticket ID;
- direction; and
- one-based page.

Unknown keys are ignored. Invalid controlled values fall back to documented
defaults and the URL is normalized with replace navigation. Changing search,
view, people, relationship, filters, sort, or direction resets page to one.

Defaults:

- Current unarchived Backlog, To do, In Progress, In Review, and Paused;
- position-based people scope from `all-tickets.md`;
- Owned relationship; and
- due date ascending with null dates last and display ID as stable tie-breaker.

## Desktop result table

Columns remain in this order:

1. Ticket: display ID/title links, labels, and derived subtask badge.
2. Area/Squad.
3. Workflow status plus separate Blocked/Stale indicators.
4. Primary assignee plus contributor count trigger.
5. Planned start/due date with overdue/due-soon text.
6. Last worked on or `No work logged`.
7. Independent Figma link when present.

The final MVP Actions column is omitted in Phase 3 because its contracted Log
Work content belongs to Phase 4 and no other approved row action remains.

## Mobile result card

Each list item presents, in order:

- display ID, workflow status, and separate Blocked/Stale indicators;
- title and subtask progress;
- independent Figma action when available;
- primary assignee and contributor count;
- Area/Squad and a limited label preview with `+n` overflow; and
- due date and Last worked on.

The title/ID are native links. Tapping otherwise noninteractive card space opens
the same Work Item; Figma and contributor controls remain independent.

## Business rules

- `list_work_items(filters jsonb)` is the only ticket-result read surface. It
  validates filters and returns the current page plus `totalCount`.
- Page size is fixed at `25`; server offset pagination applies the complete
  filter and sort before limiting rows.
- People scope is a default/filter preset, never an authorization boundary.
- Contributor matching comes from valid derived ticket work and cannot duplicate
  ticket rows or become primary ownership.
- Due-soon and stale use current team policy and Friday/Saturday-aware working-
  day helpers. Planned dates and actual Last worked on stay distinct.

## Components to reuse, extend, or create

- Reuse Button, Input, Select, Checkbox, Badge, DataTable, and SkipLink.
- Extend DataTable only as approved in `ui-component-map.md`.
- Create Tooltip, Popover, and Pagination.
- Feature-own TicketFilters, TicketResults, WorkItemStatusBadge, FigmaLink, and
  ContributorPopover.
- No Drawer, Modal, Avatar, Tabs, custom combobox, or custom date picker.

## Desktop layout

- Filters occupy an in-page region above the table, not a drawer. Single-choice
  controls use Select; multi-select values use labelled Checkbox groups.
- The table uses moderate operational density, content-driven column sizing,
  wrapping title/people/date content, and no card elevation.
- Pagination follows the result region. Result count stays associated with the
  heading/filter summary rather than appearing as a detached metric card.

## Mobile layout

- Search and view remain first. A labelled disclosure shows/hides the in-page
  filter panel; closing it does not discard changes.
- Results become the purpose-built ticket-card list below `48rem`.
- Pagination regions may wrap, with range text before Previous/page/Next in DOM
  order and no horizontal page overflow.

## Responsive transitions

The desktop semantic table and mobile semantic list switch at the existing
`48rem` shell breakpoint. The same read payload and URL state drive both; no
result or action exists only at one width.

## Interaction and keyboard behavior

- Search submits immediately with a short debounce and updates the URL using
  replace navigation; explicit selection/pagination uses push navigation.
- Every filter has a visible label. Multi-select groups use native Checkbox
  behavior and a visible Clear all.
- Ticket ID/title links are keyboard destinations. Rows/cards are not fake
  buttons and do not add a redundant tab stop.
- Figma has a destination-specific accessible name, Tooltip on hover/focus,
  safe new-tab attributes, and no row-navigation side effect.
- Contributor trigger reports expanded state; its labelled dialog Popover moves
  focus in, supports Escape/light dismiss, and returns focus to the trigger.
- Page controls have destination-specific names and current-page semantics.
  After a page change, announce the new range and focus the results heading only
  when navigation would otherwise leave focus on a removed control.

## Loading state

- Initial load preserves heading/filter layout and shows an accessible result
  status plus row/card-shaped placeholders clearly marked as loading.
- URL changes keep controls visible, mark the result region busy, and prevent an
  older response from replacing a newer query.
- Figma/contributor controls are absent from placeholders.

## Empty state

When no Work Items exist in the selected base view, explain that state. Show
Create ticket only to an authorized creator. Viewer receives no fake action.

## No-results state

When tickets exist but none match, show the active search/filter context and a
Clear filters action that retains the current position-default people scope and
view unless those values themselves caused the no-results state.

## Error state

An actionable in-region error preserves the URL and filters and offers Retry.
It does not render stale rows as current or conflate an invalid URL with a
server failure. Unauthorized/inactive states remain distinct.

## Disabled and permission states

- Viewer sees the complete readable list but no Create ticket or mutating row
  control.
- While results update, filter controls remain understandable; only actions
  that would race the active request are temporarily disabled.
- Archived cards/rows show Archived independently and expose no write action.

## Long-content and overflow behavior

- Ticket title, Area/Squad, people names, labels, and dates wrap. Essential text
  is not available only through truncation Tooltip.
- Label preview may use `+n`; contributor count opens the full name list.
- Descriptions are searchable but not rendered in rows/cards.
- The table region may scroll only as a final fallback at extreme zoom; the
  ordinary narrow presentation is the card list.

## Success feedback

List navigation does not produce success toast noise. Returning from a completed
creation/edit/lifecycle operation may show a route-state confirmation while the
authoritative refreshed row/card remains the primary proof of success.

## Analytics or audit implications

None. Reads, filter changes, and navigation add no product audit event.

## Astryx reference patterns

- `references/astryx/table.md`
- `references/astryx/pagination.md`
- `references/astryx/tooltip.md`
- `references/astryx/popover.md`
- `references/astryx/input.md`
- `references/astryx/select.md`
- `references/astryx/checkbox.md`
- `references/astryx/badge.md`
- `references/astryx/patterns.md`

The ready notes govern density, responsive semantics, layered interactions,
focus, and pagination. Vodafone governs color/type. The 768px switch and
overlay viewport inset are explicit Design Flow mappings, not claimed Astryx
measurements.

## Design Flow reference screens or components

- `docs/ui-component-map.md`
- `docs/ui/team-brief.md` for responsive table/list state conventions
- Existing `src/ui/DataTable`, Button, Input, Select, Checkbox, and Badge

## Acceptance criteria

- Current excludes Done and Archived; each remains explicitly reachable.
- Every contracted URL filter/sort/search value survives refresh and shares a
  stable 25-row server page with display-ID tie-breaker.
- Position defaults and ownership/contribution relationships match the approved
  data rules without duplicate tickets.
- Desktop table and mobile cards contain the required Phase 3 information and
  independent accessible Figma/contributor interactions.
- Loading, empty, no-results, error, unauthorized, long-content, and pagination
  states pass desktop/mobile component, Playwright, and axe coverage.
- Viewer is read-only. No Phase 4/5/6 control is rendered.

## Open questions

None. Phase 4 Log Work, Phase 5 notifications/final work history, and Phase 6
recorded-activity/export controls require their own approved readiness changes.
