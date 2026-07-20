# Astryx reference: Input

**Status:** Phase 1 behavior and non-color presentation ready
**Last source review:** 2026-07-20

## Official sources

- [Astryx Text Input](https://astryx.atmeta.com/components/TextInput)
- [Astryx Field](https://astryx.atmeta.com/components/Field)
- [Text Input and Field implementation cross-check](https://github.com/facebook/astryx/tree/main/packages/astryx/src/components)

## Verified Astryx guidance

The implementation link is used only to cross-check measurements exposed by the
official guidance. Design Flow does not treat Astryx code or its component API
as a project source of truth.

### Purpose and anatomy

- A text input collects a brief single-line value. Multi-line content belongs in a text area.
- A label is required. Description, placeholder, clear action, status icon, and validation message are optional.
- Placeholder text is a hint and never replaces the label.

### States and variants

- Support default, hover, focus-visible, disabled, read-only through native behavior, and invalid states.
- Validation includes a specific text message; a color change alone is not enough.
- Disabled controls need adjacent explanatory content when the reason is not otherwise clear.

### Presentation

- Small, default, and large input shells are `28px`, `32px`, and `36px` high;
  Phase 1 uses the default `32px` size.
- The shell has `4px` block padding, `8px` inline padding, a `1px` strong
  border, and the `12px` element radius.
- A field uses a `4px` gap between visible label, description, and control. The
  label uses the secondary text color.
- Hover adds a `2px` inner emphasis mixed from the strong-border color. Focus
  uses the accent border and a `2px` accent-muted inner emphasis.
- Border, focus, and opacity transitions use the default fast `175ms` duration
  and standard easing; reduced motion removes them.
- Disabled inputs use `0.5` opacity.
- An attached field-status surface overlaps upward by `6px`, starts its content
  `14px` below its own top edge, has `8px` remaining padding, and retains the
  `12px` lower-corner radius.

### Interaction and keyboard behavior

- Preserve native editing, selection, autofill, and tab-order behavior.
- The visible label activates the field.
- A future clear action must return focus to the input after resetting it.

### Accessibility

- Associate label, description, and validation message programmatically.
- Keep labels visible by default. A visually hidden label is acceptable only when equally clear visible context remains.
- Expose invalid state and a message that explains the correction.
- Required and optional indicators must not contradict one another.

### Responsive behavior

- Inputs fill the available form width on small viewports. A later dense layout
  may constrain width to reflect expected value length without reducing the
  mobile target. Vodafone's `16px` body size also prevents unintended mobile
  input zoom.

### Edge cases

- Do not wrap an input that already owns its label/status shell in a second field shell.
- Search/filter clear actions and prefixes/suffixes require separate acceptance criteria.

### Implementation recommendations

- Extend native input attributes and forward the ref.
- Derive stable IDs for the label, description, and error relationship.
- Use a live validation message only when the product needs validation to be announced at that moment.

## Design Flow decisions

- Vodafone supplies color and typography.
- Verified Astryx guidance supplies the preferred remaining presentation, represented through Design Flow aliases in `docs/design-system.md`.
- The Phase 1 Input owns one field shell with a required label API, optional description/error, native attributes, and forwarded ref.
- The public API is Design Flow-owned and does not copy the Astryx component API.
- The Phase 1 Input maps the verified default-size and state geometry above
  through Design Flow aliases.

## Open gaps

- Clear actions, prefixes/suffixes, async validation, multiline input, and compound form layouts are deferred until an approved slice needs them.
- No Phase 1 Input presentation gap remains. Deferred capabilities require
  component-specific review when their owning slice needs them.
