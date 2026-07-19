# Design Flow UI architecture

**Status:** Approved MVP architecture  
**Decision date:** 2026-07-18

Design Flow uses three complementary layers. They are not competing design systems.

| Layer | Owns | Does not own |
|---|---|---|
| Vodafone Foundations | Brand identity, color, semantic tokens, typography, spacing, elevation, and later Vodafone foundation additions | Runtime component code, project component APIs, or unspecified behavior |
| Astryx references | Advisory engineering knowledge for anatomy, interaction, accessibility, keyboard behavior, states, responsive behavior, UX patterns, and implementation recommendations | Runtime dependencies, source code, Design Flow visuals, or final APIs |
| Design Flow UI library | Component code, public APIs, tests, documentation, and product-specific implementation decisions | Independent hardcoded visuals that bypass the token system |

## Runtime boundary

Design Flow has zero runtime dependency on Astryx.

- Do not install Astryx packages.
- Do not import or bundle Astryx React components.
- Do not create wrappers around Astryx.
- Do not copy Astryx source code or documentation into the repository.
- Do not treat an Astryx component API as the required Design Flow API.

Astryx is an engineering handbook. Official guidance is distilled into concise, project-specific notes under `references/astryx/`, with source links and review dates.

## Component ownership

Shared UI components live under `src/ui/`. The initial expected set includes:

- Button, Input, Select, Checkbox, Radio
- Badge, Avatar, Tabs
- Modal, Drawer, Tooltip
- Table and Pagination

These are Design Flow components. Their visuals resolve through Vodafone and Design Flow semantic tokens. Their behavior may be informed by Astryx notes, but their implementation and API are owned by this repository.

The technical plan may refine the internal file layout and documentation tooling, but it must preserve the `src/ui/` ownership boundary and zero-Astryx-runtime rule.

## AI-first component workflow

For each shared component:

1. Read the product need and acceptance criteria.
2. Read `docs/design-system.md` for the visual rules and tokens.
3. Read the relevant note in `references/astryx/` for engineering guidance.
4. If the note is missing or insufficient, distill the required official Astryx guidance before implementation.
5. Record any missing visual foundation as a centralized Design Flow token decision before using it.
6. Define a project-appropriate public API.
7. Implement the component under `src/ui/`.
8. Document usage, states, and constraints.
9. Add automated behavior and accessibility tests.

Conceptually:

```text
docs/design-system.md + references/astryx/<component>.md + product need
                                  ↓
                        src/ui/<Component>
```

## Foundation gaps

Vodafone Foundations may not yet define every value Design Flow needs. For radius, motion, sizing, or another missing foundation:

1. Confirm that no suitable Vodafone semantic token exists.
2. Review relevant Astryx guidance for the engineering rationale.
3. Define a Design Flow semantic token or rule in `docs/design-system.md`.
4. Centralize the implementation so it can later map to a mature Vodafone token without component-by-component rewrites.
5. Record the change in `docs/decisions.md` when it establishes a reusable product rule.

Never scatter fallback literals across components.

## Component Definition of Done

A shared component is complete only when it has:

- a documented Design Flow public API and intended use;
- Vodafone/Design Flow token-based styling for every supported mode and state;
- defined anatomy, variants, states, and content constraints;
- keyboard and focus behavior where interactive;
- appropriate semantic HTML and accessible naming;
- responsive behavior where relevant;
- loading, disabled, error, empty, and overflow behavior where applicable;
- automated tests for behavior, accessibility-critical paths, and regressions;
- usage examples and known limitations;
- no Astryx runtime import, copied implementation, or wrapper dependency.

## Authority and conflict resolution

When sources appear to disagree:

1. Approved Design Flow product behavior wins for workflow and domain needs.
2. Vodafone Foundations win for existing visual tokens and brand rules.
3. Approved Design Flow foundation extensions fill documented visual gaps.
4. Distilled Astryx notes guide engineering behavior but remain advisory.
5. Design Flow owns the final component API and implementation decision.

Surface unresolved conflicts rather than silently choosing a source.
