# Astryx reference: Tab List

**Status:** Phase 6 Reports navigation ready
**Last source review:** 2026-07-26

## Official sources

- [Astryx Tab List](https://astryx.atmeta.com/components/TabList)
- [Astryx migration guidance](https://astryx.atmeta.com/docs/migration)
- [Astryx accessibility guidance](https://astryx.atmeta.com/docs/accessibility)

## Verified Astryx guidance

- Tab List switches among related views; it is not a sequential workflow or an
  input control.
- Labels stay short and descriptive. Overflow belongs in a More menu only when
  the visible set grows beyond the available inline space.
- Arrow keys move between tabs. The selected tab and its associated content are
  programmatically related, and focus remains visible.
- Page-navigation tabs may use route state as their source of truth.
- A divider may align tabs and same-size adjacent actions on one baseline.
- Public guidance exposes small/default sizing roles but does not expose stable
  numeric tab padding, indicator thickness, or responsive breakpoints.

## Design Flow decisions

- Reports has exactly three route-backed tabs: Tickets, Designers, and Visual
  Work. No overflow menu is needed.
- `src/ui/TabList` will own tab/list/panel relationships, roving arrow-key
  focus, Home/End support, and activation through the current URL state.
- The existing `product/control/height/md`, focus-ring, border, spacing, and
  motion aliases provide the non-color presentation baseline. Vodafone owns
  color and typography.
- Below the existing `48rem` shell breakpoint the three labels remain visible
  and may wrap as a group; they are not hidden behind a menu or horizontal
  scroll.

## Open gaps

- Official guidance does not expose exact numeric tab padding or indicator
  geometry. Phase 6 reuses existing Design Flow control/border/spacing aliases
  and does not claim those values as Astryx measurements.
