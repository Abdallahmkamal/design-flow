# Astryx reference: interaction patterns

**Status:** Phase 1 App Shell behavior and non-color presentation ready
**Last source review:** 2026-07-20

## Official sources

- [Astryx App Shell](https://astryx.atmeta.com/components/AppShell)
- [Astryx principles](https://astryx.atmeta.com/docs/principles)
- [App Shell implementation cross-check](https://github.com/facebook/astryx/tree/main/packages/astryx/src/components/AppShell)

## Verified shell guidance

The implementation link is used only to cross-check measurements exposed by the
official guidance. Design Flow does not treat Astryx code or its component API
as a project source of truth.

- Use one outer application shell rather than nesting shells.
- Choose the frame before page content and reserve stable regions for navigation and main content.
- Provide a skip-to-content action.
- Dashboards may use a viewport-filling frame while long settings/forms grow with document content.
- Dense data belongs in rows rather than a card around every item.
- The default shell breakpoint is `768px`.
- The default elevated frame uses a wash surface for top and side navigation and
  a content surface with a `32px` top-start page radius on desktop.
- A default top navigation combines a `32px` control row with `8px` padding,
  giving a `48px` bar. The default side navigation is `260px` wide with `8px`
  internal padding.
- Navigation items are `32px` high, use `8px` inline padding, a `12px` radius,
  and a `2px` list gap. Selected items use a neutral background.
- Forms and settings use `16px` content padding. Dashboards and wide operational
  tables may explicitly use edge-to-edge content.

## Design Flow application

- The Phase 1 shell has one header, one responsive primary-navigation region, one main landmark, and a visible synthetic-environment disclosure.
- Mobile primary navigation remains reachable through a non-sticky bottom
  region that does not obscure page content; desktop uses the verified
  persistent side region.
- Product routes remain visibly synthetic until their approved phases.
- Phase 1 shell geometry, spacing, density, and shape use the verified values
  above. Vodafone color and typography remain unchanged.
- The mobile bottom navigation is a recorded product-specific deviation from
  Astryx's drawer pattern. It keeps all Phase 1 routes reachable without
  introducing an unbriefed Drawer. The Phase 2 shared-app-shell brief must
  approve or replace this behavior before authenticated shell implementation.

## Open gaps

- Responsive drawers, banners, breadcrumbs, overlays, destructive confirmation, and dense-data patterns are distilled only when their approved slices require them.
