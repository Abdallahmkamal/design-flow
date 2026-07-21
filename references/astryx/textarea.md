# Astryx reference: Textarea

**Status:** Phase 3 behavior and non-color presentation approved
**Last source review:** 2026-07-21

## Official sources

- [Astryx Text Area](https://astryx.atmeta.com/components/TextArea)
- [Astryx Text Area documentation source, pinned review](https://github.com/facebook/astryx/blob/eb8e07bb3bf90c400b1bf1d20a5788b3a44cd03e/packages/core/src/TextArea/TextArea.doc.mjs)
- [Astryx Text Area implementation cross-check, pinned review](https://github.com/facebook/astryx/blob/eb8e07bb3bf90c400b1bf1d20a5788b3a44cd03e/packages/core/src/TextArea/TextArea.tsx)
- [Astryx shared field implementation cross-check, pinned review](https://github.com/facebook/astryx/blob/eb8e07bb3bf90c400b1bf1d20a5788b3a44cd03e/packages/core/src/Field/inputStyles.stylex.ts)

## Verified Astryx guidance

The pinned implementation links are used only to cross-check measurements
exposed by the official guidance. Design Flow does not treat Astryx code or its
component API as a project source of truth.

### Purpose and anatomy

- Use a textarea for multi-line descriptions, comments, and similar long-form
  plain text. Use Input for short single-line values.
- The field always has a programmatically associated label. Description,
  placeholder, required/optional indicator, validation message, and character
  count are supporting content rather than label replacements.
- The underlying control remains a native `textarea` so selection, editing,
  spell checking, paste, and form behavior stay available.

### States and interaction

- Support default, hover, focus-visible, disabled, required, and invalid states
  consistently with the shared Input field shell.
- Validation is expressed with text and `aria-invalid`; color alone is not a
  sufficient error signal.
- Preserve native vertical resizing. The reviewed default is three visible
  rows, and height is controlled by rows rather than the control-size variant.
- A defined character limit may have a live count, but Phase 3 has no approved
  field limit and therefore does not introduce a counter.

### Presentation

- Reuse the verified Input shell: `1px` border, `12px` element radius, `4px`
  block padding, `8px` inline padding, and the existing hover/focus mappings.
- The native textarea has no second border or padding inside that shell and
  uses vertical resize only.
- The default starts at three visible text rows and expands when the user
  resizes it or content wraps. It does not use an invented fixed pixel height.
- Field label, description, and error spacing follows Input. Vodafone supplies
  all color and typography.

### Keyboard and accessibility

- Tab enters the native textarea once; standard text-editing keys retain their
  browser behavior.
- The visible label activates the field. Description and error IDs are merged
  in `aria-describedby`.
- Placeholder text never acts as the accessible name.
- Do not autofocus ordinary create/edit forms. Focus moves only after a user
  action or when recovering from a submitted validation error.

### Responsive behavior and edge cases

- The field fills its form column on narrow screens and keeps native vertical
  resizing without forcing horizontal page overflow.
- User text wraps and preserves line breaks for editing. The read presentation
  may collapse whitespace only where the owning brief explicitly permits it.
- Disabled reasons remain adjacent explanatory text in Phase 3; Tooltip is not
  used to make an otherwise unreachable disabled field explanation.

## Design Flow decisions

- `src/ui/Textarea` mirrors the existing Design Flow Input field contract:
  required `label`, optional `description`, optional `error`, optional hidden
  label, native textarea attributes, and a forwarded ref.
- Phase 3 uses the native `rows` attribute with a default of `3`, permits
  vertical resize, and adds no autosize library or character-count behavior.
- The component is Design Flow-owned and does not reproduce the Astryx API.

## Open gaps

- Official guidance does not prescribe a product-specific maximum description
  or comment length. Phase 3 does not invent one; database validation remains
  authoritative.
- No separate minimum-height token is needed while the native three-row
  contract is used. A future autosize or fixed-height requirement needs a new
  approved reference decision.
