# Astryx reference: Input

**Status:** Ready for the Phase 1 Design Flow Input
**Last source review:** 2026-07-19

## Official sources

- [Astryx Text Input](https://astryx.atmeta.com/components/TextInput)
- [Astryx Field](https://astryx.atmeta.com/components/Field)

## Verified Astryx guidance

### Purpose and anatomy

- A text input collects a brief single-line value. Multi-line content belongs in a text area.
- A label is required. Description, placeholder, clear action, status icon, and validation message are optional.
- Placeholder text is a hint and never replaces the label.

### States and variants

- Support default, hover, focus-visible, disabled, read-only through native behavior, and invalid states.
- Validation includes a specific text message; a color change alone is not enough.
- Disabled controls need adjacent explanatory content when the reason is not otherwise clear.

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

- Inputs fill the available form width on small viewports. A later dense layout may constrain width to reflect expected value length without reducing the mobile target.

### Edge cases

- Do not wrap an input that already owns its label/status shell in a second field shell.
- Search/filter clear actions and prefixes/suffixes require separate acceptance criteria.

### Implementation recommendations

- Extend native input attributes and forward the ref.
- Derive stable IDs for the label, description, and error relationship.
- Use a live validation message only when the product needs validation to be announced at that moment.

## Design Flow decisions

- Visuals, size, and radius values come from `docs/design-system.md`.
- The Phase 1 Input owns one field shell with a required label API, optional description/error, native attributes, and forwarded ref.
- The public API is Design Flow-owned and does not copy the Astryx component API.

## Open gaps

- Clear actions, prefixes/suffixes, async validation, multiline input, and compound form layouts are deferred until an approved slice needs them.
