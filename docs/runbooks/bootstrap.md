# Production bootstrap runbook

**Owner:** Authorized Admin/technical maintainer

**Status:** Production delivery, production-source restore rehearsal, and
authorized one-time bootstrap complete 2026-07-30

## Preconditions

Production delivery, offline backup destination, production-source restore
rehearsal, privacy, security, quota, and live smoke gates must pass first.
Confirm production has no customer
records, public registration is closed, the one-time bootstrap database state
is unconsumed, and the approved first identity/email/timezone are recorded out
of band. Generate the bootstrap secret and initial credential in an approved
secret channel; never place them in Git, browser code, screenshots, workflow
summaries, or this record.

## One-time bootstrap

1. Configure `DESIGN_FLOW_BOOTSTRAP_SECRET` and
   `DESIGN_FLOW_BOOTSTRAP_EMAIL` only as protected server-side Function secrets.
2. From an authorized operator environment, call `bootstrap_first_admin` with
   the protected header and approved display name, email, and IANA team
   timezone. Do not log the request or returned temporary credential.
3. Verify exactly one Auth identity/profile exists, its organizational position
   is Manager, its independent operational privilege is Admin, team settings
   are complete, `bootstrap_state` is consumed once, and the non-secret
   `bootstrap_completed` audit exists.
4. Deliver the temporary credential out of band, require the mandatory first
   password change, then remove the bootstrap secret from the deployed Function
   and verify retry cannot create another account or redisclose a credential.
5. If the one-time response was lost, use only the protected first-Admin
   credential-recovery contract; do not recreate or replace the identity.

## Team establishment

Using audited Admin operations, create any additional Managers, Leads,
Designers, and Viewers; apply independent Admin privilege only where approved;
establish valid reporting lines; then configure statuses, work types,
Areas/Squads, and labels. Viewer + Admin must remain rejected. The Admin owns
accounts/configuration; the Manager owns team-wide hierarchy and reporting.

Do not import historical data automatically. Current work may be entered
manually and prior actual work may use the approved backdated work-log flow.
Never copy the guarded staging fixture, synthetic personas, staging First Admin
credentials, or real customer data into production.

## Audit record

Record UTC time, operator/approver, release SHA, non-secret operation ID, first
profile ID, position/Admin result, timezone, consumed-state result, audit event,
mandatory-password-change result, secret-removal verification, created-account
counts by position, hierarchy/configuration checks, and unresolved gates. Do not
record email, passwords, tokens, or request bodies.

## Production execution evidence — 2026-07-30

- Operator/approver: primary production owner; exact bootstrap authorization
  recorded out of band from secret values.
- Release baseline: merged `main` at `790c831`; deployed application baseline
  `5e4ccbcbd2126f36d0a71780e6215c1a6ccf5b34` from workflow
  `30526117799`, attempt 3.
- Bootstrap operation: `73f8ce95-fc5c-489f-a097-2793d84a25c8`, completed
  `2026-07-30T11:38:45.714Z`.
- First profile: `0a153226-9029-4567-9e1b-f4b420cab0aa`; active Manager plus
  independent Admin, `Africa/Cairo`, no reporting parent.
- State/audit: one consumed bootstrap row and one `bootstrap_completed` event;
  zero Viewer + Admin and zero product rows.
- Credential: mandatory password change completed
  `2026-07-30T11:42:38.109Z`; zero password-restricted profiles afterward.
  The temporary credential was deleted from Keychain and the clipboard cleared.
- Retirement: the bootstrap secret was removed from Supabase and Keychain; a
  retry returned HTTP 500 with no temporary-password field.
- Live smoke: authenticated Dashboard, All Tickets, Reports, Team, Settings,
  and Notifications passed with the Production marker; frontend security
  headers and exact-origin Function preflight returned HTTP 200.
- Recovery point: local post-bootstrap artifact
  `design-flow_production_post_bootstrap_20260730T120201Z.dump.enc` is 596,560
  bytes with SHA-256
  `9727b82d9a5a4dac6aa0f1babd791dcdd23984866ae4c4e23dfc12dd50f137c9`;
  checksum, decryption, archive validation, plaintext cleanup, and temporary
  secret cleanup passed.
- Offline copy: authenticated Drive u/2 listed the artifact/checksum pair; the
  downloaded copies were byte-identical to the local originals and checksum
  valid.
- Remaining gates: record current quotas immediately before pilot; run two full
  pilot working days; fix/retest the accepted 390 px Reports overflow before
  full-team release; then complete the two-week stabilization window.
