# Monitoring privacy and verification

**Status:** Local implementation complete; staging provider configuration
authorized but blocked by no authenticated Sentry session or DSN

## Runtime boundary

Sentry is optional and initializes only in staging or production when a valid
HTTPS `sentry.io` browser-ingest DSN is supplied. Local, test, and preview
environments reject monitoring transport. The browser DSN is a public ingest
locator, not a Sentry auth token; auth tokens, organization credentials, and
source-map upload credentials must never use a `VITE_` variable or enter the
bundle.

The SDK is loaded as a separate dynamic chunk. Default integrations are off.
Design Flow installs only minimal `window.error`, `unhandledrejection`, and
React error-boundary capture. Session replay, tracing, breadcrumbs, automatic
sessions, user context, request/response data, Supabase instrumentation, form
capture, and feedback widgets are not configured.

## Privacy controls

- `sendDefaultPii` is false and every SDK data-collection category is
  explicitly disabled, including cookies, headers, bodies, URL queries,
  database query data, local variables, and source context lines.
- The final `beforeSend` allowlist keeps only event metadata, environment, two
  controlled tags, exception type, generic failure text, and minimal stack
  locations. Same-origin frame locations lose query/fragment data; external
  frame URLs are redacted.
- User, request, breadcrumb, context, extra, arbitrary tag, fingerprint,
  transaction, email, Figma URL, ticket/comment/work-log/form content,
  credential, and token data do not survive the final scrubber.
- Non-`Error` promise rejections become a generic `Error`; their original value
  is never handed to the SDK.
- Monitoring initialization is fail-soft and cannot prevent the portal from
  rendering when the SDK chunk or transport configuration is unavailable.

## Build and test evidence

Local targeted tests prove monitoring remains disabled without a DSN, reject
unsafe DSNs/environments, assert all collection switches, show no replay
configuration, sanitize a deliberately sensitive synthetic event, and verify
global capture uses only a controlled source tag.

The completed Slice 7B gate passed formatting, lint, strict typecheck, 104
unit/component tests, the production build, and 26 applicable desktop/mobile
Playwright/axe scenarios with two intended device-specific skips. The
unchanged database and Edge Function boundary reuses the immediately preceding
Slice 7A evidence of a zero-to-current Colima reset, 400 pgTAP/RLS assertions,
matching generated types, and 16 Edge Function tests; those gates will be run
again at final handoff.

A synthetic staging-mode production build on 2026-07-27 produced a separate
~85 kB monitoring chunk. It contained no `session replay` or
`replayIntegration` marker, no synthetic private test payload, and no public
source map. No event was sent and no Sentry project or external setting was
created.

## External gates

When an authenticated Sentry session is available, configure only the public
browser DSN in the protected staging environment, trigger one generic synthetic
failure with no user-entered data, and inspect the resulting event in Chrome.
Confirm the allowlisted payload and absence of replay before considering
production configuration. Production monitoring remains separately gated.
