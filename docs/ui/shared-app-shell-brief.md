# Shared application shell brief

**Status:** Phase 2 complete — staged acceptance verified 2026-07-21
**Owning phase:** Phase 2 — Authentication, Team, and Settings

## Purpose

Provide one authenticated, responsive frame with stable product navigation, clear current-user context, theme control, sign-out, and a skip path to the current page.

## Primary users and permissions

- Every active Viewer, Designer, Lead, and Manager whose password restriction is cleared.
- Admin privilege exposes Settings navigation and a separate Admin badge but does not alter the shell structure or default people scope.
- Unauthenticated, inactive, password-restricted, and invalid Viewer + Admin states do not render this shell.

## Entry points

- Every protected route composes inside the shell after session and profile restoration.
- Sign-out returns to `/sign-in`.

## Primary and secondary actions

- Navigate among approved product destinations.
- Switch Light/Dark theme.
- Sign out.
- Feature actions remain owned by their page, not the global shell.

## Information hierarchy

1. Product identity and current page content.
2. Primary product navigation.
3. Current user identity, theme, environment disclosure, and sign-out.

## Content and fields

- Product name: Design Flow.
- Navigation: Dashboard, Work items, Reports, and Team.
- Settings navigation is added only with the Settings implementation and only for Admin-privileged users.
- Current user display name and position are factual context; Admin is shown as a separate badge.
- Synthetic environment disclosure remains visible outside production.

## Business rules

- The shell never grants access; route guards and server authorization remain authoritative.
- Admin privilege does not replace the organizational position.
- Unimplemented destinations remain visibly synthetic placeholders.

## Components to reuse, extend, or create

- Reuse `SkipLink` and `Button`.
- Extend the existing Design Flow-owned `AppShell` composition for authenticated user context and sign-out.
- Use router links for navigation; no new shared navigation component is required for this slice.

## Desktop layout

- Preserve the verified 48px top region, 260px side navigation, 32px navigation items, and elevated page surface with 32px top-start radius.
- Keep user/session actions in the header without crowding the page title region.

## Mobile layout

- Preserve the current non-sticky bottom primary navigation so content is not obscured.
- User context, theme, and sign-out remain reachable in the header and wrap when needed.

## Responsive transitions

- Switch at the verified 768px shell breakpoint.
- Desktop uses persistent side navigation; mobile uses the approved product-specific bottom navigation deviation recorded in `references/astryx/patterns.md`.

## Interaction and keyboard behavior

- Skip link targets the main landmark.
- Navigation uses normal link behavior and exposes the current page.
- Theme and sign-out use native buttons.
- Focus order follows header, navigation, then main content, with visible focus in both themes.

## Loading state

- The shell is withheld during session/profile restoration; the authentication loading surface is shown instead.

## Empty, no-results, and error states

- Not applicable to the shell. Route-level empty/error behavior belongs to the active page.

## Disabled and permission states

- Forbidden navigation is omitted rather than rendered as an apparently available disabled item.
- The shell is absent for unauthenticated, inactive, or password-restricted users.

## Long-content and overflow behavior

- Display names wrap or truncate with the full value available in accessible text.
- Mobile header actions wrap without covering navigation or main content.

## Success feedback

- Sign-out returns focus to the sign-in heading after navigation.
- Theme changes update the accessible control name.

## Analytics or audit implications

None. Theme and navigation are not domain audit events; sign-out remains in Supabase Auth logs.

## Astryx reference patterns

- [Interaction patterns](../../references/astryx/patterns.md) — Phase 1 App Shell presentation and behavior ready.
- [Button](../../references/astryx/button.md) — ready theme/sign-out action behavior.
- [Accessibility](../../references/astryx/accessibility.md) — ready landmark, skip-link, focus, and motion baseline.

## Design Flow reference screens or components

- `src/routes/shell/AppShell.tsx`
- `src/ui/SkipLink/`
- `src/ui/Button/`
- `tests/e2e/authentication.spec.ts`

## Acceptance criteria

- Only eligible authenticated users see the shell.
- Desktop and mobile geometry remains aligned with the ready Astryx note.
- Navigation, theme, sign-out, skip link, current-page semantics, long display names, and keyboard order are tested.
- Team navigation opens the implemented directory; Settings navigation is present only for eligible Admin users.
- Local/staging behavior is verified against this brief before the slice is complete.

## Verification evidence

- Desktop and mobile browser automation covers guarded shell visibility,
  responsive navigation geometry, current-route semantics, theme control,
  skip-link accessibility, long user context, and sign-out.
- The physical Android/Chrome LAN smoke test on 2026-07-20 confirmed the mobile
  sign-in-to-shell path.
- The canonical Cloudflare staging deployment was visually verified on
  2026-07-20 for active-user context, navigation, the explicit `Synthetic
  staging environment` disclosure, the `Staging Phase 2 checkpoint`, and
  sign-out back to the closed sign-in route.
- Slice 2 browser automation verifies Team navigation for eligible active
  users, Settings navigation only for eligible Admin users, the separate Admin
  badge, and direct-route denial before Settings reads for non-Admin users.
- The complete synthetic Phase 2 staging acceptance matrix passed on
  2026-07-21. Manual desktop and mobile checks covered Authentication, Team,
  Settings, responsive navigation, current-user position and independent Admin
  context, theme, sign-out, keyboard navigation, and loading, error, empty, and
  unauthorized route behavior.
- Eligible non-Admin users retained Team navigation without Settings access;
  Settings appeared only for eligible Admin users. Restricted, inactive,
  unauthenticated, and invalid Viewer + Admin states remained outside the
  authenticated shell.

## Open questions

None for Phase 2.
