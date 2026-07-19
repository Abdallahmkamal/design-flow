# Design Flow permission and RLS matrix

**Status:** Approved Phase 0 implementation contract  
**Decision date:** 2026-07-19  
**Applies to:** Browser capabilities, Postgres RLS/RPC authorization, Edge Functions, and permission tests  
**Companion contracts:** `schema-contract.md` and `operation-contracts.md`

Permissions are evaluated from the authenticated profile's current database state. UI checks improve usability only; they never grant authority.

## 1. Principal states

### Valid active principals

| Code used here | Position | Admin | Default people scope |
|---|---|:---:|---|
| V | Viewer | No | All |
| D | Designer | No | Me |
| D+A | Designer | Yes | Me |
| L | Lead | No | Lead group |
| L+A | Lead | Yes | Lead group |
| M | Manager | No | Manager group |
| M+A | Manager | Yes | Manager group |

Viewer + Admin is not an eighth principal. It is an invalid account state rejected by Edge validation, the access-management RPC, a database check, and negative tests.

### Global gates

Before any application policy is evaluated:

1. The request must contain a valid Supabase Auth identity matching `profiles.id`.
2. `profiles.is_active` must be true.
3. `profiles.must_change_password` must be false, except for the narrowly scoped password-change completion flow.
4. Viewer + Admin must be impossible.

An inactive profile receives no normal application rows, RPC access, report/export access, or notification access. A `must_change_password` profile may read only the minimum own-account fields needed to complete the password flow, update its Auth password, call the completion RPC, and sign out.

Reporting groups and people filters never narrow RLS. All valid active principals have the approved whole-team read visibility; position changes defaults and mutation capability, not the readable team partition.

## 2. Capability matrix

Legend: **Own/related** is defined below; **Any** means any Work Item or normal record in the single team; **—** means denied.

### Read and export

| Capability | V | D | D+A | L | L+A | M | M+A |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard, All Tickets, Work Items | Any | Any | Any | Any | Any | Any | Any |
| Current/archived ticket history | Any | Any | Any | Any | Any | Any | Any |
| Visible comments and Figma URLs | Any | Any | Any | Any | Any | Any | Any |
| Valid work history and Reports UI | Any | Any | Any | Any | Any | Any | Any |
| Active Team directory fields | Any | Any | Any | Any | Any | Any | Any |
| Own notification inbox | Own | Own | Own | Own | Own | Own | Own |
| Work Item PDF | — | Any | Any | Any | Any | Any | Any |
| Reports CSV | — | — | Any | Any | Any | Any | Any |
| Work email/Auth support fields | — | — | Any | — | Any | — | Any |
| Administration audit | — | — | Any | — | Any | — | Any |
| Raw withdrawn bodies/revision tables | — | — | — | — | — | — | — |

Raw withdrawn bodies and revision tables are not browser-readable for any principal, including Admin. Approved server-side export/audit functions may read only the fields required by their contract, and normal PDF/CSV output excludes withdrawn bodies.

The general Work email/Auth-support row refers to directory/account views. The Designer summary CSV is a narrower approved exception: its server-side export may include the specified work-email column for Lead, Manager, or Admin because `reports-ui.md` requires it. This does not expose email in Team, Dashboard, ordinary Reports UI, or direct profile reads.

### Work Item operations

| Capability | V | D | D+A | L | L+A | M | M+A |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Create ticket | — | Yes | Yes | Yes | Yes | Yes | Yes |
| Edit core fields | — | Own/related | Any | Any | Any | Any | Any |
| Apply/remove existing labels | — | Own/related | Any | Any | Any | Any | Any |
| Change status | — | Own/related | Any | Any | Any | Any | Any |
| Assign/reassign eligible primary assignee | — | Own/related | Any | Any | Any | Any | Any |
| Add/change/complete/withdraw subtasks | — | Own/related | Any | Any | Any | Any | Any |
| Create/resolve blocker on an accessible ticket | — | Any | Any | Any | Any | Any | Any |
| Archive/restore eligible ticket | — | — | Any | Any | Any | Any | Any |

