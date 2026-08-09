# Slice 3 visual verification

Source: [All Tickets desktop and mobile](https://www.figma.com/design/2c9QoPS8BLcTdiIoBEeeni/DesignFlow?node-id=111-39710&t=uzu9Ey4iYueOYTBH-11)

Verified locally on 2026-08-09 with synthetic data only.

## Measured comparison

| Surface | Figma reference | Implemented check |
| --- | --- | --- |
| Desktop frame | 1280 × 953 | 1280 × 953 viewport |
| Desktop content start | approximately 283 px from the left | 287 px, preserving the approved Slice 1 shell |
| Search control | 328 × 48 px | 328 × 48 px |
| Table corner radius | 16 px | 16 px |
| Table header | 40 px, sticky | 40 px, sticky during vertical scroll |
| Table body density | approximately 60 px for ordinary content | approximately 60 px; long synthetic titles wrap and increase only their own row height |
| Sticky edges | Ticket left, Link right | both remain fixed; edge cue appears only after middle content passes beneath |
| Mobile frame | approved 375 px frame | verified at the locked 390 px acceptance width |
| Mobile gutters | 16 px | 16 px |
| Mobile controls | 48 px | 48 px Search, Sort, and Filter controls |
| Mobile cards | 16 px radius | 16 px radius; long content wraps without hiding meaning or controls |

## Captures

- `desktop-populated.png`
- `desktop-horizontal-scroll.png`
- `desktop-filter-chips.png`
- `desktop-no-results.png`
- `desktop-empty.png`
- `desktop-dark.png`
- `mobile-collapsed.png`
- `mobile-expanded.png`
- `mobile-filter.png`
- `mobile-sort.png`
- `mobile-no-results.png`
- `mobile-empty.png`

## Intentional deviations

- The page title remains **All Tickets**, because the locked written product contract owns product naming even though the inspected desktop Figma frame says “Work Items.”
- The locked 11-column server-backed contract supersedes the seven columns visible in the inspected desktop composition. Figma still governs table geometry, sticky treatment, density, controls, and responsive composition.
- The approved Slice 1 shell is preserved, so its desktop content origin differs from the inspected frame by approximately 4 px and its mobile header remains unchanged.
- Long-content evidence intentionally produces taller rows and cards than the short sample strings in Figma; wrapping preserves meaning and actions instead of truncating them.
