# Quota runbook

**Owner:** Admin/technical maintainer

## Monthly review

Review the provider consoles at least monthly and before release:

| Provider | Review |
| --- | --- |
| Supabase | Database size, egress, Auth usage, Edge Function invocations/runtime, and project state |
| GitHub | Actions minutes/storage and failed test/deployment results |
| Cloudflare | Pages builds and bandwidth |
| Offline backup media | Verified pairs by tier, available capacity, media health, and next restore rehearsal |

Record date, reviewer, plan allowance, current usage/percentage, trend, warning
or decision state, action/owner, and next review. Provider allowances can
change; use the current authenticated provider console rather than copying a
number into this repository.

## Thresholds

- Below 70%: record and continue normal observation.
- At or above 70%: warning; investigate growth and increase review frequency.
- At or above 85%: stop-and-decide gate; before disruption, choose safe
  cleanup, architectural adjustment, or reduced nonessential activity. A paid
  upgrade requires a separate explicit decision and is never automatic.

Never delete required audit/history, weaken retention without an approved
decision, generate artificial keep-alive traffic, or expose provider secrets.
Offline backup retention remains 7 daily, 4 weekly, and 6 monthly pairs unless
an approved contract change is made. Quota review is operational evidence, not a
Designer productivity metric or Manager performance control.
