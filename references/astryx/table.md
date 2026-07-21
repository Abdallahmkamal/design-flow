# Astryx reference: Table and dense list

**Status:** Phase 2 ready; Phase 3 ticket-list extensions approved
**Last source review:** 2026-07-21

## Official sources

- [Astryx Table](https://astryx.atmeta.com/components/Table)
- [Astryx List](https://astryx.atmeta.com/components/List)
- [Astryx List Item](https://astryx.atmeta.com/components/ListItem)
- [Astryx layout guidance](https://astryx.atmeta.com/docs/layout)
- [Astryx accessibility guidance](https://astryx.atmeta.com/docs/accessibility)
- [Astryx Pagination](https://astryx.atmeta.com/components/Pagination)
- [Astryx Link](https://astryx.atmeta.com/components/Link)

## Verified Astryx guidance

### Purpose and anatomy

- Use a semantic table when users need to compare columnar values. Use an
  edge-to-edge list of structured records when the same information no longer
  fits as useful columns.
- A table retains a caption, column headers, body rows, and cells. Row actions
  remain explicit controls and are never available only on hover.
- Work-tracker directory rows use the denser end of the layout range. The
  official layout guidance places dense list and table rows in a `32–40px`
  range.

### States and interaction

- Loading, empty, no-results, and error content remains inside the table/list
  context and preserves its accessible name.
- Static directory rows are not selectable and do not acquire button or link
  semantics.
- Sort state is exposed only when sorting exists. Phase 2 does not add column
  sorting.

### Phase 3 interactive ticket results

- A ticket ID and title are native links to the Work Item. Keyboard users reach
  those links directly; a row or card does not acquire fake button semantics or
  an extra tab stop.
- Clicking otherwise noninteractive row/card space may be a pointer convenience
  for the same destination. Independent controls such as Figma and contributor
  popover triggers do not bubble into row navigation.
- Row actions remain explicit, visible controls with accessible names. Nothing
  required is available only from hover.
- Sorting, filtering, and pagination are server-controlled. The table renders
  the current page and does not reorder or filter a client-only subset.
- Phase 3 sorting is controlled by labelled list controls rather than clickable
  column headers, so `aria-sort` is not introduced on headers.

### Presentation and responsive behavior

- Design Flow uses the documented `40px` dense-row ceiling as
  `product/table/row-min-height`; wrapping content may make a row taller.
- Cells use the shared `space/sm` block and `space/md` inline aliases, a
  one-pixel divider, and no card elevation.
- At narrow widths the Phase 2 table changes to a structured record list. Each
  value keeps its visible field label and the source column order.
- All Tickets uses a purpose-built structured ticket card below the same
  `768px` shell breakpoint. The card preserves the ticket hierarchy and
  independent actions instead of mechanically repeating every desktop cell.
- Long names, email addresses, and relationships wrap. Horizontal scrolling is
  a fallback for genuinely column-dependent administration data, not the Team
  directory's primary mobile presentation.

### Keyboard and accessibility

- Preserve native `table`, `caption`, `thead`, `tbody`, `tr`, `th`, and `td`
  semantics on desktop.
- Reading order and DOM order match. Interactive controls keep native keyboard
  behavior and visible focus.
- A responsive record list is a list of records, not a CSS-restyled table whose
  semantics no longer match its visual structure.
- The desktop table and mobile card list are mutually hidden presentation
  branches over the same current-page read model. Only the visible branch is
  exposed to the accessibility tree.
- Pagination follows the result region, has its own labelled navigation
  landmark, and announces page changes without replacing the table caption.

## Design Flow decisions

- Vodafone supplies color and typography.
- `src/ui/DataTable` owns the semantic desktop table and structured mobile
  record API. Phase 3 adds an optional mobile-card renderer and pointer row/card
  activation while leaving native links as the keyboard path. It does not
  reproduce the Astryx API.
- Phase 2 uses `40px` as a minimum rather than a fixed row height so zoomed and
  long content cannot be clipped.
- `src/ui/Pagination` remains separate from DataTable. All Tickets supplies the
  current page and total result count using its URL-backed server query.

## Open gaps

- Official public guidance does not expose a single required table width,
  product column width, or mobile breakpoint. Phase 3 continues to use the
  existing Design Flow shell breakpoint and content-driven columns.
- Selectable rows, virtualisation, bulk actions, and customizable columns remain
  deferred. Phase 3 adds only the approved ticket navigation, mobile-card, and
  paginated-result behavior above.
