# Astryx reference: Popover

**Status:** Phase 3 behavior and non-color presentation approved
**Last source review:** 2026-07-21

## Official sources

- [Astryx Popover](https://astryx.atmeta.com/components/Popover)
- [Astryx usePopover guidance](https://astryx.atmeta.com/components/usePopover)
- [Astryx browser-support guidance](https://astryx.atmeta.com/docs/browser-support)
- [Astryx Popover documentation source, pinned review](https://github.com/facebook/astryx/blob/eb8e07bb3bf90c400b1bf1d20a5788b3a44cd03e/packages/core/src/Popover/Popover.doc.mjs)
- [Astryx Popover behavior and presentation cross-check, pinned review](https://github.com/facebook/astryx/blob/eb8e07bb3bf90c400b1bf1d20a5788b3a44cd03e/packages/core/src/Popover/usePopover.tsx)

## Verified Astryx guidance

The pinned implementation link is used only to cross-check measurements
exposed by official guidance. Design Flow does not copy the source, styling, or
public API.

### Purpose and anatomy

- A popover is a click-triggered, anchored surface for a small interactive task
  or supplementary detail that does not justify a full dialog.
- The trigger is a real button and exposes expanded/controlled relationships.
- A dialog-like popover has a label, focused body, and a reliable close path.
- Use Tooltip for short non-interactive helper text. Do not nest popovers or use
  one for heavy input, long scrolling content, or a multi-step workflow.

### States and interaction

- Opening auto-focuses the first meaningful control and traps focus within a
  dialog-like popover.
- Clicking outside or pressing Escape dismisses by default. Closing returns
  focus to the trigger.
- Controlled and uncontrolled visibility must produce the same focus,
  dismissal, and ARIA behavior.
- The trigger reports `aria-haspopup="dialog"`, `aria-expanded`, and
  `aria-controls`; the surface has a dialog label.

### Presentation

- The reviewed surface uses a `16px` container radius, low elevation, `12px`
  content padding, and a `4px` gap from the trigger.
- Width is content-driven by default and is at least the trigger width. It must
  shrink or wrap inside the available viewport.
- Vodafone supplies surface, border, shadow color, and typography. Design Flow
  maps the verified low-elevation geometry through `--shadow-xs`.

### Responsive behavior and edge cases

- Prefer placement below/start and allow collision handling to change the
  final side rather than clipping content.
- A narrow viewport may make the contributor list use nearly the available
  inline width, but it remains an anchored non-full-screen surface.
- Browser support for the native Popover API and CSS anchor positioning is
  feature-detected. A functional fallback must still open, dismiss, position
  within the viewport, and manage focus.

## Design Flow decisions

- `src/ui/Popover` owns one labelled, dialog-like trigger/content pair with
  focus entry, focus trap, Escape/light dismiss, a visible close action, and
  focus return.
- The All Tickets contributor popover contains a heading and a noninteractive
  list of names plus its close action. It does not introduce Avatar, Menu,
  Drawer, or Modal.
- The component is not used for Phase 3 edit forms or destructive
  confirmations. Those remain full-page or in-context panels.

## Open gaps

- Official guidance does not prescribe a contributor-list maximum width or
  viewport-edge clearance. Content-driven width plus the proposed centralized
  viewport inset in `docs/design-system.md` is the approved Design Flow fallback.
- Exact collision-flip distances are implementation details. Browser coverage
  must prove that every trigger and close path remains usable at zoom and at the
  narrow-shell viewport.
