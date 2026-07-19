# Astryx engineering reference index

Astryx is an advisory engineering knowledge source for Design Flow. It is not a runtime dependency, visual source of truth, code source of truth, or required component API.

This directory stores concise notes distilled from official Astryx documentation. The notes should help Codex implement mature Design Flow-owned components without inventing behavior.

## Distillation rules

Every note must:

- link to the exact official source page or pages;
- record the source review date;
- summarize guidance in project-specific language rather than copy documentation;
- separate verified Astryx guidance from a Design Flow decision;
- focus on anatomy, interaction, accessibility, keyboard behavior, states, responsiveness, edge cases, and implementation recommendations;
- omit Astryx source code and avoid reproducing its component API unless a short comparison is necessary;
- defer visuals and token values to `docs/design-system.md`;
- state gaps or uncertainty explicitly.

## Reference set

| File | Scope | Status |
|---|---|---|
| [accessibility.md](accessibility.md) | Cross-component accessibility and keyboard guidance | Phase 1 baseline reviewed |
| [patterns.md](patterns.md) | Reusable interaction and responsive patterns | App-shell baseline reviewed |
| [tokens.md](tokens.md) | Token-architecture lessons only; no Astryx runtime tokens | Shape and motion architecture reviewed |
| [button.md](button.md) | Button anatomy, states, and interaction | Ready for the Phase 1 Button |
| [input.md](input.md) | Text-input anatomy, states, validation, and interaction | Ready for the Phase 1 Input |
| [modal.md](modal.md) | Dialog anatomy, focus management, keyboard, and responsive behavior | Scaffolded; distill before Modal implementation |
| [table.md](table.md) | Table semantics, interaction, overflow, and responsive behavior | Scaffolded; distill before Table implementation |

Add Select, Checkbox, Radio, Badge, Avatar, Tabs, Drawer, Tooltip, Pagination, and other notes before implementing their corresponding `src/ui/` components.

## Required note structure

Use [_component-template.md](_component-template.md) for component notes. The presence of a scaffold is not evidence that research is complete; a component cannot be implemented until its note is marked ready or the implementation plan explicitly records why no Astryx-specific guidance is needed.

Official reference home: [Astryx documentation](https://astryx.atmeta.com/)
