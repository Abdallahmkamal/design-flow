# Monitoring privacy and verification

**Status:** Strict zero-billing MVP boundary approved 2026-07-27; external
client telemetry removed

## Runtime boundary

Design Flow sends no browser errors, sessions, analytics, replay, traces,
breadcrumbs, user context, requests, forms, or application records to an
external monitoring provider. The Sentry SDK, browser DSN configuration, and
capture hooks are not part of the runtime. No Sentry account, project, DSN, or
subscription was created.

The application retains its accessible fail-safe error view. In development,
React render failures may be written to the local developer console. In
staging and production, investigation uses the already-approved Supabase,
GitHub Actions, and Cloudflare Pages logs plus a minimal user report to the
Admin. Users and operators must not paste ticket text, comments, work logs,
emails, Figma URLs, form contents, credentials, tokens, or production rows into
incident evidence.

## Verification

The repository must contain no external monitoring runtime dependency, no
`VITE_` monitoring variable, and no monitoring transport initialization. The
production build must contain no public source maps. The secret scan continues
to reject credential-shaped material even for providers that are not in use.

The earlier privacy scrubber and its tests were valid evidence for the
superseded Sentry design, but they are no longer shipped. Removing the entire
transport is the stronger privacy and zero-billing guarantee.

## Future change gate

External error aggregation may be reconsidered only through an approved
decision that names the provider, data boundary, retention, account owner,
free-plan limits, subscription or overage exposure, and exact authorization.
It is not an unresolved Phase 7 MVP gate.
