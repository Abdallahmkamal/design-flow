# Phase 7 operating readiness brief

**Status:** Local/staging hardening, two-day staging acceptance, guarded
production delivery, production-source restore, and production bootstrap
verified; pilot, release, and stabilization remain gated

**Prepared:** 2026-07-27 from clean `main` at `18233b9`

## Outcome and boundary

Complete the approved production-hardening operating model without creating or
altering production infrastructure, deploying, bootstrapping production,
starting a pilot, sending alerts, changing external services, or altering
staging unless the exact action is separately authorized. No real customer or
production data may enter local or staging evidence.

The baseline repository contained only the Phase 1–6 CI/staging delivery
workflow and `docs/staging-deployment.md`. Phase 7 now supplies the separate
production deployment, backup/restore, incident, quota, pause/resume, recovery,
and production-bootstrap runbooks. They describe local implementation and
gates; they do not turn an unperformed external action into evidence.

## Approved-scope slices

| Slice | Deliverable and demonstrable gate |
| --- | --- |
| 7A — Product review | Complete the cross-product brief and resolve only material consistency, responsive, accessibility, state, performance, security, and quota findings. |
| 7B — Private failure handling | Preserve the accessible fail-safe error UI and use only existing Supabase/GitHub/Cloudflare operational evidence; ship no external client telemetry, replay, analytics, or error-ingestion dependency. |
| 7C — Backup and restore | Keep compressed, encrypted, checksummed logical-backup tooling and 7 daily/4 weekly/6 monthly offline retention under Admin control. Demonstrate a checksum-verified decrypt/restore rehearsal against disposable infrastructure, including explicit Auth credential limitations. Name and rehearse the production offline destination before rollout. |
| 7D — Ordered delivery and recovery | Complete guarded staging and manual production workflows: independently verified offline pre-migration backup evidence; forward migrations; Functions; Auth/database smoke; frontend; live smoke. Prove a failed migration stops later stages and a known-good frontend/Function commit can be redeployed. Never add automatic down-migrations or ordinary backup rollback. |
| 7E — Operations and rollout | Create deployment, backup/restore, incident, quota, pause/resume, recovery, and bootstrap runbooks; add compact performance/security/accessibility/responsive/quota evidence and auditable pilot/release records. Production bootstrap, pilot, and release stay unexecuted without separate authorization. |

Each slice requires its own accepted criteria, narrow local verification, full
completed-slice gate, and separately authorized staging checkpoint. A later
slice may reuse recorded evidence but may not claim an unperformed external
action.

## Security and failure behavior

- Browser bundles, logs, commits, screenshots, docs, artifacts, monitoring,
  and workflow output must not contain service-role, Auth-admin,
  Cloudflare, Supabase, production, credential, token, email, ticket,
  comment, work-log, Figma URL, or form-content secrets/private payloads.
- RLS, direct-write denial, append-only history, stable codes, notification
  isolation, export visibility, and the Phase 6 team-date collision fix and its
  regression coverage remain unchanged unless an approved Phase 7 correction
  is necessary.
- Delivery stops on backup verification, migration, Function, smoke, build, or
  frontend failure. Later stages must not run or report success.
- Database changes are backward-compatible and forward-only. A reviewed
  corrective migration is the normal database recovery; backup restore is for
  confirmed data loss or corruption.
- Backup encryption keys remain separately Admin-controlled. Checksums are
  verified before offline storage and before restore. Recovery
  evidence records identifiers/checksums, not secret material.

## Bootstrap and rollout gates

The documented procedure must create the first production identity as Manager
+ Admin through the one-time bootstrap contract, preserve its operational
Admin and organizational Manager meanings, force the first password change,
consume and retire the bootstrap secret, and append the non-secret audit event.
It must then establish the approved hierarchy and controlled lists without
automatic historical import. Documentation is authorized only after brief
approval; executing bootstrap is not.

Under D-104, rollout requires two full working days of staging acceptance, two
full working days of limited production pilot, launch-blocker
resolution/retest, full-team release, then two-week stabilization. A blocked or
partial day does not count, and no record may state that a time-based gate
passed before it actually completes.

