# Astryx reference: token architecture

**Status:** Phase 1 presentation values ready
**Last source review:** 2026-07-20

## Official sources

- [Astryx shape](https://astryx.atmeta.com/docs/shape)
- [Astryx motion](https://astryx.atmeta.com/docs/motion)
- [Astryx principles](https://astryx.atmeta.com/docs/principles)
- [Astryx default-theme implementation cross-check](https://github.com/facebook/astryx/tree/main/packages/astryx/src/styles)

Verified Astryx presentation is the preferred target for Design Flow's non-color, non-typographic runtime aliases. Astryx token files, package exports, and token names are not imported into the application; Design Flow records source traceability and exposes its own semantic aliases. The implementation link is a measurement cross-check, not a project source of truth or a source-code dependency.

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

## Verified Phase 1 values

The 2026-07-20 review used the public documentation and cross-checked exposed
measurements against Astryx's public default-theme implementation. Design Flow
maps the following values through its own aliases without copying its code or
API:

| Astryx role | Verified value | Design Flow alias |
| --- | --- | --- |
| Spacing scale | `2, 4, 8, 12, 16, 24, 32, 40, 48px` | `--space-2xs` through `--space-4xl` |
| Inner radius | `8px` | `--radius-inner` |
| Element radius | `12px` | `--radius-element` |
| Container radius | `16px` | `--radius-container` |
| Page radius | `32px` | `--radius-page` |
| Full radius | `9999px` | `--radius-full` |
| Small/default/large control height | `28/32/36px` | `--control-height-sm/md/lg` |
| Border width | `1px` | `--border-width` |
| Focus outline/offset | `2/3px` | `--focus-ring-width/offset` |
| Fast motion | `130/175/230ms` | Phase 1 uses the default `175ms` alias |
| Medium motion | `310/410/550ms` | Phase 1 uses the default `410ms` alias |
| Slow motion | `730/975/1300ms` | Spinner uses the minimum `730ms` value |
| Standard easing | `cubic-bezier(0.24, 1, 0.4, 1)` | `--motion-easing-standard` |
| Pressed scale | `0.98` | `--control-press-scale` |

The official shape guidance assigns container rounding to dialogs, so Design
Flow's overlay alias maps to the same `16px` value until a component-specific
overlay source requires a narrower mapping.

Astryx elevation geometry is:

- low: `0 1px 1px`, then `0 2px 8px`;
- medium: `0 1px 2px`, then `0 2px 12px`;
- high: `0 2px 2px`, then `0 8px 24px`.

Only that geometry is adopted. Vodafone semantic shadow colors remain in force
for Light and Dark modes.

Design Flow uses these lessons and verified values to structure its aliases.
Vodafone supplies color and typography values; Design Flow owns the runtime
names and implementation; Astryx remains the source-linked presentation target
rather than a runtime dependency.
