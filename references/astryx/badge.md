# Astryx reference: Badge

**Status:** Phase 2 behavior and non-color presentation ready
**Last source review:** 2026-07-20

## Official sources

- [Astryx Badge](https://astryx.atmeta.com/components/Badge)
- [Astryx shape guidance](https://astryx.atmeta.com/docs/shape)
- [Astryx accessibility guidance](https://astryx.atmeta.com/docs/accessibility)

## Verified Astryx guidance

- A badge is short, read-only metadata. It is not a button and cannot be the
  only expression of a critical state.
- Keep badge text concise and use a pill shape only for compact metadata.
- Preserve a text label in addition to color. When several badges appear
  together, they wrap instead of truncating or overlapping.
- Phase 2 maps the pill to the existing `product/radius/full` alias, uses
  `space/xs` block and `space/sm` inline padding, and allows content to set the
  final height.
- Badges use Vodafone semantic status or neutral colors and Vodafone caption
  typography.

## Design Flow decisions

- `src/ui/Badge` exposes read-only `neutral`, `info`, `success`, and `warning`
  tones. Error presentation remains available only when a product state
  requires it.
- The Team Admin badge says `Admin`; active/archive badges use visible words.
  No icon-only badge is provided.

## Open gaps

- The public guidance does not expose a mandatory badge height. Design Flow
  therefore uses content padding through existing aliases rather than adding a
  guessed fixed-height token.
