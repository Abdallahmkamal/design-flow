# Phase 7 rollout record

**Status:** Local and configured staging hardening verified; Day 1 staging
acceptance passed with D-105 exceptions; zero-billing correction approved;
offline-backup and remaining rollout gates open; production not authorized

| Gate | Evidence | State |
| --- | --- | --- |
| Phase 6 staging closure | PR #21 at `18233b9`; workflow #52 passed the complete staging gate in 3m56s | Passed 2026-07-27 |
| Local UI review | Cross-product brief; 94 tests at Slice 7A, 26 Playwright/axe passes and 2 intended device skips, 400 pgTAP/RLS, 16 Function tests | Passed 2026-07-27 |
| Final local Phase 7 gate | Formatting, lint, strict types, 117 unit/component/automation tests, production build, 26 Playwright/axe passes and 2 intended skips, 14-migration Colima reset, 400 pgTAP/RLS, generated types, 16 Function tests, secret scan of 308 repository files | Passed 2026-07-27 |
| Monitoring privacy | External Sentry runtime/DSN path removed under D-103; no account, project, event, or subscription created; accessible fail-safe UI retained | Passed locally 2026-07-27 |
| Zero-billing local correction | Formatting, lint, strict types, 29 test files/105 unit-component-automation tests, 26 Playwright/axe passes and 2 intended skips, production-mode build without monitoring dependency/source maps, 25 focused contract tests, and 301-file secret scan | Passed locally 2026-07-27 |
| Zero-billing publication and staging | PR #28 commit `a22b43b`; PR workflow `30262584748` passed in 3m23s (frontend/browser 3m20s, Supabase/Deno 2m17s); merged to `main` at `54af2a3`; main workflow #69 (`30262859965`) passed in 3m56s (frontend/browser 1m58s, Supabase/Deno 2m06s, staging 1m43s). Authenticated Chrome loaded the canonical staging app with the preserved `[SYNTHETIC] Manager + Admin`, the staging marker, and no Sentry script. | Passed staging 2026-07-27 |
| Backup/restore | Encrypted/checksummed synthetic artifact `design-flow_restore_rehearsal_20260727T083200Z.dump.enc`, SHA-256 `c8c030f7819fd4659db6f8ae3e63ff41f6b36875836a9845e0069a0448b43e90`; 14 migrations, 9 identities/profiles, 9/14/20/50 fixture reconciliation, zero Viewer + Admin | Local provider-agnostic tooling passed; production offline destination/rehearsal open |
| Zero-billing provider decision | R2 required accepting usage-based overage terms; no acceptance, bucket, token, or charge occurred. D-103 removed Sentry/R2 from the MVP. | Approved 2026-07-27 |
| Delivery failure stop | Workflow #64 (`30258329567`) applied ephemeral migration `20260727103338_phase_7_failure_rehearsal.sql`, received the intentional PostgreSQL exception, and skipped migration-history verification, Functions, frontend, Pages, and live smoke; workflow #65 then reported the remote database up to date and exactly 14 hosted migrations | Passed staging 2026-07-27 |
| Known-good redeploy | First run `30256633370` stopped safely at an unexpanded Pages-project input; PR #25 corrected the action expression; run `30257511622` redeployed reviewed main SHA `7d2d531` Functions/frontend with backend/live smoke and no database mutation | Passed staging 2026-07-27 |
| First Phase 7 staging delivery | PR #22 merged at `78aeae0`; workflow #55 passed migrations/types, Functions, backend smoke, build, source-map denial, and Pages upload, then stopped at immediate live CSP check while the canonical URL still served the prior document | Failed safely; bounded propagation retry correction in progress |
| Staging propagation closure | PR #23 merged at `7d2d531`; workflow #56 passed both PR jobs in 2m15s; workflow #57 preserved ordering and passed all delivery stages before the final smoke stopped after 51s because the bounded asset scan omitted the Work Item chunk beyond its first twenty imports | Failed safely; bounded same-origin scan correction verified locally with 117 tests |
| Complete Phase 7 staging delivery | PR #24 merged at `bd6eaa3`; workflow #59 passed in 4m01s. PR #25 merged at `f4d6c25`; workflow #61 passed in 4m11s. PR #26 merged at `de23dcd`; default workflow #63 passed in 4m54s and post-failure recovery workflow #65 passed in 3m30s | Passed configured staging gate 2026-07-27 |
| Two-working-day staging acceptance | D-104 requires two full passing working days. D-105 accepts the two inactive owner test profiles and 390 px Reports overflow as explicit nonblocking staging/pilot exceptions. | Day 1 passed 2026-07-29; one of two days passed |
| Production bootstrap | Auditable procedure only | Not authorized/not run |
| Two-working-day limited pilot | D-104 requires two full passing working days with Admin + Lead, Manager, another Lead, and two Designers | Not authorized/not started |
| Full-team release | Requires the D-105 Reports overflow correction/retest plus any later launch-blocker resolution | Not authorized/not started |
| Two-week stabilization | Starts only after full-team release | Not started |