A Designer's **own/related** Work Item is one they created, currently own, or currently qualify as a contributor to through at least one valid ticket work entry. If correction/withdrawal removes their only contribution, contribution-based edit authority ends immediately. Visibility alone never grants Designer edit authority.

Lead and Manager base positions have whole-team operational authority. Their reporting groups affect only default filters.

### Work logging, comments, and notifications

| Capability | V | D | D+A | L | L+A | M | M+A |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Log own ticket work on visible ticket | — | Yes | Yes | Yes | Yes | Yes | Yes |
| Log own standalone visual work | — | Yes | Yes | Yes | Yes | Yes | Yes |
| Log on behalf of another eligible person | — | — | Yes | Yes | Yes | Yes | Yes |
| Edit/correct batch where actor is `worked_by` | — | Yes | Yes | Yes | Yes | Yes | Yes |
| Correct any work batch | — | — | Yes | Yes | Yes | Yes | Yes |
| Change `worked_by` to another eligible person | — | — | Yes | Yes | Yes | Yes | Yes |
| Withdraw own-attributed batch | — | Yes | Yes | Yes | Yes | Yes | Yes |
| Withdraw any batch | — | — | Yes | Yes | Yes | Yes | Yes |
| Add comment | — | Yes | Yes | Yes | Yes | Yes | Yes |
| Edit own comment body | — | Own | Own | Own | Own | Own | Own |
| Withdraw own comment | — | Own | Own | Own | Own | Own | Own |
| Moderate another person's comment | — | — | Yes | Yes | Yes | Yes | Yes |
| Mark own notification read/all read | Own | Own | Own | Own | Own | Own | Own |

Comment moderation means soft withdrawal. No user may rewrite another author's comment body. Restoring a withdrawn comment is not an MVP operation.

`worked_by` must be an active Designer, Lead, or Manager when a submission or attribution correction is made. Viewer is never a work-attribution subject.

### Settings and account administration

| Capability | V | D | D+A | L | L+A | M | M+A |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Access Settings | — | — | Yes | — | Yes | — | Yes |
| Create eligible account | — | — | Yes | — | Yes | — | Yes |
| Reset temporary password | — | — | Yes | — | Yes | — | Yes |
| Change position/Admin/reporting line | — | — | Yes | — | Yes | — | Yes |
| Deactivate/reactivate account | — | — | Yes | — | Yes | — | Yes |
| Manage Areas/Squads | — | — | Yes | — | Yes | — | Yes |
| Manage labels | — | — | Yes | — | Yes | — | Yes |
| Change team timezone | — | — | Yes | — | Yes | — | Yes |
| Read administration audit | — | — | Yes | — | Yes | — | Yes |

Additional administration constraints:

- Creating or changing an account to Viewer + Admin is denied.
- Changing an Admin-privileged profile to Viewer succeeds only when the same transaction removes Admin.
- Removing Admin or deactivating an Admin is denied if it would leave no active Admin.
- An active Designer requires a current active Lead; an active Lead requires a current active Manager.
- Position and reporting-line changes are one atomic operation.
- No account action may hard-delete the profile or historical attribution.
- Temporary credentials are never accepted by a database RPC, stored, audited, or logged.

## 3. Record-level conditions

### Work Item edit predicate

`can_edit_work_item(actor_id, work_item_id)` is true when the actor passes the global gates and one of these is true:

1. the actor is Admin-privileged;
2. the actor's position is Lead or Manager;
3. the actor is Designer and is the Work Item creator;
4. the actor is Designer and is the current primary assignee; or
5. the actor is Designer and has at least one valid derived contributor entry for the Work Item.

