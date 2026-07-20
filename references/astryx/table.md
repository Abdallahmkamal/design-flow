# Astryx reference: Table and dense list

**Status:** Phase 2 behavior and non-color presentation ready
**Last source review:** 2026-07-20

## Official sources

- [Astryx Table](https://astryx.atmeta.com/components/Table)
- [Astryx List](https://astryx.atmeta.com/components/List)
- [Astryx List Item](https://astryx.atmeta.com/components/ListItem)
- [Astryx layout guidance](https://astryx.atmeta.com/docs/layout)
- [Astryx accessibility guidance](https://astryx.atmeta.com/docs/accessibility)

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

### Presentation and responsive behavior

- Design Flow uses the documented `40px` dense-row ceiling as
  `product/table/row-min-height`; wrapping content may make a row taller.
- Cells use the shared `space/sm` block and `space/md` inline aliases, a
  one-pixel divider, and no card elevation.
- At narrow widths the Phase 2 table changes to a structured record list. Each
  value keeps its visible field label and the source column order.
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

## Design Flow decisions

- Vodafone supplies color and typography.
- `src/ui/DataTable` owns the semantic desktop table and structured mobile
  record API. It does not reproduce the Astryx API.
- Phase 2 uses `40px` as a minimum rather than a fixed row height so zoomed and
  long content cannot be clipped.
- Pagination is not introduced for this closed-team slice. Search narrows the
  loaded read model, and the component can gain pagination only when an
  approved slice defines it.

## Open gaps

- Official public guidance does not expose a single required table width,
  column width, or mobile breakpoint. Phase 2 uses the existing Design Flow
  shell breakpoint and content-driven columns; both remain feature-owned.
- Sorting, selectable rows, virtualisation, and pagination are deferred.
