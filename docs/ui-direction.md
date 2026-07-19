# Design Flow UI direction

**Status:** Approved product UI direction

**Decisions:** D-098, D-099

**Last updated:** 2026-07-19 — D-099 refines Vodafone/Astryx visual authority

This document defines stable UI principles and high-level visual direction for Design Flow. It is not a screen-by-screen specification and does not replace product specifications, feature acceptance criteria, Vodafone color/typography foundations, verified Astryx references, or approved screen briefs.

## Product character

Design Flow is an operational product for repeated daily internal use. Its interface should feel:

- operational rather than promotional;
- calm rather than attention-seeking;
- clear about hierarchy, state, and consequence;
- efficient for scanning and repeated actions; and
- dependable for people who use it throughout the working week.

Information comes first. Decoration is secondary and must support comprehension, grouping, or interaction rather than compete with the work.

Use moderate operational density: compact enough to scan lists, histories, filters, and repeated records efficiently, but never so compressed that labels, touch targets, focus indicators, or content become cramped.

## Authority and ownership

- Approved product specifications and decisions own workflow, permissions, domain behavior, and acceptance criteria.
- Vodafone Foundations own color and typography, including semantic color roles/modes and role-based text styles. [design-system.md](design-system.md) documents those authorities.
- Design Flow owns its implementation, public component APIs, tests, documentation, and product-specific components under `src/ui/`. [ui-architecture.md](ui-architecture.md) defines this boundary in detail.
- Verified Astryx references are the preferred baseline for the remaining component presentation and engineering behavior: anatomy, proportions, density, sizing, internal spacing, shape, border/elevation geometry, motion, interaction patterns, accessibility, keyboard behavior, states, and responsive behavior.
- Astryx must not be added as a dependency, wrapper, runtime integration, copied implementation, copied styling file, or copied component API. Design Flow reimplements verified guidance through its own components and semantic aliases.

When sources appear to disagree, use the authority and conflict-resolution order in [ui-architecture.md](ui-architecture.md). Surface unresolved conflicts before implementation.

## Astryx fidelity

“Astryx as styled” means close fidelity to source-linked, measurable Astryx component and pattern guidance after replacing Astryx color and typography with Vodafone equivalents. It does not make Astryx a runtime library or a screen-by-screen product specification.

- Record the official source and review date for every adopted pattern.
- Capture verifiable non-color presentation details instead of describing a component as “Astryx-like.”
- Do not claim fidelity for a value or state that the official guidance does not expose.
- Record unavailable values as gaps and approve a centralized Design Flow fallback before implementation.
- Document the smallest necessary deviation when Vodafone typography, Vodafone color contrast, product behavior, or mandatory accessibility prevents an exact match.

## Tokens and visual expression

- Prefer semantic Vodafone color/typography tokens and approved Design Flow aliases that trace non-color presentation to verified Astryx guidance.
- Do not use raw colors, arbitrary spacing, one-off shape, motion, or elevation where an approved semantic mapping exists.
- If verified Astryx guidance does not expose a necessary presentation value, document the gap and approve a centralized semantic fallback before implementation; do not scatter fallback literals through components.
- Use Vodafone typography/color and Astryx-aligned spacing, shape, motion, and elevation to reinforce information hierarchy and state, not to create decorative variety.
- Status communication must remain understandable without relying on color alone.

Avoid excessive cards, shadows, decorative gradients, oversized dashboard elements, and consumer-marketing styling. Elevation should communicate genuine surface hierarchy, especially temporary or overlapping surfaces, rather than decorate static content.

## Components and composition

- Reuse an existing Design Flow component before extending it, and extend an existing component before creating a new one.
- Create a new shared component only when the product need cannot be served coherently by an existing component or composition.
- Keep feature pages focused on composition; shared behavior and reusable product-specific patterns belong in the appropriate Design Flow-owned UI or feature component.
- Primary actions must be easy to locate and visually distinct from secondary or destructive actions without overwhelming the page.

Choose the interaction surface according to the task:

- Use a page for a substantial task, a durable destination, or work that benefits from broad context.
- Use a drawer or sheet for a focused contextual task that should retain awareness of the current page.
- Use a modal for a short, interruptive decision that requires resolution before continuing.
- Use a popover for a small, transient choice or supporting control.

These defaults guide screen briefs; they do not override approved workflow behavior. A choice that materially changes behavior, navigation, state preservation, or permissions must be recorded in [decisions.md](decisions.md).

## Responsive direction

Design and document behavior mobile-first. The essential workflow, information hierarchy, primary actions, status communication, and permission behavior must remain usable at narrow widths.

Desktop remains the strongest presentation for tables, dense operational comparison, broad filtering, and reporting. Responsive behavior should preserve meaning rather than force a desktop table into an unreadable narrow viewport.

On narrow screens, tables may become structured stacked rows or cards when that improves comprehension. The responsive form must preserve:

- the same information priority;
- the relationship between labels and values;
- status and permission meaning;
- the availability and accessible names of actions; and
- a predictable reading and keyboard order.

Screen briefs must identify intentional responsive transitions instead of leaving them to implementation guesswork.

## State completeness

Every applicable screen, flow, and reusable component must define behavior beyond its successful populated state.

- **Loading:** Identify what is loading, preserve useful layout context where practical, and prevent duplicate submission or misleading interaction.
- **Empty:** Explain what is missing, why the surface is empty when useful, and provide an appropriate next action when the user can act.
- **No results:** Distinguish a filtered or searched result of zero from a truly empty product state and provide a clear way to adjust or clear controls.
- **Error:** Explain the failure in actionable language, preserve entered data where possible, and provide an appropriate retry or recovery path.
- **Disabled:** Use disabled states only when an action is temporarily unavailable, expose the state programmatically, and explain the reason when it is not otherwise evident.
- **Permission denied:** Distinguish unavailable authority from missing data or system failure. Do not present controls that appear usable when the operation is forbidden; provide a safe next step when one exists.
- **Overflow and long content:** Define wrapping, truncation, expansion, scrolling, and action placement so long names, labels, descriptions, histories, and localized or user-entered content do not hide meaning or controls.

Success feedback must confirm the completed operation at the right scope without obscuring the resulting state or implying that a separate operation also succeeded.

## Accessibility and interaction

Keyboard access, visible focus, semantic HTML, accessible names, and color-independent status communication are mandatory.

- Preserve logical focus and reading order across desktop and responsive layouts.
- Document keyboard activation, navigation, dismissal, focus entry, and focus return for interactive patterns where applicable.
- Use native semantic elements whenever they provide the required behavior.
- Give icon-only and ambiguous controls accessible names.
- Keep focus visible in every supported theme and state.
- Communicate errors, required state, selection, expansion, status, and permissions programmatically as well as visually.
- Do not make hover the only way to discover information or actions.

## Screen-level documentation

Before feature UI implementation, create a short screen or flow brief using [ui/screen-brief-template.md](ui/screen-brief-template.md). Briefs should resolve the feature-specific application of these principles without becoming pixel specifications or inventing visual foundations.

Material UI choices that affect product behavior, permissions, domain consequences, navigation, or durable state must be added to the decision register before implementation. Purely presentational choices remain governed by Vodafone color/typography, verified Astryx references, this direction, the relevant brief, and the component contract.