Archive state does not grant extra authority. An archived Work Item rejects new core/status/assignment/blocker/subtask/comment/work submissions until an authorized restore. Existing work logs may still be corrected or withdrawn under the no-time-limit correction rules, and approved exports remain available.

### Work-log predicates

- Any active Designer, Lead, or Manager may create own-attributed work.
- Lead, Manager, or Admin may set `worked_by` to another active Designer/Lead/Manager.
- Designer may correct or withdraw a batch if `worked_by = auth.uid()`.
- Lead, Manager, or Admin may correct or withdraw any batch.
- A correction changing context or Work Item must also satisfy visibility and destination validation.
- Future dates, invalid work types, inactive/Viewer attribution, and more than five active rows are denied independently of role.

### Comment predicates

- Any active Designer, Lead, or Manager may add a comment to a visible Work Item.
- Only the author may edit the current body.
- The author, Lead, Manager, or Admin may withdraw it.
- A withdrawn comment cannot be edited, re-withdrawn, or returned to normal view.

### Notification predicates

- `SELECT` and `UPDATE read_at` require `recipient_id = auth.uid()`.
- Insert is system-only inside a source mutation.
- Delete is denied.
- An inactive recipient receives no normal inbox access.
- A notification does not override current Work Item authorization.

## 4. RLS and SQL exposure plan

RLS is enabled and forced on every application table in the first migration. Table owners used by migrations are not used by the browser. The `anon` role receives no application table privileges.

### Read exposure

| Storage | Browser exposure |
|---|---|
| System reference/policy rows needed by UI | `SELECT` for globally eligible authenticated principals |
| `profiles` | No broad base-table select; own minimal-account view, public Team-directory view, and Admin-only member view |
| `profile_access_periods`, reporting lines | Approved security-invoker reporting/directory views; no email/Auth data |
| `admin_audit_events` | Admin-only security-invoker view |
| Areas/Squads, labels | Current and historical values readable by eligible authenticated principals |
| `work_items` and current relationships | Whole-team select for eligible authenticated principals |
| Status/assignment/event history | Sanitized whole-team timeline/report views |
| Comments | View returns body only when not withdrawn |
| Work logs | Views return valid non-withdrawn rows; timeline exposes withdrawal/correction event metadata without withdrawn bodies |
| Revision tables | No browser table privilege or policy |
| Notifications | Recipient-only base policy |
| `operation_requests`, `bootstrap_state` | No browser table privilege |

PostgreSQL RLS is row-based, so column privacy is enforced with revoked base-table privileges and explicit views/functions. Views use `security_invoker = true` where supported; privileged functions pin `search_path`, schema-qualify every object, and authorize the caller before reading.

### Write exposure

Direct browser table writes are intentionally narrow:

- recipient-only updates of `notifications.read_at`;
- no direct insert/update/delete for Work Items, assignments, histories, labels, subtasks, comments, blockers, work logs, profiles, controlled lists, settings, or audit tables.

All domain mutations use the RPC or Edge contracts in `operation-contracts.md`. This prevents an allowed row update from bypassing required audit, history, notification, and recalculation effects.

### Append-only enforcement

Authenticated roles have no update/delete privilege on:

- profile access periods and reporting-line history;
- administration audit;
- assignment and status history;
- Work Item events;
- removed label relationships;
- revisions;
- resolved blockers;
- notifications except recipient `read_at`; and
- completed operation-request records.

Database triggers also reject update/delete where a privileged function does not explicitly own a permitted close/read-state transition.

## 5. Authorization helper contract

Private database helpers, unavailable for arbitrary client execution, are the single policy source:

- `is_application_user()` — active and not password-restricted;
- `current_position_code()`;
- `current_is_admin()` — includes Viewer + Admin invariant assertion;
- `is_lead_or_manager()`;
- `is_work_attribution_eligible(profile_id)`;
- `can_edit_work_item(work_item_id)`;
- `can_moderate_comments()`;
- `can_manage_settings()`;
- `can_export_reports()`;
- `can_export_work_item()`.