D-105 accepts two named exceptions for staging and the limited pilot: two
owner-created inactive test profiles remain outside the active reserved-persona
matrix, and the evidenced 390 px Reports overflow is nonblocking until
full-team release. The overflow must be corrected and retested before that
release; neither exception weakens security, recovery, permission, or
data-integrity gates.

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

## Evidence and final handoff

Record changed files, exact local test counts, workflow/run identifiers,
staging smoke results, migration order, backup artifact identifiers and
checksums, restore duration/result/Auth limitation, failure-stop proof,
known-good redeploy proof, secret-scan and header results, monitoring privacy
tests, quota review, reconciled synthetic fixtures, and unresolved gates.

Final review must reject secrets, personal/production data, unrelated changes,
post-MVP code, unsafe delivery behavior, invented success, and any replacement,
reset, deactivation, or removal of the preserved staging bootstrap Manager +
Admin identity; there is no separate First Admin account.

## Approval and external-action matrix

| Action | Current state |
| --- | --- |
| Local Phase 7 implementation | Approved 2026-07-27 |
| Alter staging or staging fixtures | Authorized for Phase 7 verification; completed without fixture replacement |
| Configure Sentry or R2 | Removed from MVP by D-103; no account, subscription, project, bucket, token, or DSN created |
| Push, PR, merge, or staging deployment | Authorized for Phase 7; completed through `de23dcd` and workflow #65 |
| Production infrastructure and guarded delivery | Authorized and completed 2026-07-30 for `main` SHA `5e4ccbc`; workflow run `30526117799` attempt 3 passed |
| Production-source restore rehearsal | Authorized and passed 2026-07-30; disposable target deleted and staging resumed healthy |
| Production bootstrap | Authorized and passed 2026-07-30; one active Manager + Admin owner, mandatory password change complete, one-time secret retired |
| Pilot or full-team release | Not authorized |

## Current local evidence — 2026-07-27

Formatting, lint, strict types, 117 unit/component/automation tests, the
production build, 26 applicable Playwright/axe checks with two intended device
skips, all fourteen migrations from zero on Colima, 400 pgTAP/RLS assertions,
generated types, 16 Edge Function tests, and a 308-file repository secret scan
pass. The encrypted restore rehearsal and its exact checksum/counts are recorded
in the backup/restore runbook. The complete configured staging gate, hosted
failure stop/recovery, and known-good redeploy passed. The strict zero-billing
correction passed formatting, lint, strict types, 29 test files/105 tests, 26
Playwright/axe passes with two intended skips, a production-mode build, 25
focused contract tests, and a 301-file secret scan. The named offline
pilot, release, and stabilization remain unperformed gates. The two-working-day
staging acceptance gate passed on 2026-07-30 under
the explicit D-105 staging/pilot exceptions.

PR #28 published that correction at `a22b43b`; workflow `30262584748` passed in
3m23s. It merged to `main` at `54af2a3`, and workflow #69 (`30262859965`)
passed the complete staging gate in 3m56s. Authenticated Chrome confirmed the
canonical staging application, staging marker, preserved synthetic bootstrap
Manager + Admin identity, and absence of a Sentry script.

Production was then configured without Sentry or R2 and delivered at
`https://designflowapp.pages.dev`. Workflow `30526117799` preserved a missing
Function-origin failure and a transient Pages-asset HTTP 522 before attempt 3
passed every ordered stage in 2m06s. Production contains the reviewed schema,
Functions, frontend, and one approved active Manager + Admin owner identity,
but no customer/product data.
The post-delivery artifact and Drive copy then passed checksum/byte comparison,
and the authorized isolated hosted restore reconciled to the empty production
source. The disposable project was deleted and staging resumed healthy.

The separately authorized bootstrap then completed through operation
`73f8ce95-fc5c-489f-a097-2793d84a25c8`. Production reconciled to one Auth
identity/profile, Manager position plus independent Admin privilege,
`Africa/Cairo`, consumed bootstrap state, one bootstrap audit, and no Viewer +
Admin or product rows. The required first password change completed, the
one-time secret and temporary credential were retired, a retry disclosed no
credential, and all six authenticated production routes passed live smoke.
