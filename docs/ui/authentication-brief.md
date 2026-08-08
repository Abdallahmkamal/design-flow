# Authentication flow brief

**Status:** Phase 2 complete — staged acceptance verified 2026-07-21
**Owning phase:** Phase 2 — Authentication, Team, and Settings
**Implementation scope:** Sign-in, session restoration, mandatory password change, inactive/unavailable account handling, and sign-out

> **Team-ready amendment (2026-08-08):** Modernization Slice 5 retains email sign-in and the closed lifecycle but applies the light shadcn uplift and changes new-password validation to at least eight characters with no composition requirement. UI, Edge validation, tests, and provider configuration change together only when Slice 5 deploys.

## Purpose

Give every provisioned team member a closed, accessible email-and-password entry path and prevent normal application access until the current profile is active and any required first/reset password change is complete.

## Primary users and permissions

- Viewer, Designer, Lead, and Manager may sign in with an Admin-issued account.
- Designer + Admin, Lead + Admin, and Manager + Admin use the same authentication flow; Admin privilege does not change routing or the default people scope.
- A profile with `must_change_password = true` may access only the password-change flow, minimum own-account state, and sign-out.
- An inactive profile receives no normal application data or shell access.
- Public registration, self-service password reset, OAuth, and SSO do not exist in the MVP.

## Entry points

- `/sign-in` for unauthenticated users.
- `/change-password` after first sign-in or an Admin-issued temporary reset.
- `/account-inactive` when a still-present session resolves to an inactive profile.
- Any protected route restores the session first, then redirects according to authoritative profile state.
- Sign-out is available from the authenticated shell and restricted-account screens.

## Primary and secondary actions

- Sign in with work email and password.
- Change password and continue to the application.
- Sign out.
- Supporting copy directs forgotten-password users to an Admin; it does not expose a self-service reset control.

## Information hierarchy

1. Product identity and the current task: Sign in, Change password, or Account inactive.
2. Required fields and validation or server feedback.
3. Closed-access guidance and the safe recovery action.

## Content and fields

- Sign in: Work email and Password.
- Change password: New password and Confirm new password.
- The verified MVP guidance reflected the then-current policy: at least 12 characters with lowercase, uppercase, number, and symbol. D-110 replaces it only when Slice 5 deploys with an eight-character minimum and no composition rule.
- Temporary credentials are never stored in application state beyond the active password input, sent to Postgres, audited, or logged.

## Business rules

- Supabase Auth owns browser sessions and token refresh.
- `profiles.is_active` and `profiles.must_change_password` are authoritative application gates.
- Sign-in never creates an account.
- Password change uses the protected `change_own_password` Edge Function and the idempotent `complete_own_password_change` RPC.
- A successful Auth password update with failed database completion remains restricted and is safely retryable.
- Authentication errors do not reveal whether an arbitrary email address exists.
- Viewer + Admin remains invalid and is handled as an unavailable account state, not repaired by the client.

## Components to reuse, extend, or create

- Reuse Design Flow `Input` for email and password fields.
- Reuse Design Flow `Button` for submit and sign-out actions.
- Reuse native links only for real navigation.
- Create feature-owned authentication route guards, status messaging, and form compositions under `src/features/auth/`; no new shared UI component is required for this slice.

## Desktop layout

- Use one centered, bounded authentication panel on the page canvas.
- Keep the form in a single column with one clear primary action.
- Use the verified Input and Button geometry and the existing container/elevation aliases.

## Mobile layout

- Preserve the same content order and single-column form.
- The panel fills the available width with page padding and never requires horizontal scrolling.
- Inputs use the Vodafone 16px body treatment to avoid mobile zoom.

## Responsive transitions

- Only the outer page padding and panel width adapt; field order, labels, actions, and recovery guidance remain unchanged.

## Interaction and keyboard behavior

- Native form submission works with Enter.
- Focus order is heading context, email, password, primary action, then supporting sign-out/recovery action where present.
- Validation focuses the first invalid field after submission.
- Password fields use appropriate autocomplete values.
- Session redirects replace history so restricted or signed-out users do not bounce through inaccessible routes.

## Loading state

