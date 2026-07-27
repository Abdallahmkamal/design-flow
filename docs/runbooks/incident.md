# Incident runbook

**Owner:** Admin/technical maintainer

## Triage

1. Open a non-secret incident record with UTC start time, reporter, affected
   environment, release SHA, symptoms, and suspected scope.
2. Classify first: security/data integrity; authentication/core workflow;
   degraded lower-impact behavior. During stabilization, handle in that order.
3. Preserve workflow IDs and relevant Supabase, Cloudflare, Sentry, and GitHub
   timestamps. Do not copy ticket text, comments, work logs, emails, tokens,
   Figma URLs, credentials, or production rows into the record.
4. If writes could increase loss or corruption, use the pause/resume runbook.
   If credentials may be exposed, revoke/rotate them in the owning provider and
   review access logs; never paste the replacement into the incident.

## Containment and recovery choice

- Frontend/Function regression: redeploy a reviewed known-good application SHA.
- Database logic defect without loss: apply a reviewed forward corrective
  migration.
- Confirmed loss/corruption: verify an encrypted backup and follow recovery;
  do not overwrite production as a diagnostic step.
- Quota pressure or free-project pause: use the quota or pause/resume runbook.

The Admin coordinates system response and first-line support. The Manager
coordinates organizational communication and reporting-line decisions. Neither
role silently assumes the other's responsibility.

## Closure

Re-run affected RLS, Auth, work-item, work-log, notification, report/export,
responsive/accessibility, and live smoke checks. Record the root cause,
containment, corrective change, restored counts/checksum where applicable,
residual risk, owner, and follow-up date. Notify affected people only through an
approved channel and with the minimum necessary information; this application
does not add incident-notification product features.
