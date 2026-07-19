# Astryx reference: token architecture

**Status:** Architecture rule locked; detailed distillation deferred  
**Last source review:** Not yet reviewed

Astryx token guidance may inform how Design Flow structures missing foundations, but Astryx token names and values are not imported into the application.

Rules:

- Vodafone Foundations remain the visual source of truth.
- Prefer semantic aliases over component-local literals.
- New Design Flow values for missing radius, motion, sizing, or similar foundations must be centralized and documented in `docs/design-system.md`.
- A later Vodafone token can replace the mapped Design Flow value centrally.
- Do not install Astryx, copy its token files, or create a second runtime token system.

Add exact official sources and verified architectural lessons before using Astryx guidance to establish a new foundation family.
