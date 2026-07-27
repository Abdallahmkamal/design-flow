# Quota runbook

**Owner:** Admin/technical maintainer

## Monthly review

Review the provider consoles at least monthly and before a pilot/release:

| Provider | Review |
| --- | --- |
| Supabase | Database size, egress, Auth usage, Edge Function invocations/runtime, and project state |
| GitHub | Actions minutes/storage and failed backup/deployment notifications |
| Cloudflare | Pages builds/bandwidth and private R2 stored objects/operations |
| Sentry | Error-event volume and dropped/rate-limited events |

Record date, reviewer, plan allowance, current usage/percentage, trend, warning
or decision state, action/owner, and next review. Provider allowances can
change; use the current authenticated provider console rather than copying a
number into this repository.

## Thresholds

- Below 70%: record and continue normal observation.
- At or above 70%: warning; investigate growth and increase review frequency.
- At or above 85%: decision gate; before disruption, choose safe cleanup,
  architectural adjustment, reduced nonessential activity, or an approved paid
  upgrade.

Never delete required audit/history, weaken retention without an approved
decision, generate artificial keep-alive traffic, or expose provider secrets.
Backup retention remains 7 daily, 4 weekly, and 6 monthly copies unless an
approved contract change is made. Quota review is operational evidence, not a
Designer productivity metric or Manager performance control.
