# Phase 7 production review

**Status:** Local review complete; zero-billing correction approved;
offline-backup and time-based evidence remain open

## Performance

The production build now separates the initial application from React runtime,
router, Supabase, form/validation, and query dependencies using Vite 8's
Rolldown code-splitting contract. The prior 588.11 kB initial JavaScript chunk
(170.72 kB gzip) is 26.56 kB (8.89 kB gzip); the largest initial dependency
chunk is Supabase at 204.36 kB (52.41 kB gzip), and no build chunk exceeds the
500 kB advisory. Reports and PDF dependencies remain lazy: Reports is 373.30 kB
(109.37 kB gzip) and jsPDF is 399.35 kB (129.64 kB gzip). A separate recorded
hosted Core Web Vitals measurement remains open.

## Security and privacy

- Production/staging builds reject source maps and carry CSP, HSTS,
  `nosniff`, frame denial, no-referrer, and restricted Permissions Policy.
- Browser configuration accepts only environment-appropriate Supabase values.
  Service-role/Auth-admin/provider credentials remain server-side.
- No external client telemetry, analytics, replay, tracing, or error-ingestion
  runtime is shipped. The earlier Sentry integration was removed under D-103;
  no account, project, DSN, or subscription was created.
- `jspdf` was upgraded from 4.0.0 to 4.2.1, and transitive `brace-expansion`
  is overridden from 5.0.7 to 5.0.8, resolving their audited advisories.
- The remaining npm audit result is the React Router RSC advisory
  [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2).
  It applies only to unstable RSC APIs; this application is a client-only
  `BrowserRouter` SPA and imports no RSC server/client APIs. React Router 8.3.0
  is the listed patched line, so the current compatible 7.x dependency retains
  this documented non-applicable scanner finding pending an approved major
  upgrade.
- The repository scanner rejects tracked non-example environment files,
  private keys, AWS/GitHub/Supabase secret-shaped credentials, JWTs, and
  credential-shaped provider values. No unused provider configuration is
  required for the MVP.

RLS/direct-write denial, append-only audit/history, notification isolation,
export visibility, stable codes, and the 400-assertion database suite remain
the authorization baseline. No real customer/production data is used.

## Accessibility, responsive behavior, and states

The cross-product review covers Authentication, shell, Dashboard, Work Items,
work logging, Notifications, Reports/exports, Team/Settings, and global failure
states. Its material theme-storage failure is fixed fail-soft. The completed
local browser gate has 26 applicable desktop/mobile Playwright/axe passes and
two intended device skips, with no local release-blocking finding. The
configured staging gate passed; the one-working-week acceptance matrix remains
open.

## Quota and operational readiness

The monthly quota record covers Supabase database/egress/Auth/Functions,
GitHub Actions, and Cloudflare Pages. Seventy percent is a
warning and 85% is a decision gate. The product creates no artificial
keep-alive traffic and adds no product metrics or quota controls. Current
provider consumption must be read from authenticated consoles before pilot;
no percentage is invented here.

Runbooks now cover deployment, backup/restore, incident, quota, pause/resume,
recovery, and production bootstrap. Admin operational ownership remains
separate from Manager organizational responsibility.

## Unresolved launch gates

- Name the Admin-controlled offline production-backup destination and prove a
  production-source encrypted backup through an isolated restore rehearsal.
- Complete staging gate, hosted failure-stop/recovery, and known-good redeploy
  passed on 2026-07-27; preserve their workflow/run identifiers in the rollout
  record.
- Record current provider quota values and hosted performance/security headers.
- Complete one working week of staging acceptance, separately authorized
  production bootstrap, one working week pilot, launch-blocker retest,
  full-team release, and two-week stabilization. None is started or passed.
