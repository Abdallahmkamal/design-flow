# Astryx reference: Tooltip and icon action link

**Status:** Phase 3 behavior and non-color presentation approved
**Last source review:** 2026-07-21

## Official sources

- [Astryx Tooltip](https://astryx.atmeta.com/components/Tooltip)
- [Astryx Link](https://astryx.atmeta.com/components/Link)
- [Astryx Tooltip documentation source, pinned review](https://github.com/facebook/astryx/blob/eb8e07bb3bf90c400b1bf1d20a5788b3a44cd03e/packages/core/src/Tooltip/Tooltip.doc.mjs)
- [Astryx Tooltip behavior and presentation cross-check, pinned review](https://github.com/facebook/astryx/blob/eb8e07bb3bf90c400b1bf1d20a5788b3a44cd03e/packages/core/src/Tooltip/useTooltip.tsx)
- [Astryx Link documentation source, pinned review](https://github.com/facebook/astryx/blob/eb8e07bb3bf90c400b1bf1d20a5788b3a44cd03e/packages/core/src/Link/Link.doc.mjs)

## Verified Astryx guidance

The pinned implementation link is used only to cross-check measurements
exposed by the official guidance. Design Flow does not copy Astryx code, styles,
or component APIs.

### Purpose and anatomy

- A tooltip provides short, non-interactive supplementary text on hover and
  keyboard focus. It is appropriate for an icon-only navigation control.
- Keep content concise; the official guidance recommends plain text below 140
  characters.
- A tooltip never contains links, buttons, or task-critical instructions.
- A navigation action remains a native or router-aware link. The tooltip does
  not turn it into a button and does not replace its accessible name.

### States and interaction

- Show from pointer hover and `:focus-visible`; hide on pointer/focus leave.
- The reviewed default hover delay is `200ms`, with immediate hide and a short
  hover bridge so the pointer can cross the trigger gap without dismissing the
  surface.
- Escape dismisses an open tooltip. Moving the pointer over the tooltip keeps
  it open long enough to satisfy hoverable-content behavior.
- Essential information remains visible elsewhere in the interface.

### Presentation

- The reviewed surface uses `4px` block and `8px` inline padding, a `4px`
  trigger gap, `16px` container radius, and a `300px` maximum inline size.
- Long tooltip text wraps rather than escaping the viewport.
- The surface has no required elevation shadow in the reviewed component.
- Vodafone supplies the inverted surface/text colors and body typography;
  Design Flow consumes only semantic color and type roles.

### Icon action link

- An icon-only link has a destination-specific accessible name such as
  `Open DF-1042 in Figma` and a matching concise visible tooltip such as
  `Open in Figma`.
- External links open with native anchor semantics. A new-tab destination uses
  `target="_blank"` with `rel="noopener noreferrer"` and an accessible
  announcement that it opens in a new tab.
- The link has the shared visible focus ring and a complete pointer target; the
  icon alone is not the hit area.
- Clicking the independent icon link must not also activate its containing
  ticket row or card.

### Keyboard and accessibility

- The trigger stays the only tab stop. The tooltip itself receives no focus.
- Associate the open tooltip with the trigger using `aria-describedby` without
  replacing any existing description IDs.
- The trigger's accessible name is present even when the tooltip is closed.
- Screen magnification, zoom, and long localized text may enlarge the surface;
  it must stay inside the viewport.

## Design Flow decisions

- `src/ui/Tooltip` owns tooltip behavior and positioning. It accepts one
  focusable trigger and concise text content; it does not accept interactive
  descendants.
- The feature-owned Figma composition is a native anchor plus Tooltip. No
  generic icon-only Button or copied Astryx Link API is added in Phase 3.
- Phase 3 uses the reviewed `200ms` show delay, `4px` gap, and `300px` maximum
  inline size through centralized Design Flow mappings.

## Open gaps

- CSS anchor positioning is not fully available in every supported browser.
  Phase 3 must verify a viewport-safe measured-position fallback in browser
  tests; lack of anchor positioning may reduce placement fidelity but cannot
  make the tooltip unreachable or clip task controls.
- Official guidance does not specify a viewport-edge clearance. The proposed
  centralized Design Flow fallback is recorded in `docs/design-system.md` and
  was approved with the Phase 3 readiness artifacts on 2026-07-21.
