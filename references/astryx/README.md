# Astryx engineering reference index

Astryx is Design Flow's preferred reference baseline for non-color, non-typographic component presentation and engineering behavior. Vodafone remains authoritative for color and typography. Astryx is not a runtime dependency, code source, styling-file source, or required component API.

This directory stores concise notes distilled from official Astryx documentation. The notes let Design Flow-owned components faithfully reimplement verified presentation and behavior without importing or copying Astryx.

## Distillation rules

Every note must:

- link to the exact official source page or pages;
- record the source review date;
- summarize guidance in project-specific language rather than copy documentation;
- separate verified Astryx guidance from a Design Flow decision;
- record verifiable anatomy, proportions, density, sizing, internal spacing, shape, border/elevation geometry, motion, interaction, accessibility, keyboard behavior, states, responsiveness, edge cases, and implementation recommendations;
- distinguish exact documented values from qualitative guidance and explicitly mark unavailable measurements;
- omit Astryx source code and avoid reproducing its component API unless a short comparison is necessary;
- defer color and typography to Vodafone and record the centralized Design Flow alias used to represent verified Astryx non-color presentation;
- state gaps or uncertainty explicitly.

## Reference set

| File | Scope | Status |
|---|---|---|
| [accessibility.md](accessibility.md) | Cross-component accessibility and keyboard guidance | Phase 1 baseline reviewed |
| [patterns.md](patterns.md) | Reusable presentation, interaction, and responsive patterns | Behavior reviewed; D-099 presentation review required |
| [tokens.md](tokens.md) | Source-traceable presentation mapping; no Astryx runtime tokens | D-099 redistillation required |
| [button.md](button.md) | Button anatomy, presentation, states, and interaction | Behavior ready; D-099 presentation review required |
| [input.md](input.md) | Text-input anatomy, presentation, states, validation, and interaction | Behavior ready; D-099 presentation review required |
| [modal.md](modal.md) | Dialog anatomy, focus management, keyboard, and responsive behavior | Scaffolded; distill before Modal implementation |
| [table.md](table.md) | Table semantics, interaction, overflow, and responsive behavior | Scaffolded; distill before Table implementation |

Add Select, Checkbox, Radio, Badge, Avatar, Tabs, Drawer, Tooltip, Pagination, and other notes before implementing their corresponding `src/ui/` components.

## Required note structure

Use [_component-template.md](_component-template.md) for component notes. The presence of a scaffold is not evidence that research is complete. A component cannot receive visual approval until its note is marked ready for both behavior and non-color presentation, or every unavailable official detail has an explicit approved Design Flow fallback.

Official reference home: [Astryx documentation](https://astryx.atmeta.com/)