No time-based gate may be marked passed early. Production contains no record or
infrastructure created by this work.

## Staging acceptance — Day 1 attempt (2026-07-28–2026-07-29)

**Environment:** canonical `https://design-flow-staging.pages.dev` on merged
`main` at `735b14c`, inspected through authenticated Chrome. July 28 was
read-only. On July 29 the owner separately authorized credential maintenance
for the eight non-Manager+Admin reserved personas. No ticket, work-log,
comment, report, fixture dataset, production resource, external service, or
delivery workflow was changed.

### Concrete evidence

| Check | Evidence | Result |
| --- | --- | --- |
| Bootstrap Manager + Admin identity | The staging bootstrap identity is the single `[SYNTHETIC] Manager + Admin` persona; there is no separate First Admin account. Its Manager position and independent Admin privilege were visible together with the staging marker. Its credential, profile, active state, and access were not changed. | Passed |
| Credential-maintenance recovery | Admin reset was exercised for all eight other reserved personas. Viewer, Designer, Designer + Admin, Lead, Lead + Admin, and Manager completed the mandatory first-change gate. The password-restricted Designer was intentionally left at that gate. The inactive Designer was temporarily reactivated with its approved Lead, reset, completed the change, immediately deactivated, and then received the generic sign-in denial. No credential value was recorded. | Passed |
| Seven valid active principals | Viewer, Designer, Designer + Admin, Lead, Lead + Admin, Manager, and Manager + Admin authenticated successfully. Dashboard position defaults remained Admin-neutral; Viewer had no mutation shortcuts; all other eligible positions retained their approved Dashboard actions. | Passed |
| Admin versus Manager ownership | Designer + Admin, Lead + Admin, and Manager + Admin opened Settings. Viewer, Designer, Lead, and Manager received `Settings unavailable`; Manager position alone did not grant Admin operation. | Passed |
| Report/export visibility | Tickets, Designers, and separate Visual Work tabs loaded for every valid principal. CSV was absent for Viewer and Designer and present for Designer + Admin, Lead, Lead + Admin, Manager, and Manager + Admin after settled report loading. | Passed |
| Shipped routes and data meaning | Manager + Admin loaded Dashboard, All Tickets, Reports, Team, Settings, and Notifications; the July 28 All Tickets view showed eleven current tickets and Notifications showed its personal empty state. Standalone Visual Work remained a separate report tab, Admin did not change position-owned scope, and planned/due-date language remained distinct from actual work. | Passed |
| Active directory | At the end of the run, Team exposed exactly the eight approved active reserved personas, all conspicuously `[SYNTHETIC]`; the inactive reserved persona remained absent. | Passed |
| Complete staging profile inventory | Admin Settings exposed all nine reserved personas plus two owner-confirmed inactive test profiles. D-105 excludes the two inactive records from the active acceptance-principal set; they remain unused and absent from Team/Dashboard scope. | **Accepted exception — passed for staging/pilot** |
| Narrow Dashboard, Work Items, Team, and Settings | At 390 × 844, Dashboard and Team had no page-level horizontal overflow, All Tickets used structured mobile records with no visible table, Admin Settings used structured member records, non-Admin permission states remained readable, and the skip link moved focus to `main-content`. | Passed |
| Narrow Reports | At 390 px, the responsive media query applied and the page shell/filter container fit the viewport, but report filter fields extended to x=475. Document `clientWidth` was 390 and `scrollWidth` was 475. The same Manager + Admin Reports page had no horizontal overflow at the restored 1728 px desktop width. D-105 accepts this for staging/pilot and requires correction/retest before full-team release. | **Accepted exception — passed for staging/pilot** |
| Monitoring privacy | The staging marker remained visible and the loaded application contained zero Sentry script URLs. Existing workflow security/header/source-map evidence is reused and is not mislabelled as a new Day 1 run. | Passed |
| Product mutations | No ticket, work log, comment, report filter, fixture row, reference value, or notification was mutated. The only writes were the explicitly authorized and audited account credential/lifecycle operations described above. | Passed within authorization |

### Day 1 disposition and continuation gate

The Day 1 attempt is complete and **passed with the two explicit D-105
exceptions**. It contributes one of the two required passing working days. The
two inactive owner test profiles remain outside the acceptance-principal set
and may not be used in Day 2 or the pilot. The 390 px Reports overflow remains
tracked and must be corrected, deployed through the guarded staging workflow,
and retested before full-team release.

The credential, role, Admin-overlay, inactive, password-restricted, desktop,
keyboard, non-Reports narrow, and all other Day 1 evidence passed. Day 2 must
run on a later working day and complete its approved matrix before the staging
time gate closes.