- Session restoration shows an identified status message and no application navigation.
- Form submission disables duplicate activation through Button loading behavior while retaining the action label.

## Empty and no-results states

- Not applicable. Authentication fields are always present.

## Error state

- Field validation is associated programmatically with its input.
- Invalid credentials use a generic actionable message.
- Network/server failures preserve the entered email and active form state and provide retry.
- A failed database completion after password change explains that the new password was accepted but account activation is still pending; retry performs only the completion path through the same operation ID.

## Disabled and permission states

- Submit is disabled only while the current request is pending.
- Restricted and inactive accounts never render the normal application shell.
- An authenticated active account visiting `/sign-in` or `/change-password` is redirected to the application when password change is not required.

## Long-content and overflow behavior

- Email addresses and support text wrap without obscuring actions.
- Error text expands the form vertically and is never truncated.

## Success feedback

- Sign-in routes according to the authoritative profile state.
- Password completion refreshes the profile state, clears sensitive fields, and enters the application.
- Sign-out clears the local session and returns to `/sign-in`.

## Analytics or audit implications

- Sign-in/sign-out use Supabase Auth logs only.
- Password-change completion writes no password or credential audit content.
- Admin-issued resets are audited by their account-lifecycle operation, outside this user-facing flow.

## Astryx reference patterns

- [Input](../../references/astryx/input.md) — ready label, validation, focus, sizing, spacing, and responsive behavior.
- [Button](../../references/astryx/button.md) — ready action hierarchy, loading, keyboard, sizing, and motion behavior.
- [Interaction patterns](../../references/astryx/patterns.md) — ready form/shell density and content-surface guidance.
- [Accessibility](../../references/astryx/accessibility.md) — ready semantic, focus, reduced-motion, and status baseline.

No unavailable Astryx measurement is required by this slice. The authentication panel uses existing Design Flow container and elevation aliases already approved in `docs/design-system.md`.

## Design Flow reference screens or components

- `src/ui/Input/`
- `src/ui/Button/`
- `src/features/auth/SignInPlaceholderPage.tsx`, replaced by this slice

## Acceptance criteria

- Public registration and self-service reset are absent.
- Session restoration, sign-in, sign-out, mandatory password change, inactive account, missing profile, invalid credentials, network error, and retry states are tested.
- Restricted and inactive principals cannot reach the application shell or normal data.
- Forms are keyboard usable, mobile usable, have visible focus, associated errors, accessible status announcements, and no detectable automated accessibility violations.
- The implemented local/staging behavior is verified against this brief before the slice is complete.

## Verification evidence

- Local automated checks cover session loading, closed sign-in, invalid and
  unavailable credentials, mandatory password change and retry, inactive and
  unavailable accounts, guarded routing, sign-out, desktop/mobile geometry,
  keyboard behavior, and automated accessibility.
- A physical Android/Chrome LAN smoke test on 2026-07-20 completed sign-in
  successfully after exercising the mobile runtime path.
- The hosted staging matrix on 2026-07-20 verified public-signup denial,
  first-Admin restricted state, privileged-operation denial before password
  completion, password release, member creation, non-Admin denial, Viewer +
  Admin rejection, temporary reset, browser denial of service-only RPCs,
  deactivation, reactivation, append-only audit/access history, and removal of
  the one-time bootstrap secret.
- The source-map-free Cloudflare staging deployment was visually checked at
  `https://design-flow-staging.pages.dev` for closed sign-in, authenticated
  routing, factual staging disclosure, and sign-out. Only conspicuously
  synthetic staging identities and records were used; disposable credentials
  were rotated after verification.
- The complete synthetic Phase 2 staging acceptance matrix passed on
  2026-07-21. Manual checks reconfirmed that public registration is absent,
  mandatory password change cannot be bypassed, Viewer + Admin is rejected,
  inactive and unauthorized sessions remain outside the application shell,
  and allowed and denied lifecycle actions match the permission matrix.
- An operator-authorized staging-only first-Admin credential recovery completed
  through the audited temporary-reset operation. The mandatory password change
  was completed and the operation finalized with one password-reset audit
  event; no usable credential was committed, audited, or retained in logs.

## Open questions

None. No approved product or technical decision remains open for this flow.
