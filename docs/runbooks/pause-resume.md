# Pause and resume runbook

**Owner:** Admin/technical maintainer

## Provider inactivity pause

The free MVP has no uptime guarantee and must not send artificial keep-alive
traffic. If Supabase is paused after inactivity, confirm the status in the
authenticated project dashboard, record the observation time, use the provider
resume control, and wait for the provider to report healthy. Do not reset,
recreate, relink, or restore the database merely because it is paused.

After resume, verify Auth health, anonymous profile denial, Function CORS,
migration history, application environment/security headers, sign-in, and a
read-only critical journey before allowing normal use. Escalate to recovery
only if integrity checks fail.

## Incident write pause

There is no product-wide pause switch in MVP. Do not invent one or alter RLS
ad hoc. For a confirmed risk that requires stopping writes:

1. record the incident, affected environment, reason, approver, start time, and
   last-known-good SHA/backup;
2. use provider-level containment approved for that exact environment, keeping
   read access only if it is known safe;
3. avoid database resets, destructive SQL, or credential disclosure; and
4. follow the incident and recovery decision tree.

Resume only after the corrective action and integrity reconciliation pass.
Record approver, UTC resume time, checks, release/migration state, and residual
risk. The Admin owns the technical pause/resume; the Manager owns team workflow
coordination during the interruption.
