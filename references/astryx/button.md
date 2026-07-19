# Astryx reference: Button

**Status:** Ready for the Phase 1 Design Flow Button
**Last source review:** 2026-07-19

## Official sources

- [Astryx Button](https://astryx.atmeta.com/components/Button)
- [Astryx shape guidance](https://astryx.atmeta.com/docs/shape)
- [Astryx motion guidance](https://astryx.atmeta.com/docs/motion)

## Verified Astryx guidance

### Purpose and anatomy

- A button triggers an action rather than moving to another page.
- The required anatomy is a clear action label. A leading icon and trailing content are optional; a pending action may replace the leading icon with a spinner.
- Reserve the primary treatment for the most important action in a view and use lower-emphasis treatments for the rest.

### States and variants

- Provide normal, hover, pressed, focus-visible, disabled, and loading behavior.
- Loading communicates progress, prevents duplicate activation by default, and is announced to assistive technology.
- Destructive treatment does not replace a confirmation step for an irreversible operation.

### Interaction and keyboard behavior

- Preserve native button activation for Enter and Space.
- Use native button semantics and an explicit `type`; default reusable buttons to `type="button"` so they do not submit forms accidentally.
- A disabled or pending action cannot activate.

### Accessibility

- Use descriptive labels such as “Save changes,” not vague text such as “OK.”
- An icon-only action requires an accessible name and a visible tooltip, so the initial Design Flow Button does not expose an icon-only mode.
- Loading retains the action label and exposes busy state.

### Responsive behavior

- Keep the visible target large enough for the intended density. Design Flow resolves heights through the central control-size aliases and uses larger controls for mobile or prominent form actions.

### Edge cases

- Navigation uses a router-aware link, not a button styled as a link.
- Multiple primary buttons in one view weaken hierarchy.

### Implementation recommendations

- Extend native button attributes, forward the ref, and keep action semantics in the DOM.
- Use visible focus and semantic Design Flow tokens for every state.
- Honor reduced-motion preferences for any loading animation.

## Design Flow decisions

- Visuals, sizes, and radius values come from `docs/design-system.md`.
- The public API is owned by `src/ui/Button`; it does not reproduce the Astryx API.
- The Phase 1 component supports visible-label actions, four emphasis variants, three sizes, optional leading decoration, and a non-interruptible loading state.

## Open gaps

- Icon-only actions, async interruption, tooltips, and destructive confirmation are added only with a product need and their own acceptance criteria.
