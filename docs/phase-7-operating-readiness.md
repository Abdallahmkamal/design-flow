# Phase 7 operating readiness brief

**Status:** Approved local and staging hardening verified 2026-07-27; strict
zero-billing correction approved; offline-backup and time-based gates open;
production not authorized

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

Rollout remains staging acceptance for one working week, limited production
pilot for one working week, launch-blocker resolution/retest, full-team release,
then two-week stabilization. No record may state that a time-based gate passed
before it actually completes.

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
reset, deactivation, or removal of the preserved staging First Admin identity.

## Approval and external-action matrix

| Action | Current state |
| --- | --- |
| Local Phase 7 implementation | Approved 2026-07-27 |
| Alter staging or staging fixtures | Authorized for Phase 7 verification; completed without fixture replacement |
| Configure Sentry or R2 | Removed from MVP by D-103; no account, subscription, project, bucket, token, or DSN created |
| Push, PR, merge, or staging deployment | Authorized for Phase 7; completed through `de23dcd` and workflow #65 |
| Production infrastructure or bootstrap | Not authorized |
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
production-backup destination and production-source restore rehearsal, one
working week of staging acceptance, production bootstrap, pilot, release, and
stabilization remain unperformed gates.

PR #28 published that correction at `a22b43b`; workflow `30262584748` passed in
3m23s. It merged to `main` at `54af2a3`, and workflow #69 (`30262859965`)
passed the complete staging gate in 3m56s. Authenticated Chrome confirmed the
canonical staging application, staging marker, preserved synthetic First Admin,
and absence of a Sentry script.
