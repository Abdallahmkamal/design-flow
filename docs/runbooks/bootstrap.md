# Production bootstrap runbook

**Owner:** Authorized Admin/technical maintainer

**Status:** Procedure documented; production delivery and production-source
restore rehearsal complete; bootstrap requires separate authorization

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
