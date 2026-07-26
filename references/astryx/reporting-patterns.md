# Astryx reference: reporting and chart layout patterns

**Status:** Phase 6 Reports layout ready; no Astryx chart-component fidelity claim
**Last source review:** 2026-07-26

## Official sources

- [Astryx layout guidance](https://astryx.atmeta.com/docs/layout)
- [Astryx accessibility guidance](https://astryx.atmeta.com/docs/accessibility)
- [Astryx Table](https://astryx.atmeta.com/components/Table)
- [Astryx Tab List](https://astryx.atmeta.com/components/TabList)
- [Astryx Visually Hidden](https://astryx.atmeta.com/components/VisuallyHidden)

## Verified Astryx guidance

- Metrics/console surfaces may combine a tabbed application frame, bounded
  self-contained KPI/chart widgets, and semantic tables for dense source data.
- Dense records belong in rows rather than a card per record. Empty/no-match
  content stays inside the affected region.
- Responsive behavior is an explicit contract: toolbars may wrap, tables may
  become structured records, and required content/action order is preserved.
- Visual-only changes need an accessible textual announcement or equivalent
  content; visually hidden text may supplement terse visual data.
- Official public component guidance reviewed for this phase does not expose a
  chart component, chart geometry, or chart interaction API.

## Design Flow decisions

- Recharts is used only as approved by D-088 for bar and line rendering. It is
  not a shared design-system authority.
- Report chart frames are feature-owned compositions using existing container,
  border, spacing, Vodafone color/type, and data-visualization tokens.
- Every chart has an adjacent semantic summary/table over the same source data.
  Pattern/line style and visible labels supplement color.
- Chart selection is an optional enhancement over labelled filter controls; it
  updates the same URL-backed filter state and never becomes the only drill-down
  path.
- Responsive charts preserve labels and source access; wide detail data changes
  to structured expandable records below the existing `48rem` breakpoint.

## Open gaps

- No official Astryx chart-component measurements were available. Plot sizing,
  tick density, and Recharts-specific behavior remain Design Flow-owned,
  content-responsive implementation decisions verified by browser, zoom,
  Light/Dark, and axe tests. No Astryx chart fidelity is claimed.
