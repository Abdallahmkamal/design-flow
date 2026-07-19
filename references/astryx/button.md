# Astryx reference: Button

**Status:** Phase 1 behavior and non-color presentation ready
**Last source review:** 2026-07-20

## Official sources

- [Astryx Button](https://astryx.atmeta.com/components/Button)
- [Astryx shape guidance](https://astryx.atmeta.com/docs/shape)
- [Astryx motion guidance](https://astryx.atmeta.com/docs/motion)
- [Button implementation cross-check](https://github.com/facebook/astryx/tree/main/packages/astryx/src/components/Button)

## Verified Astryx guidance

The implementation link is used only to cross-check measurements exposed by the
official guidance. Design Flow does not treat Astryx code or its component API
as a project source of truth.

### Purpose and anatomy

- A button triggers an action rather than moving to another page.
- The required anatomy is a clear action label. A leading icon and trailing content are optional; a pending action may replace the leading icon with a spinner.
- Reserve the primary treatment for the most important action in a view and use lower-emphasis treatments for the rest.

### States and variants

- Provide normal, hover, pressed, focus-visible, disabled, and loading behavior.
- Loading communicates progress, prevents duplicate activation by default, and is announced to assistive technology.
- Destructive treatment does not replace a confirmation step for an irreversible operation.

### Presentation

- The control is inline-flex with an `8px` content gap, `8px` block padding,
  `12px` inline padding, no default border, and the `12px` element radius.
- Small, default, and large controls are `28px`, `32px`, and `36px` high.
- Leading icons are `16px` in small/default controls and `20px` in large
  controls.
- Hover and pressed feedback is an overlay treatment; pressed state also scales
  to `0.98`.
- State transitions use the default fast duration of `175ms` and standard
  easing. Reduced motion removes the state transition.
- The small loading spinner has a `10px` inner diameter and `2px` border
  (`14px` total). It rotates in `730ms` normally and slows to `3s` under
  reduced-motion preference, following the component-specific source.

### Interaction and keyboard behavior

- Preserve native button activation for Enter and Space.
- Use native button semantics and an explicit `type`; default reusable buttons to `type="button"` so they do not submit forms accidentally.
- A disabled or pending action cannot activate.

### Accessibility

- Use descriptive labels such as “Save changes,” not vague text such as “OK.”
- An icon-only action requires an accessible name and a visible tooltip, so the initial Design Flow Button does not expose an icon-only mode.
- Loading retains the action label and exposes busy state.

### Responsive behavior

- Keep the visible target large enough for the intended density. The verified
  three-size geometry is mapped through central Design Flow aliases.

### Edge cases

- Navigation uses a router-aware link, not a button styled as a link.
- Multiple primary buttons in one view weaken hierarchy.

### Implementation recommendations

- Extend native button attributes, forward the ref, and keep action semantics in the DOM.
- Use visible focus and semantic Design Flow tokens for every state.
- Honor reduced-motion preferences for any loading animation.

## Design Flow decisions

- Vodafone supplies color and typography.
- Verified Astryx guidance supplies the preferred remaining presentation, represented through Design Flow aliases in `docs/design-system.md`.
- The public API is owned by `src/ui/Button`; it does not reproduce the Astryx API.
- The Phase 1 component supports visible-label actions, four emphasis variants,
  three sizes, optional leading decoration, and a non-interruptible loading
  state. Its non-color presentation matches the verified values above.

## Open gaps

- Icon-only actions, async interruption, tooltips, and destructive confirmation are added only with a product need and their own acceptance criteria.
- No Phase 1 Button presentation gap remains. Future Button capabilities require
  their own source review before implementation.
