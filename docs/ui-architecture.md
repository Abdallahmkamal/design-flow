# Design Flow UI architecture

**Status:** Approved MVP architecture with team-ready post-MVP amendments
**Decision date:** 2026-07-18

**Last amended:** 2026-08-08 — D-109 authorizes the team-ready Tailwind/shadcn layer

## Team-ready amendment

D-077 through D-099 remain historically correct for the completed MVP and for unmigrated legacy components. D-109 changes the component workflow only for new or migrated team-ready surfaces:

- Vodafone remains authoritative for color and typography.
- shadcn/ui supplies source-owned starting code, not product behavior or visual authority. Adopted source becomes Design Flow code under `src/ui/` with project-owned APIs and tests.
- Tailwind utilities are authorized for the modernization layer; legacy CSS Modules may coexist until their owning slice is accepted.
- Global Tailwind Preflight remains disabled while any unmigrated legacy screen exists.
- The locked written handoff and Figma references govern team-ready composition and presentation after Vodafone mapping. Astryx remains historical/reference material for legacy MVP components and is not a runtime dependency.
- Add primitives only when required by the current slice. Reusable product compositions remain Design Flow-owned patterns rather than shadcn APIs.

Design Flow uses three complementary layers. They are not competing design systems.

[ui-direction.md](ui-direction.md) defines the stable product character, information-density, responsive, state, accessibility, and composition principles that apply across those layers. Feature-specific screen briefs apply that direction to a bounded screen or flow without replacing the authorities below.

| Layer | Owns | Does not own |
|---|---|---|
| Vodafone Foundations | Color, semantic color modes and roles, typography, and text styles | Non-color component geometry, runtime component code, project component APIs, or unspecified behavior |
| Astryx references | Preferred non-color, non-typographic component presentation and engineering baseline: anatomy, proportions, density, sizing, internal spacing, shape, border/elevation geometry, motion, interaction, accessibility, keyboard behavior, states, responsive behavior, UX patterns, and implementation recommendations | Product color, typography, runtime dependencies, copied source/styling, or final Design Flow APIs |
| Design Flow UI library | Component code, public APIs, tests, documentation, centralized runtime mappings, and product-specific implementation decisions | Undocumented divergence from Vodafone color/typography or verified Astryx presentation |

## Runtime boundary

Design Flow has zero runtime dependency on Astryx.

- Do not install Astryx packages.
- Do not import or bundle Astryx React components.
- Do not create wrappers around Astryx.
- Do not copy Astryx source code or documentation into the repository.
- Do not treat an Astryx component API as the required Design Flow API.

Astryx is a reference specification, not a library dependency. Official guidance is distilled into concise, project-specific notes under `references/astryx/`, with exact source links, review dates, verified presentation details, and explicit gaps.

## Fidelity boundary

“Use Astryx styling” means faithfully reimplement the verified Astryx component and pattern presentation while substituting Vodafone color and typography. It does not mean importing packages, copying source or styling files, reproducing component APIs, or treating Astryx screens as Design Flow product specifications.

Where official Astryx guidance exists, the target includes:

- anatomy, proportions, density, and content arrangement;
- component sizing, internal spacing, shape, and border geometry;
- elevation structure and motion behavior;
- state presentation, interaction, keyboard, and responsive transitions; and
- documented accessibility behavior and edge-case handling.

Vodafone semantic colors replace Astryx colors, including color used for surfaces, text, icons, borders, focus, shadows, and statuses. Vodafone text styles replace Astryx typography. When those substitutions or a mandatory product/accessibility rule make exact geometry impractical, the component note must record the smallest justified deviation.

Fidelity can be claimed only for guidance verified from an official, source-linked Astryx reference. If a value or behavior is not exposed, record the gap; do not infer it from memory, an unrelated component, or a screenshot without measurable evidence.

## Component ownership

Shared UI components live under `src/ui/`. The initial expected set includes:

- Button, Input, Select, Checkbox, Radio
- Badge, Avatar, Tabs
- Modal, Drawer, Tooltip
- Table and Pagination

These are Design Flow components. Their colors and typography resolve through Vodafone semantic tokens and text styles. Their remaining presentation and behavior follow verified Astryx notes through centralized Design Flow aliases. Their implementation and API remain owned by this repository.

The technical plan may refine the internal file layout and documentation tooling, but it must preserve the `src/ui/` ownership boundary and zero-Astryx-runtime rule.

The combined team-ready Slices 7–8 run adds owned `Tabs`, `Table`,
`AlertDialog`, and Recharts-backed `Chart` primitives under
`src/ui/primitives/`. Their public exports and usage constraints are documented
in `src/ui/primitives/README.md`. They use Vodafone-mapped semantic tokens,
no-shadow presentation, native/standard keyboard semantics, contained overflow,
and reduced-motion-safe styling without adding a shadcn or Astryx runtime.

## AI-first component workflow

For each shared component:

1. Read the product need and acceptance criteria.
2. Read the relevant note in `references/astryx/` for verified presentation and engineering guidance.
3. If the note is missing, insufficient, or does not cover measurable presentation, distill the required official Astryx guidance before implementation.
4. Read `docs/design-system.md` for Vodafone color/typography and the approved Design Flow runtime mappings.
5. Map verified Astryx non-color presentation through centralized semantic aliases; record any unavailable Astryx value and approved fallback before using it.
6. Define a project-appropriate public API.
7. Implement the component under `src/ui/`.
8. Document usage, states, and constraints.
9. Add automated behavior and accessibility tests.

Conceptually:

```text
Vodafone color/type + references/astryx/<component>.md + product need
                                  ↓
                        src/ui/<Component>
```

## Presentation mapping and gaps

For spacing, radius, motion, sizing, elevation, or another non-color/non-typographic presentation value:

1. Verify the relevant official Astryx guidance and record its source date.
2. Define a source-traceable Design Flow semantic alias or rule in `docs/design-system.md`.
3. Keep the runtime mapping centralized so reference updates do not require component-by-component literals.
4. If official guidance does not expose the value, record the gap and approve an explicit Design Flow fallback before implementation.
5. Record the change in `docs/decisions.md` when it establishes a reusable product rule or intentional deviation.

Never scatter fallback literals across components.

## Component Definition of Done

A shared component is complete only when it has:

- a documented Design Flow public API and intended use;
- Vodafone color/typography plus verified Astryx-aligned presentation for every supported mode and state;
- defined anatomy, variants, states, and content constraints;
- keyboard and focus behavior where interactive;
- appropriate semantic HTML and accessible naming;
- responsive behavior where relevant;
- loading, disabled, error, empty, and overflow behavior where applicable;
- automated tests for behavior, accessibility-critical paths, and regressions;
- usage examples and known limitations;
- no Astryx runtime import, copied implementation, or wrapper dependency.
- for a team-ready shadcn-derived component, source ownership, Vodafone token mapping, Tailwind isolation, and legacy coexistence are documented and tested.

## Authority and conflict resolution

When sources appear to disagree:

1. Approved Design Flow product behavior and mandatory accessibility requirements win for workflow, domain needs, and usable interaction.
2. Vodafone Foundations win for color and typography.
3. For team-ready migrated surfaces, the approved handoff/Figma direction and Design Flow shadcn composition govern non-color presentation; for unmigrated MVP components, verified Astryx guidance retains its historical authority.
4. Approved Design Flow mappings and fallbacks fill documented gaps or record the smallest necessary product/accessibility deviation.
5. Design Flow owns the final component API and runtime implementation without changing those authority boundaries.

Surface unresolved conflicts rather than silently choosing a source.
