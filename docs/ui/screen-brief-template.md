# Screen brief template

Use this template before implementing a feature screen or multi-step flow. Keep the brief concise and behavior-focused. Reference approved product documents, Vodafone color/typography, and verified Astryx presentation instead of inventing workflow or visual rules.

## Screen or flow name

Name the screen or connected flow.

## Purpose

State the user outcome and why this surface exists.

## Primary users and permissions

List the intended positions or privilege combinations, including read-only, denied, and on-behalf-of distinctions where relevant.

## Entry points

List routes, links, shortcuts, notifications, contextual launches, and return paths.

## Primary and secondary actions

Identify the primary action, supporting actions, destructive actions, and their authorization requirements.

## Information hierarchy

Describe what users must understand first, what supports it, and what may be progressively disclosed.

## Content and fields

List required and optional content, field labels, controlled values, helper text, and content ownership. Link to the governing product or schema contract.

## Business rules

Reference the approved validation, permission, domain-operation, history, audit, notification, and state-preservation rules. Do not create new rules in the brief.

## Components to reuse, extend, or create

Identify existing Design Flow components and compositions first. Explain any proposed extension or genuinely new component and its ownership.

## Desktop layout

Describe regions, order, hierarchy, action placement, density, and any table or reporting behavior. Trace component presentation to ready Astryx notes and identify any documented gap rather than prescribing unsupported values.

## Mobile layout

Describe the narrow-screen order, action access, touch and keyboard usability, and how dense information is restructured.

## Responsive transitions

Identify meaningful layout transitions, including when tables become stacked rows or cards and how hierarchy and actions are preserved.

## Interaction and keyboard behavior

Document focus order, keyboard activation and navigation, dismissal, focus entry/return, selection behavior, validation timing, and relevant accessible names.

## Loading state

Describe loading scope, layout continuity, submission protection, and accessible status communication.

## Empty state

Explain the empty condition, its message, and the appropriate next action for authorized users.

## No-results state

Describe filtered or searched zero-results behavior and how users clear or adjust controls.

## Error state

Describe actionable error feedback, preserved user input, retry or recovery behavior, and partial-success handling where applicable.

## Disabled and permission states

Describe temporarily unavailable controls, forbidden actions, read-only presentation, explanatory text, and programmatic state.

## Long-content and overflow behavior

Define wrapping, truncation, expansion, scrolling, sticky actions, and access to full content for long names, labels, descriptions, history, and user-entered text.

## Success feedback

Describe confirmation, resulting navigation or state, focus placement, and how independently completed operations are distinguished.

## Analytics or audit implications, when applicable

Identify approved analytics events or domain audit/history consequences. State `None` when neither applies.

## Astryx reference patterns

Link only to relevant distilled notes under `references/astryx/`. Summarize the verified anatomy, proportions, density, sizing, spacing, shape, elevation, motion, accessibility, interaction, keyboard, state, and responsive guidance being used. Identify unavailable official guidance and the approved fallback. Do not copy source code, styling files, documentation, or component APIs.

## Design Flow reference screens or components

Link to existing Design Flow screens, components, tests, or approved briefs that should remain consistent.

## Acceptance criteria

List testable desktop, mobile, permission, state, keyboard, accessibility, and staging-verification outcomes.

## Open questions

List unresolved choices with their owner and blocking effect. Do not implement behavior that remains materially open.
