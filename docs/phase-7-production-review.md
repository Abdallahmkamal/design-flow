# Phase 7 production review

**Status:** Phase 7 production-readiness review complete and closed 2026-08-03
under D-108; real-team rollout evidence moves to post-MVP operations

## Performance

The production build now separates the initial application from React runtime,
router, Supabase, form/validation, and query dependencies using Vite 8's
Rolldown code-splitting contract. The prior 588.11 kB initial JavaScript chunk
(170.72 kB gzip) is 26.56 kB (8.89 kB gzip); the largest initial dependency
chunk is Supabase at 204.36 kB (52.41 kB gzip), and no build chunk exceeds the
500 kB advisory. Reports and PDF dependencies remain lazy: Reports is 373.30 kB
(109.37 kB gzip) and jsPDF is 399.35 kB (129.64 kB gzip). A real-user hosted
Core Web Vitals measurement remains unperformed and moves to post-MVP rollout
monitoring because meaningful traffic has not begun.

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
configured staging gate passed; the D-104 two-working-day acceptance matrix
passed on 2026-07-30 under the explicit D-105 exceptions. D-107 records the
known 390 px Reports overflow as nonblocking and defers correction/retest to the
separately scoped post-MVP UI revamp without claiming it is fixed.

## Quota and operational readiness

The monthly quota record covers Supabase database/egress/Auth/Functions,
GitHub Actions, Cloudflare Pages, and offline backup media. Seventy percent is
a warning and 85% is a decision gate. The product creates no artificial
keep-alive traffic and adds no product metrics or quota controls. The
authenticated immediate pre-release review on 2026-07-30 passed: Supabase
organization database usage was 6% and its other applicable allowances were
below 1%; GitHub Actions used 272/2,000 minutes (13.6%) and zero storage;
Cloudflare recorded zero Workers requests/build minutes with no active
subscription; Drive and local encrypted-backup storage remained below the 70%
warning threshold, and the three production backup pairs re-passed checksum
verification. The next monthly review is due by 2026-08-30.

Runbooks now cover deployment, backup/restore, incident, quota, pause/resume,
recovery, and production bootstrap. Admin operational ownership remains
separate from Manager organizational responsibility.

The guarded production workflow passed on run `30526117799`, attempt 3, for
exact `main` SHA `5e4ccbcbd2126f36d0a71780e6215c1a6ccf5b34` after two preserved
failure-stop attempts. The final attempt verified Auth, anonymous RLS denial,
the exact Function origin, source-map denial, Pages security headers, and the
live production marker without adding client telemetry.

## Phase 7 closure and post-MVP handoff

- Complete staging gate, hosted failure-stop/recovery, and known-good redeploy
  passed on 2026-07-27; preserve their workflow/run identifiers in the rollout
  record.
- The immediate pre-release quota gate passed on 2026-07-30. Preserve the
  hosted header evidence and obtain a real-user Core Web Vitals sample only
  after authorized real-user traffic exists.
- The two full working days of staging acceptance passed on 2026-07-29 and
  2026-07-30. Production bootstrap passed on 2026-07-30. By the 2026-08-03
  pre-release reconciliation, production contained thirteen active profiles
  (one Manager, three Leads, and nine Designers), one independent Admin, and
  twenty-two active Areas/Squads. Four password-restricted profiles are
  explicitly excluded from the nine-account initial release roster. The same
  reconciliation found two work items and zero work-log batches/entries; work
  item contents were not copied into evidence. The resulting encrypted
  pre-release recovery point passed local decrypt/archive verification and its
  Drive `u/2` upload/download pair was checksum-valid and byte-identical.
  D-106 retired the unperformed fixed-roster/two-day pilot without marking it
  passed, and D-107 removed the known Reports overflow from the launch-blocker
  set. D-108 closes Phase 7 on this demonstrated readiness evidence. Controlled
  release, the first two monitored working days, real-user Core Web Vitals,
  daily operational backups, and two-week stabilization remain unperformed
  post-MVP operating work with unchanged incident and recovery controls.