Helpers are `STABLE` only when safe for the duration of one statement. Mutation RPCs still lock and re-read authoritative rows to prevent time-of-check/time-of-use races.

## 6. Edge Function authorization

Except for the one-time first-Admin bootstrap, every Edge Function:

1. validates a Supabase bearer token;
2. loads the caller's current profile from Postgres;
3. rejects inactive/password-restricted callers;
4. independently requires current Admin privilege;
5. validates Viewer + Admin is impossible;
6. uses elevated Auth credentials only for the minimum Auth operation; and
7. delegates database state/history/audit changes to the owning idempotent RPC.

The service-role key is an Edge secret only. It never enters frontend code, a response, a database audit payload, or logs.

## 7. Required allow/deny cases

Every affected operation test runs against each applicable valid principal. The following are minimum cases, not a substitute for operation-specific tests.

### Global/read cases

- Each of V, D, D+A, L, L+A, M, and M+A can read normal whole-team Work Item/report data.
- Position-default people scopes resolve correctly and Admin does not change the default.
- Inactive and password-restricted variants cannot read normal data.
- V cannot read email, last-sign-in support data, administration audit, or raw revisions.
- D/L/M without Admin cannot read Settings data.
- D+A/L+A/M+A can read approved Settings/member/audit views.
- Every principal can read/update only their own notifications.

### Viewer cases

- V cannot create, edit, assign, transition, block, comment, log work, archive/restore, export, or call Settings operations.
- Account creation with Viewer + Admin is rejected.
- Granting Admin to an existing Viewer is rejected.
- Changing an Admin profile to Viewer while retaining Admin is rejected.
- Changing an Admin profile to Viewer and removing Admin atomically is allowed only if another active Admin remains and hierarchy constraints pass.

### Designer cases

- D can create a ticket.
- D can edit a created, currently assigned, or currently contributed ticket and is denied on an unrelated ticket.
- D loses contribution-only edit authority after withdrawal of the sole qualifying contribution.
- D can log own work on any visible ticket and standalone visual work.
- D can create or resolve the one active blocker on any visible ticket.
- D cannot log for another person, change `worked_by`, correct another person's batch, moderate another person's comment, archive/restore, or export Reports CSV.
- D can export a visible Work Item PDF.
- D+A receives the Admin overlay: any-ticket mutation, on-behalf logging, moderation, archive/restore, CSV export, and Settings.

### Lead and Manager cases

- L and M can edit any ticket, log on behalf, correct/withdraw any work batch, moderate comments, archive/restore eligible tickets, and export CSV/PDF.
- L and M without Admin cannot access Settings or account/controlled-list operations.
- L+A and M+A receive Settings/account authority.
- Lead/Manager reporting-group defaults differ as specified, but neither group's membership limits readable or editable rows.

### Invariant and race cases

- No mutation can assign a Viewer or inactive profile as primary assignee or `worked_by`.
- No active status commits without a primary assignee.
- No active blocker is created outside an active status, and no transition to Backlog/Paused/Done commits while one is open.
- No ticket archives outside Backlog/Paused/Done.
- No operation removes/deactivates the final active Admin.
- Concurrent reassignment, status, blocker, work-log correction, and Admin-removal attempts serialize and produce one valid history.
- Reusing an idempotency key with the same request returns the same result; changing its payload is denied.

## 8. Permission completion gate

The permission contract is implemented only when:

- pgTAP proves each allowed and denied database/RPC path;
- Deno tests prove each Edge Function rechecks Admin in Postgres;
- browser tests prove hidden controls are also server-denied when called directly;
- the valid seven principals and negative Viewer + Admin state are covered;
- inactive and password-restricted variants are covered;
- column privacy prevents email/Auth/audit/revision leakage; and
- changing position, Admin, reporting line, archive state, or contribution immediately changes authorization as specified.
