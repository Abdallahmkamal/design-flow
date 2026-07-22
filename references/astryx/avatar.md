# Astryx reference: Avatar

**Status:** Phase 4 behavior and fallback presentation ready — approved 2026-07-22
**Last source review:** 2026-07-22

## Official sources

- [Astryx Avatar](https://astryx.atmeta.com/components/Avatar)
- [Astryx Avatar Group Overflow](https://astryx.atmeta.com/components/AvatarGroupOverflow)

## Verified Astryx guidance

- An avatar represents a person or entity using an image, initials, or icon;
  initials provide the suitable fallback when no image is available.
- An avatar-group overflow indicator summarizes hidden people. It should carry
  the true hidden count in its accessible name, be avatar-sized, and may open
  a member list when that interaction is needed.

## Design Flow Phase 4 proposal

- `src/ui/Avatar` will be noninteractive and render an image only when the
  approved profile read model supplies one; Phase 4's synthetic/current model
  otherwise renders initials. It exposes the person's name as accessible text
  when it conveys information and is decorative only when adjacent visible text
  names the same person.
- The Work Dates grid shows at most two initials avatars plus a textual total;
  the total is not a generic `AvatarGroup` or a popover in Phase 4.
- Vodafone supplies avatar color and type through `sem/surface/static/secondary`
  and semantic text/icon roles. No Astryx runtime asset, code, CSS, or API is
  used.

## Presentation gap and approval requested

The official public pages confirm purpose, fallback, and overflow behavior but
do not expose a stable numeric avatar size, overlap, internal padding, or
motion value. Phase 4 proposes the centralized Design Flow fallback of a
noninteractive `28px` circular marker using existing
`product/control/height/sm` and `product/radius/full`; a group has an `8px`
gap using `space/sm`, with no overlap. This is a Design Flow fallback, not an
Astryx measurement, and becomes ready only with Phase 4 UI approval.
