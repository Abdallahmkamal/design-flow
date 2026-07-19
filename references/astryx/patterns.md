# Astryx reference: interaction patterns

**Status:** App-shell baseline reviewed; expand just in time
**Last source review:** 2026-07-19

## Official sources

- [Astryx App Shell](https://astryx.atmeta.com/components/AppShell)
- [Astryx principles](https://astryx.atmeta.com/docs/principles)

## Verified shell guidance

- Use one outer application shell rather than nesting shells.
- Choose the frame before page content and reserve stable regions for navigation and main content.
- Provide a skip-to-content action.
- Dashboards may use a viewport-filling frame while long settings/forms grow with document content.
- Dense data belongs in rows rather than a card around every item.

## Design Flow application

- The Phase 1 shell has one header, one responsive primary-navigation region, one main landmark, and a visible synthetic-environment disclosure.
- Mobile primary navigation remains reachable without opening an unfinished menu; desktop uses a persistent side region.
- Product routes remain visibly synthetic until their approved phases.

## Open gaps

- Responsive drawers, banners, breadcrumbs, overlays, destructive confirmation, and dense-data patterns are distilled only when their approved slices require them.
