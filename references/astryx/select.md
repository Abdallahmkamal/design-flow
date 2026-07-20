# Astryx reference: Select

**Status:** Phase 2 behavior and non-color presentation ready
**Last source review:** 2026-07-20

## Official sources

- [Astryx Selector](https://astryx.atmeta.com/components/Selector)
- [Astryx Field](https://astryx.atmeta.com/components/Field)
- [Astryx migration guidance](https://astryx.atmeta.com/docs/migration)

## Verified Astryx guidance

- Use a selector for a bounded option set. Searchable or remotely loaded choice
  sets belong to a typeahead rather than an increasingly complex selector.
- A visible label is required. Description and validation text are associated
  with the control and never replaced by placeholder text.
- Preserve native keyboard navigation, selection announcement, disabled state,
  and mobile platform behavior when a custom popup is not required.
- Phase 2 uses the same default `32px` control height, `12px` element radius,
  one-pixel border, field gap, focus ring, and disabled opacity already mapped
  for Input.

## Design Flow decisions

- `src/ui/Select` wraps a native single-select control and owns its visible
  label, optional description, and validation message.
- It supports bounded positions, supervisors, and timezone choices. It does not
  expose multi-select, async search, or custom option rendering.

## Open gaps

- The public guidance does not require custom popup geometry for the Phase 2
  use cases. Native popup presentation remains platform-owned.
