# Astryx reference: Checkbox

**Status:** Phase 2 behavior and non-color presentation ready
**Last source review:** 2026-07-20

## Official sources

- [Astryx Checkbox Input](https://astryx.atmeta.com/components/CheckboxInput)
- [Astryx Field](https://astryx.atmeta.com/components/Field)
- [Astryx accessibility guidance](https://astryx.atmeta.com/docs/accessibility)

## Verified Astryx guidance

- A checkbox changes one independent boolean choice. Radio or select controls
  are used for mutually exclusive values.
- The visible text label is part of the activation target. Optional supporting
  text explains consequences without changing the control's accessible name.
- Preserve native Space activation, checked/disabled semantics, form behavior,
  and a visible focus indicator.
- The control aligns to the first line of a wrapping label and uses the shared
  `space/sm` content gap. Phase 2 leaves the native check geometry intact and
  applies Vodafone accent color.

## Design Flow decisions

- `src/ui/Checkbox` owns a native input, required visible label, and optional
  description/error association.
- Viewer + Admin is also prevented by form logic and rejected by the server;
  disabling the checkbox is explanatory convenience, not authorization.

## Open gaps

- Indeterminate group-selection behavior is not required in Phase 2 and is
  deferred.
