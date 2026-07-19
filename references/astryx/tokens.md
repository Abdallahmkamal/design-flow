# Astryx reference: token architecture

**Status:** Architecture reviewed; D-099 value redistillation required
**Last source review:** 2026-07-19

## Official sources

- [Astryx shape](https://astryx.atmeta.com/docs/shape)
- [Astryx motion](https://astryx.atmeta.com/docs/motion)
- [Astryx principles](https://astryx.atmeta.com/docs/principles)

Verified Astryx presentation is the preferred target for Design Flow's non-color, non-typographic runtime aliases. Astryx token files, package exports, and token names are not imported into the application; Design Flow records source traceability and exposes its own semantic aliases.

Rules:

- Vodafone Foundations remain authoritative for color and typography.
- Verified Astryx guidance is authoritative for the preferred remaining presentation where official values or qualitative rules are exposed.
- Prefer semantic aliases over component-local literals.
- Map verified Astryx spacing, radius, motion, sizing, elevation geometry, and similar presentation through centralized Design Flow aliases documented in `docs/design-system.md`.
- Record unavailable official values as gaps and approve a Design Flow fallback before use.
- Do not install Astryx, copy its token files, or create a second runtime token system.

Verified architectural lessons:

- Separate interactive-element, content-container, overlay/page, and full-pill radius roles.
- Nested rounded surfaces should remain visually concentric rather than repeating one radius blindly.
- Use fast motion for frequent small state changes and reserve longer spatial motion for changes that help orientation.
- Motion must not delay interaction and must honor reduced-motion preferences.

Design Flow uses these lessons and any verified official values to structure its aliases. Vodafone supplies color and typography values; Design Flow owns the runtime names and implementation; Astryx remains the source-linked presentation target rather than a runtime dependency.
