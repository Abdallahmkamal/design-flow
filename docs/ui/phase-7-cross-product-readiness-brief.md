# Phase 7 cross-product readiness brief

**Status:** Approved 2026-07-27 for local Phase 7 implementation; external
actions remain separately gated

**Scope:** Cross-product consistency, responsive, accessibility, required-state,
performance, security, monitoring-privacy, and release-readiness review only

**Prepared:** 2026-07-27 from clean `main` at `18233b9`

## Purpose and authority

Review the completed MVP as one product before rollout and resolve only
release-blocking or materially inconsistent behavior. Product behavior and
permissions remain governed by the approved specifications and contracts;
Vodafone owns color and typography; verified Astryx notes own available
non-color presentation; Design Flow owns runtime components and composition.
This brief does not authorize a product feature, a new metric/control, a
post-MVP v1.1 item, or any external deployment.

## Users, routes, and ownership

The review covers every shipped route and all seven valid active principals,
plus inactive and password-restricted states. Viewer + Admin remains rejected.
Admin operational ownership remains separate from Manager organizational and
reporting responsibility. Thin routes continue to compose feature-owned
behavior and Design Flow-owned `src/ui/` components.

## Review matrix

| Area | Acceptance target |
| --- | --- |
| Consistency | Shared actions, labels, status treatment, density, focus, and feedback agree with the approved briefs and component contracts in Light and Dark modes. |
| Responsive | Essential workflows remain usable at narrow widths; structured mobile records preserve labels, values, permissions, action names, and reading/focus order. |
| Accessibility | Semantic HTML, visible focus, accessible names, keyboard operation, focus return, error/status announcements, color-independent meaning, and axe coverage pass. |
| Required states | Applicable loading, empty, no-results, error, unauthorized, disabled, generating, success, long-content, and partial-success states are present and accurate. |
| Data meaning | Planned dates, actual `work_date`, and system timestamps stay distinct; `Planned until` remains due-date disclosure; standalone Visual Work stays outside ticket activity. |
| Security/privacy | RLS and direct-write denial remain authoritative; exports stay capability-limited; no secret, withdrawn body, personal/production data, source map, analytics, replay, or external client telemetry is exposed. |
| Performance/quota | Production build size, critical route behavior, provider usage boundaries, security headers, and the approved 70%/85% quota thresholds are reviewed without adding product controls. |

## Component decision

Reuse the current Design Flow component library and feature compositions.
Phase 7 proposes no new shared UI component and no Astryx runtime dependency.
Any discovered shared-component change must first update its public contract,
ready reference, tests, and the Phase 7 component map; unsupported presentation
values remain blocking gaps rather than guessed literals.

## Review and verification sequence

1. Inventory routes, components, states, and existing automated coverage; use
   Phase 6 workflow #50 and exit-gate workflow #52 as prior evidence.
2. Record findings by severity and contract source. Fix only material Phase 7
   findings, one approved slice at a time.
3. Run narrow checks for each fix, then the complete local gate at the finished
   slice boundary.
4. After separate authorization to alter staging, deploy through the existing
   guarded main workflow and verify the approved desktop/mobile, keyboard,
   axe, privacy, performance, security-header, and smoke matrix in
   authenticated Chrome.
5. Record exact evidence and leave production bootstrap, pilot, and release
   stopped unless each action receives separate explicit authorization.

## Efficiency and token use

- Use `rg` and read only relevant document/code sections.
- Reuse existing CI, staging, Supabase, Cloudflare, test, fixture, security,
  backup, and runbook patterns.
- Batch independent read-only inspections and targeted tests.
- Test each slice narrowly, then run the full suite only at completed slice
  boundaries and final handoff.
- Use workflow evidence already produced by #50 and #52 instead of repeating
  equivalent checks without cause.
- Avoid repository dumps, repeated full-suite runs, duplicate screenshots,
  repeated browser snapshots, and re-reading unchanged documents.
- Keep evidence compact: changed files, exact test counts, workflow/run IDs,
  restore checksums, reconciled fixtures, and unresolved gates.
- Do not use subagents unless explicitly requested.

## Acceptance criteria

- The review matrix covers every shipped route, valid principal, required
  state, supported viewport, Light/Dark mode, and critical keyboard path.
- Material findings are traceable to an approved contract and have targeted
  regression coverage; no unrelated refactor or post-MVP code is introduced.
- Formatting, lint, strict types, unit/component tests, production build,
  Playwright/axe, Colima Supabase reset, pgTAP/RLS, generated types, and Edge
  Function checks pass at the completed-slice boundary.
- Staging smoke, privacy, responsive, accessibility, security-header, and
  performance evidence is recorded only after explicit staging authorization.
- No release-blocking consistency, accessibility, responsive, state, privacy,
  security, performance, or quota finding remains before rollout.

## Approval and open gates

Local implementation was approved on 2026-07-27 after review of this brief and
the Phase 7 operating-readiness brief. D-103 later removed Sentry/R2 from the
MVP and preserved the existing failure UI without adding a component. The
configured staging gate passed; D-104 two-working-day acceptance, production
infrastructure, production bootstrap, pilot, and release remain open or
separately gated actions.

D-105 accepts the evidenced 390 px Reports overflow for staging and the limited
pilot only; correction and affected responsive retest remain required before
full-team release. The separate inactive owner test profiles are excluded from
the active acceptance-principal set.
