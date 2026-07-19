# Astryx reference: token architecture

**Status:** Shape and motion architecture reviewed; values remain Design Flow-owned
**Last source review:** 2026-07-19

## Official sources

- [Astryx shape](https://astryx.atmeta.com/docs/shape)
- [Astryx motion](https://astryx.atmeta.com/docs/motion)
- [Astryx principles](https://astryx.atmeta.com/docs/principles)

Astryx token guidance may inform how Design Flow structures missing foundations, but Astryx token names and values are not imported into the application.

Rules:

- Vodafone Foundations remain the visual source of truth.
- Prefer semantic aliases over component-local literals.
- New Design Flow values for missing radius, motion, sizing, or similar foundations must be centralized and documented in `docs/design-system.md`.
- A later Vodafone token can replace the mapped Design Flow value centrally.
- Do not install Astryx, copy its token files, or create a second runtime token system.

Verified architectural lessons:

- Separate interactive-element, content-container, overlay/page, and full-pill radius roles.
- Nested rounded surfaces should remain visually concentric rather than repeating one radius blindly.
- Use fast motion for frequent small state changes and reserve longer spatial motion for changes that help orientation.
- Motion must not delay interaction and must honor reduced-motion preferences.

Design Flow uses these lessons only to structure its aliases. Vodafone visual foundations and the approved Design Flow extension own all runtime values.
