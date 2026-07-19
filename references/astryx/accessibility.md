# Astryx reference: accessibility

**Status:** Phase 1 baseline reviewed; expand with later components
**Last source review:** 2026-07-19

## Official sources

- [Astryx principles](https://astryx.atmeta.com/docs/principles)
- [Astryx motion](https://astryx.atmeta.com/docs/motion)
- [Astryx App Shell](https://astryx.atmeta.com/components/AppShell)
- Component-specific Button, Text Input, and Field pages linked from their notes

## Verified baseline

- Start with semantic components and native behavior before adding custom interaction.
- Use semantic tokens instead of component-local visual literals.
- Keep navigation, actions, labels, descriptions, and state programmatically identifiable.
- The application shell provides one main content destination and a skip path from repeated navigation.
- Honor the operating system reduced-motion preference and do not let animation block the next interaction.
- Preserve visible focus and communicate validation/status with text rather than color alone.

## Design Flow application

- `src/ui/` owns implementation and public APIs. Vodafone owns color/typography and contrast mappings; verified Astryx guidance owns the preferred remaining presentation and behavior baseline.
- Every product slice tests keyboard access, accessible names, loading, empty, error, and unauthorized behavior as applicable.
- Later composite widgets must add component-specific keyboard and focus guidance before implementation.

## Open gaps

- Dialog focus trapping/restoration, roving focus, live-region announcements, data-table navigation, and tooltip behavior remain deferred to their component notes.
