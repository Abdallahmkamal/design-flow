# Astryx reference: Pagination

**Status:** Phase 3 behavior and non-color presentation approved
**Last source review:** 2026-07-21

## Official sources

- [Astryx Pagination](https://astryx.atmeta.com/components/Pagination)
- [Astryx Pagination documentation source, pinned review](https://github.com/facebook/astryx/blob/eb8e07bb3bf90c400b1bf1d20a5788b3a44cd03e/packages/core/src/Pagination/Pagination.doc.mjs)
- [Astryx Pagination implementation cross-check, pinned review](https://github.com/facebook/astryx/blob/eb8e07bb3bf90c400b1bf1d20a5788b3a44cd03e/packages/core/src/Pagination/Pagination.tsx)
- [Astryx Table](https://astryx.atmeta.com/components/Table)

## Verified Astryx guidance

The pinned implementation link is used only to cross-check measurements and
semantics exposed by official guidance. Design Flow does not reproduce the
Astryx component API.

### Purpose and anatomy

- Pagination follows the result set it controls and lets users move between
  one-based pages.
- Numbered pages are the preferred data-table variant when direct page jumps
  matter. Previous and Next remain present at the boundaries in a disabled
  state.
- Known totals expose both the page count and the current result range.
- Do not render pagination when all results fit on one page.

### States and interaction

- The current page uses `aria-current="page"` and a distinct non-color state.
- Previous is disabled on page one; Next is disabled on the last page. While a
  requested page is loading, repeated activation cannot commit an invalid or
  stale page.
- Page changes are announced politely after user activation. Initial render is
  not announced as a change.
- Ellipses are presentational and never interactive.

### Presentation

- The reviewed default page controls use the `32px` control height, `4px` gaps
  between controls, and `16px` separation between pagination regions.
- Number buttons reuse Button shape, focus, pressed, disabled, motion, color,
  and typography mappings.
- The control stays below the table or mobile-card list; it does not float over
  results or appear above them.

### Keyboard and accessibility

- The root is a labelled `nav` landmark. Every page control has a destination-
  specific name such as `Go to page 3`.
- Native buttons supply Tab, Enter, and Space behavior. Numbered pagination is
  not a roving-tabindex composite.
- Loading state leaves the current page understandable, and focus stays on the
  activated control unless that control no longer exists after result changes.
- On page change, the owning screen moves focus to the updated result heading
  or announces the range according to the screen brief; it does not force focus
  to the top of the application.

## Design Flow decisions

- `src/ui/Pagination` receives `page`, `pageSize`, `totalCount`, and a page-
  change callback. All Tickets fixes page size to `25`; no page-size selector is
  exposed in Phase 3.
- It renders the numbered-page variant with visible Previous and Next labels so
  no new generic icon-only Button mode is required.
- All Tickets treats the URL as the page-state source of truth and resets to
  page one whenever a search, filter, view, sort, or direction value changes.
- Ticket display ID is the stable server-side tie-breaker; pagination never
  sorts a client-only subset.

## Open gaps

- Official guidance does not define the product page size or the maximum
  number of page buttons. The approved Phase 3 plan supplies `25` rows per page;
  Design Flow will use one sibling around the current page with first/last page
  boundaries and inert ellipses.
- Responsive wrapping order is not prescribed. Design Flow keeps range text
  before controls in DOM order and allows the two regions to wrap without
  horizontal page overflow.
