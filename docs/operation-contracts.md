# Design Flow operation contracts

**Status:** Approved Phase 0 implementation contract  
**Decision date:** 2026-07-19  
**Applies to:** Browser writes, Postgres RPCs, Auth-admin Edge Functions, audit/history, notifications, and recalculation  
**Companion contracts:** `schema-contract.md` and `permission-matrix.md`

**Last amended:** 2026-07-20 — D-100 stages mutation implementation by owning feature phase

This document assigns every MVP mutation to one authorization boundary and fixes the atomic effects that boundary must produce. Function names are public contract names; later implementation may use private helpers but must preserve inputs, authorization, effects, and error behavior.

## 1. Boundary rules

| Boundary | Allowed use |
|---|---|
| Browser + Supabase publishable key | Supabase session operations, approved reads, and recipient-only notification read-state updates |
| Postgres RPC | Every database mutation that changes domain state, history, audit, authorization, derived caches, or more than one row |
| Authenticated Edge Function | Any Supabase Auth administration or other operation requiring a server-held secret |
| One-time bootstrap Edge Function | First Admin only, protected by deployment-held bootstrap secrets and a database one-time state |

No browser operation receives a Supabase server key. Hosted Edge Functions use
the injected modern secret-key dictionary; local development may fall back to
the legacy service-role key. No UI capability check substitutes for RLS, RPC
authorization, or Edge authorization.

## 2. Common mutation protocol

Every RPC and Edge mutation receives:

- `operation_id: uuid`, generated once by the initiating client and reused on retry;
- expected subject/version fields where lost-update protection is relevant; and
- only the operation-specific payload.

A client-orchestrated flow assigns a distinct operation ID to every independent mutation. It never reuses one ID across ticket creation, work-log submission, and status transition.

### Idempotency

1. Canonicalize the non-secret request and calculate a SHA-256 hash.
2. Lock or create `operation_requests(operation_id)`.
3. If the same ID/hash is complete, return its stored non-secret result without new effects.
4. If the same ID has another hash or operation code, return `DF_IDEMPOTENCY_MISMATCH`.
5. Database-only RPCs write domain state, history, notifications, recalculations, and the completed result in one transaction.
6. Edge operations may use `pending_external` while Auth work is retried, then finalize through the owning RPC.

Passwords and temporary credentials are excluded from request hashes stored in Postgres, operation results, audit JSON, and logs. The Edge layer hashes a redacted canonical payload containing only non-secret intent.

### Authorization and validation

Each mutation re-reads the actor profile under lock and applies the global gates from `permission-matrix.md`. Security-definer functions:

- set a fixed empty or trusted `search_path`;
- schema-qualify every object;
- are executable only by the intended Supabase role;
- do not accept an actor ID in place of `auth.uid()`; and
- explicitly authorize every affected source and destination record.

Stable application errors:

| Code | Meaning |
|---|---|
| `DF_AUTH_REQUIRED` | No valid authenticated principal |
| `DF_ACCOUNT_INACTIVE` | Profile inactive |
| `DF_PASSWORD_CHANGE_REQUIRED` | Only password-change flow is allowed |
| `DF_FORBIDDEN` | Principal lacks the capability |
| `DF_VALIDATION` | Input violates field or vocabulary rules |
| `DF_INVALID_STATE` | Valid input is not allowed in the current domain state |
| `DF_CONFLICT` | Expected version/state is stale |
| `DF_FINAL_ADMIN` | Operation would leave no active Admin |
| `DF_INVALID_VIEWER_ADMIN` | Operation attempts Viewer + Admin |
| `DF_IDEMPOTENCY_MISMATCH` | Reused key has different intent |

### Lock order

Compound functions lock in this order to avoid deadlocks:

1. `operation_requests`;
2. actor and affected profiles, ordered by UUID;
3. affected Work Items, ordered by UUID;
4. active assignment/status/blocker rows;
5. work-log batches and entries, ordered by UUID; and
6. dependent controlled-list rows.

### Audit and event rules

- A semantic change produces one matching history/audit event, even after retries.
- A no-op caused by an already-current value returns the current result and produces no new history.
- `work_item_events` is the unified timeline and notification source.
- Status and assignment operations also write their dedicated history table.
- Administration operations write one audit event per semantic administration change. A combined position/Admin/reporting-line update may therefore write several events under one `operation_id`.
- Free-text secrets and withdrawn bodies never enter event JSON.

## 3. Operation inventory

### Browser-only writes

| Operation | Boundary |
|---|---|
| Sign in/sign out/session refresh | Supabase Auth browser client |
| Mark one notification read | Direct RLS-protected `notifications.read_at` update |
| Mark all own notifications read | Direct RLS-protected update filtered by `recipient_id = auth.uid()` |

### Edge Functions

| Edge Function | Auth requirement | Database owner |
|---|---|---|
| `bootstrap_first_admin` | One-time deployment secret | `finalize_first_admin_bootstrap` |
| `create_member_account` | Current Admin | `finalize_member_account_creation` |
| `issue_temporary_password_reset` | Current Admin | prepare/finalize reset RPCs |
| `deactivate_member_account` | Current Admin | prepare/finalize deactivation RPCs |
| `reactivate_member_account` | Current Admin | finalize reactivation RPC |
| `change_own_password` | Authenticated password-restricted/current user | `complete_own_password_change` |

### Postgres RPCs

| Domain | Public RPCs |
|---|---|
| Member access | `set_member_access` |
| Areas/Squads | `create_work_area`, `rename_work_area`, `reorder_work_areas`, `archive_work_area`, `reactivate_work_area` |
| Labels | `create_label`, `rename_label`, `reorder_labels`, `archive_label`, `reactivate_label` |
| General | `set_team_timezone` |
| Work Item | `create_work_item`, `update_work_item`, `reassign_work_item`, `transition_work_item_status`, `archive_work_item`, `restore_work_item` |
| Blocker | `create_blocker`, `resolve_blocker` |
| Subtask | `add_subtask`, `rename_subtask`, `reorder_subtasks`, `set_subtask_completion`, `withdraw_subtask` |
| Comment | `add_comment`, `edit_comment`, `withdraw_comment` |
| Work logging | `submit_work_log`, `correct_work_log`, `withdraw_work_log` |

There are no direct browser inserts/updates/deletes for these domains.

### Client-orchestrated Log Work paths

These paths add no public mutation:

| Log Work intent | Existing operation | Boundary consequence |
|---|---|---|
| Create New Ticket | `create_work_item` | Independent authorization, initial Backlog history/event, optional assignment notification, and operation result |
| Submit the unfinished ticket-work draft | `submit_work_log` | Independent work-log validation, audit/event, contribution, and recalculation |
| Apply an optional status change | `transition_work_item_status` | Independent edit authorization, workflow validation, status history/event, notification, and operation result |

No operation accepts another operation's payload. The client may use the Work Item ID returned by `create_work_item` as the selected ticket in its preserved draft, but that return value grants no additional permission and proves no work-log or status operation occurred.

## 4. Auth and account Edge contracts

### `bootstrap_first_admin`

Purpose: create the sole initial account without creating a public registration path.

Preconditions:

- `bootstrap_state.consumed_at` is null;
- no active Admin profile exists;
- request presents the deployment-held one-time bootstrap secret;
- email matches the deployment-configured bootstrap email;
- supplied timezone is an IANA value; and
- the first account position is Manager. This permits a valid active account before any supervisor rows exist.

Procedure:

1. Validate and rate-limit before any Auth write.
2. Generate a cryptographically random temporary password without logging it.
3. Use Supabase Auth Admin to create and confirm the work-email user with that password.
4. Call `finalize_first_admin_bootstrap` with the Auth UUID, display name, email, timezone, and operation ID.
5. In one database transaction:
   - create active Manager + Admin profile with `must_change_password = true`;
   - create its open access period;
   - set `team_settings.timezone` and updater;
   - consume `bootstrap_state`;
   - write `bootstrap_completed` audit without credential content; and
   - complete the idempotency record.
6. Return profile ID, email, and temporary password once over TLS.
7. Remove the bootstrap secret after successful operator verification.

If database finalization fails after Auth creation, the function deletes that newly created, unprovisioned Auth identity as compensation and reports failure. This cleanup is permitted only because no portal profile/history was committed.

A retry after success returns the non-secret account result. If the one-time password response was lost, the deployment operator uses the same protected bootstrap recovery path to rotate it once; the rotation is recorded as part of bootstrap without storing the credential.

### `create_member_account`

Caller: D+A, L+A, or M+A.

Input: display name, work email, position, initial Admin flag, required supervisor where applicable, `operation_id`.

Validation:

- Viewer + Admin is rejected before Auth creation and again by Postgres.
- Active Designer requires an active Lead; active Lead requires an active Manager; Manager/Viewer have no supervisor.
- Email is a valid work email and is not already present in Auth or `profiles`.

Effects:

1. Generate a temporary password and create/confirm the Auth user.
2. `finalize_member_account_creation` atomically creates the active profile with `must_change_password = true`, access period, reporting line/current cache where required, `account_created` and reporting-line audit, and operation result.
3. Return the temporary password once. A completed retry returns only the account result; the Admin uses the reset operation if delivery was lost.

If database finalization fails, delete only the new unprovisioned Auth identity. No shared or historically attributed account is ever deleted.

### `issue_temporary_password_reset`

Caller: D+A, L+A, or M+A. Target may be any existing profile.

Procedure:

1. `prepare_temporary_password_reset` locks target, sets `must_change_password = true`, and leaves the operation `pending_external`.
2. Edge generates a temporary password and updates the target Auth user.
3. `finalize_temporary_password_reset` writes `password_reset_issued` audit without password content and completes the operation.
4. Return the temporary password once.

If Auth update fails, the application profile remains password-restricted, which is fail-closed. Retry with the same operation completes the Auth update. No reset operation changes position, Admin, reporting line, or active state.

### `deactivate_member_account`

Caller: D+A, L+A, or M+A.

Validation:

- target exists and is active;
- removing the target from active Admins does not leave zero;
- dependent active reporting lines are supplied valid replacements/closures in the same request; and
- every current unarchived active-bucket ticket owned by the target has an eligible replacement assignee in the request; non-active current assignments are explicitly replaced or closed; and
- no history is deleted.

Procedure:

1. `prepare_member_deactivation` atomically reassigns/closes affected Work Item assignments with normal assignment history/events/notifications, closes access/reporting periods, sets profile inactive and current supervisor null, writes access/reporting audit, and leaves the operation `pending_external`.
2. Edge disables/bans the corresponding Auth account.
3. `finalize_member_deactivation` marks the operation complete.

Database deactivation happens first so an Auth failure remains fail-closed under RLS. Retry finishes Auth disable. Existing domain attribution and notifications remain stored but are not normally accessible to the inactive user.

### `reactivate_member_account`

Caller: D+A, L+A, or M+A.

Validation: target inactive; proposed position/Admin state is valid; Viewer + Admin prohibited; required active supervisor supplied.

Procedure:

1. Edge re-enables the Auth account.
2. `finalize_member_reactivation` atomically opens access/reporting periods, sets active state and `must_change_password` as specified by the reset policy, writes audit, and completes the operation.

If database finalization fails, the Auth account may be enabled but RLS still sees an inactive profile, so application access remains denied until a safe retry.

### `change_own_password`

Caller: the authenticated user, including one restricted by `must_change_password`.

Input: new password and operation ID. Password is never logged or sent to Postgres.

Procedure:

1. Edge authenticates the bearer token and requires caller UUID = target UUID.
2. Update the caller's Supabase Auth password.
3. Call `complete_own_password_change`, which clears `must_change_password`, updates the current access snapshot, and completes the operation.

If database completion fails, the new Auth password remains valid but normal RLS stays restricted; retry completes the profile state. The operation writes no password audit content.

## 5. Member, hierarchy, and Settings RPCs

### `set_member_access`

Caller: D+A, L+A, or M+A.

Input: target profile, complete desired position/Admin/reporting-supervisor state, expected profile `updated_at`, any required Work Item reassignment map, operation ID. The RPC captures the current team-local effective date; the MVP UI does not backdate or schedule hierarchy changes. Active/deactivation changes requiring Auth are not accepted here; use their Edge contracts.

Rules:

- Viewer + Admin rejected.
- A change to Viewer with current Admin succeeds only when desired Admin is false in this same request.
- Removing Admin from the final active Admin is rejected.
- Designer → active Lead, Lead → active Manager, Manager/Viewer → no supervisor.
- Self-reporting, cycles, invalid pairings, overlapping effective periods, and stale expected versions are rejected.
- A change from a work-attribution-eligible position to Viewer supplies an eligible replacement for every current unarchived active-bucket ticket; other current assignments are explicitly replaced or closed.

Atomic effects:

- close/open profile access period when position/Admin changes;
- close/open reporting-line periods and update `current_reports_to_id`;
- reassign/close affected current Work Item assignments with their ordinary history, events, and notifications when eligibility is removed;
- update `profiles`;
- write separate position, Admin grant/removal, and reporting-line audit events as applicable; and
- complete idempotency result.

### Controlled-list RPCs

All require Admin.

`create_work_area` / `create_label`:

- require nonblank case-insensitively unique active name;
- assign explicit stable UUID and requested/default trailing sort order;
- write create audit.

`rename_work_area` / `rename_label`:

- lock row, require new active-name uniqueness;
- preserve UUID and historical references;
- write old/new names in audit.

`reorder_work_areas` / `reorder_labels`:

- input is the complete ordered active-ID list;
- reject missing/duplicate/archived IDs;
- assign contiguous zero-based sort values atomically;
- write one reorder audit with ordered IDs, not one event per row.

`archive_work_area` / `archive_label`:

- return current and historical usage counts for confirmation;
- accept an explicit `confirmed_usage_count`/expected version to detect stale confirmation;
- set archive metadata and write audit;
- preserve all joins;
- prevent new selection afterward.

`reactivate_work_area` / `reactivate_label`:

- require active-name uniqueness at reactivation time;
- clear archive metadata, place at requested/default sort position, and write audit.

An archived Area/Squad already on a ticket remains readable. Changing a ticket to a different Area requires an active destination. Archived labels may be removed but not newly applied.

### `set_team_timezone`

Caller: Admin.

Input: IANA timezone, expected `updated_at`, operation ID.

Effects: validate through `pg_timezone_names`, update singleton, and write `team_timezone_changed` audit. UTC timestamps, explicit work dates, captured assignment effective dates, and historical reporting lines are not rewritten.

## 6. Work Item RPCs

### `create_work_item`

Caller: D, D+A, L, L+A, M, or M+A.

Input: title, optional description, required active Area/Squad, optional eligible primary assignee, optional planned/due dates, optional Figma URL, active label IDs, operation ID.

Rules:

- status is always initial `backlog`;
- no project, priority, attachment, generic link, or second assignee is accepted;
- labels must be active and unique;
- optional assignee must be active Designer/Lead/Manager.

Atomic effects:

- insert `work_items`;
- if assigned, open assignment history with captured team-local `started_on`;
- insert creation status history (`null -> backlog`) with captured team-local `changed_on`;
- insert active label relationships;
- add `created` event and, where applicable, assignment/label details in that event set;
- set `last_activity_at = created_at`; and
- notify a different initial assignee once with `assigned_to_you`.

Result: Work Item UUID and display ID.

### `update_work_item`

Caller: actor satisfying `can_edit_work_item`.

Input: Work Item ID, patch limited to title/description/Area/planned start/due/Figma URL plus complete desired label ID set, expected `updated_at`, operation ID.

Rules:

- status, assignee, archive, blocker, and subtask fields are not accepted here;
- changed Area and newly added labels must be active;
- existing archived values may remain; archived labels may be removed;
- Figma URL passes the database URL contract.

Atomic effects:

- update changed current fields and `updated_at`;
- close removed label relationships and add new ones;
- write `core_fields_changed` and/or `labels_changed` events with field IDs/codes and safe values;
- update `last_activity_at`; and
- return the new expected version.

No field-update notification is created.

### `reassign_work_item`

Caller: actor satisfying `can_edit_work_item`.

Input: Work Item, new eligible assignee or null, expected current assignee and `updated_at`, operation ID.

Rules:

- active-bucket statuses cannot end unassigned;
- a non-null target is active Designer/Lead/Manager;
- same assignee is a no-op;
- archived Work Items must first be restored.

Atomic effects:

- close the old assignment timestamp and captured `ended_on`;
- open the new interval with current timestamp and captured `started_on`;
- update `work_items.primary_assignee_id`, `updated_at`, and `last_activity_at`;
- write one assignment-history change through closed/open rows and one `assignment_changed` event;
- create `reassigned_away_from_you` for the old assignee and `assigned_to_you` for the new assignee when each recipient differs from actor; and
- recalculate relationship views, not historical work records.

The captured effective dates make the final assignment on a team-local date the primary assignee for that date.

### `transition_work_item_status`

Caller: actor satisfying `can_edit_work_item`.

Input: Work Item, target status, expected current status/`updated_at`, `acknowledge_incomplete_subtasks` boolean, operation ID.

Rules:

- source/target pair must be allowed and distinct;
- target active-bucket status requires an assignee;
- transition to Backlog, Paused, or Done is denied while a blocker is active;
- transition to Done with incomplete current subtasks requires explicit acknowledgment but remains allowed;
- archived Work Items must first be restored.

Atomic effects:

- update status, `updated_at`, and `last_activity_at`;
- set `completed_at` to current timestamp when entering Done;
- retain `completed_at` when leaving Done so it remains the most recent Done timestamp until the next completion replaces it;
- append status history with the current captured team-local `changed_on`;
- append `status_changed`, plus `reopened` when leaving Done;
- notify the current primary assignee once when actor differs; and
- preserve every prior completion/reopen event.

### `archive_work_item`

Caller: L, M, or Admin.

Rules: current status archive-eligible; not already archived; expected version matches. An active blocker cannot coexist with an archive-eligible status by other invariants.

Effects: set archive actor/time, update core/activity timestamps, write `archived` event. Status and all history remain unchanged.

### `restore_work_item`

Caller: L, M, or Admin.

Rules: currently archived; expected version matches; stored status remains valid.

Effects: clear archive metadata, update core/activity timestamps, write `restored` event. Restore does not activate an assignee or change status.

## 7. Blocker contracts

### `create_blocker`

Caller: any active Designer, Lead, Manager, or Admin on a visible Work Item.

Input: Work Item, required reason, optional expected-resolution date, expected status/no-active-blocker state, operation ID.

Rules: Work Item unarchived and status `todo`, `in_progress`, or `in_review`; no unresolved blocker.

Effects:

- insert blocker;
- write `blocker_created` event without copying reason into notification data;
- update `last_activity_at`;
- notify current primary assignee when different from actor.

### `resolve_blocker`

Caller: any active Designer, Lead, Manager, or Admin on a visible Work Item.

Input: blocker, optional resolution note, expected unresolved state, operation ID.

Effects:

- set resolver/time/note on the one active record;
- write `blocker_resolved` event;
- update Work Item `last_activity_at`;
- notify current primary assignee when different from actor.

Resolved blockers cannot be reopened or deleted. A new later blocker is a new row.

## 8. Subtask contracts

All subtask mutations require `can_edit_work_item` and an unarchived Work Item.

### `add_subtask`

Input: title, optional insertion position, expected Work Item version/event cursor, operation ID.

Effects: shift active positions atomically, insert current subtask with creator/time, write `subtask_added`, update `last_activity_at`.

### `rename_subtask`

Input: subtask, nonblank title, expected `updated_at`, operation ID.

Effects: update title, write `subtask_renamed` with safe old/new title, update activity.

### `reorder_subtasks`

Input: complete ordered list of current non-withdrawn subtask IDs, operation ID.

Effects: validate exact membership, assign contiguous one-based positions atomically, write one `subtask_reordered` event, update activity.

### `set_subtask_completion`

Input: subtask, desired completed boolean, expected state, operation ID.

Effects:

- completing sets actor/time and writes `subtask_completed`;
- reopening clears completer/time and writes `subtask_reopened`;
- update activity.

Completing all subtasks never changes parent status.

### `withdraw_subtask`

Input: subtask, expected current state, operation ID.

Effects: set withdrawal actor/time, compact remaining active positions, write `subtask_withdrawn`, update activity. No hard delete or restore operation exists.

## 9. Comment contracts

### `add_comment`

Caller: D, D+A, L, L+A, M, or M+A.

Input: Work Item, nonblank plain-text body, operation ID.

Rule: Work Item must be unarchived.

Effects:

- insert comment;
- write `comment_added` event containing comment ID/author but not body;
- update `last_activity_at`;
- notify current primary assignee when different from actor, without copying body.

### `edit_comment`

Caller: comment author only.

Input: comment, new nonblank plain-text body, expected `edited_at`/body version, operation ID.

Rules: comment not withdrawn.

Effects: append revision, update body/`edited_at`, write `comment_edited` without body in event JSON, update Work Item activity. No notification.

### `withdraw_comment`

Caller: author, Lead, Manager, or Admin.

Input: comment, expected active state, operation ID.

Effects: append restricted withdrawal revision, set withdrawal metadata, write `comment_withdrawn` without former body, update activity. Normal reads and exports no longer expose the body. No restore or notification.

## 10. Work-log contracts

### Ticket-mode orchestration

The unfinished Log Work form is client state, not a database record.

1. Create New Ticket is shown only in ticket mode and only when the caller can create a Work Item.
2. Before launching normal ticket creation, the client retains all current Log Work draft values. A successful `create_work_item` result resumes the same draft with the returned Work Item ID selected. Creation does not call `submit_work_log` or `transition_work_item_status`.
3. An optional target status is shown only when the caller independently satisfies `can_edit_work_item` for the selected ticket before submission. The client does not treat permission to log or a prospective contributor relationship as transition authority.
4. Final submission calls `submit_work_log` first with its own operation ID. A target status is not part of that RPC payload.
5. After work submission succeeds, the client refreshes authoritative Work Item state and, when the requested target is still different, calls `transition_work_item_status` with a separate operation ID and current expected status/version.
6. A failed work submission leaves the draft available and prevents the status call. A successful work submission is never rolled back because the later status operation is denied, invalid, stale, or unavailable. The interface reports the two outcomes separately and retries only the failed operation according to its own idempotency rules.

The existing optional blocker action remains an atomic part of `submit_work_log`; it does not make status transition or ticket creation part of that transaction. Standalone visual work exposes neither integrated ticket action.

### Shared validation

- `worked_by` is an active Designer, Lead, or Manager.
- `logged_by` is captured from the authenticated actor by `submit_work_log`; it is not accepted from client input and never determines work credit.
- D may submit/correct only self-attributed work; L, M, and Admin may act on behalf.
- One to five active entry rows.
- Every date is no later than team-local today. Friday/Saturday remain valid.
- Each work type is selectable and matches context.
- Descriptions are optional, including Other.
- Ticket context requires a visible, unarchived Work Item and null related Area for a new submission.
- Visual context requires null Work Item and optional active related Area.

### `submit_work_log`

Caller: D, D+A, L, L+A, M, or M+A.

Input:

- context and Work Item/related Area;
- `worked_by` (defaults to actor);
- ordered one-to-five `{work_date, work_type_code, description}` rows;
- optional ticket blocker action `{reason, expected_resolution_date}` applied once; and
- operation ID.

`submit_work_log` rejects a ticket-creation payload or target-status field. Those intents belong only to `create_work_item` and `transition_work_item_status`.

Authorization:

- any eligible actor may log their own work on any visible ticket;
- L, M, or Admin may choose another eligible `worked_by`;
- optional blocker uses the same rules as `create_blocker`.

Atomic effects:

- create the batch with `logged_by = auth.uid()` and the selected/defaulted `worked_by`, then create its entries;
- for ticket work, write one `work_log_submitted` event that can join to every actual date/type;
- optionally create one blocker/event/notification, never one per date;
- recalculate affected ticket `last_worked_on`;
- set ticket `last_activity_at` to submission time;
- expose contributor relationships from the valid entry set; and
- complete all or nothing.

Standalone visual work creates no ticket lifecycle record or contributor/ownership metric.

### `correct_work_log`

Caller:

- D when current `worked_by = auth.uid()`; or
- L, M, or Admin for any batch.

Input:

- batch ID and expected `edited_at`/created version;
- complete desired context, Work Item/related Area, and `worked_by`;
- complete desired one-to-five active entries, referencing existing IDs where retained;
- operation ID.

Rules:

- a withdrawn batch cannot be corrected;
- `logged_by` is immutable; the correction actor is preserved separately as revision `changed_by`;
- D cannot change `worked_by` away from self;
- only L, M, or Admin can change attribution to another person;
- source and destination context validation both apply;
- an archived source ticket does not block correction/withdrawal, but an archived destination ticket cannot receive newly moved work; and
- omitted existing entries are soft-withdrawn; new entries are inserted; retained entries are revised in place.

Atomic effects:

- write batch and entry revisions before current-row changes;
- apply context/attribution and entry changes;
- write `work_log_corrected` on the old and/or new Work Item as applicable, without duplicating when unchanged;
- recalculate `last_worked_on` and dependent contributor state for every old/new affected ticket;
- update affected ticket activity timestamps to correction time; and
- leave historical actual dates available only through restricted revisions/timeline metadata when withdrawn.

Reports immediately use the corrected context/date/type/attribution.

### `withdraw_work_log`

Caller:

- D when batch `worked_by = auth.uid()`; or
- L, M, or Admin for any batch.

Input: batch ID, expected active/version state, operation ID.

Atomic effects:

- append withdrawal revisions;
- set batch withdrawal actor/time;
- write `work_log_withdrawn` on its ticket context;
- recalculate ticket `last_worked_on`, contributor state, and dependent sources;
- update ticket `last_activity_at`;
- exclude the batch from all normal activity, reports, and exports.

The batch and its entries remain stored. There is no restore operation; a mistaken withdrawal is corrected by a new submission with an explicit audit trail.

## 11. Notification read-state writes

### Mark one read

The browser updates `read_at = coalesce(read_at, statement_timestamp())` for one row where `recipient_id = auth.uid()`. RLS denies all other rows/columns.

### Mark all read

The browser updates unread rows where `recipient_id = auth.uid()`. It cannot affect another recipient, alter notification content, or delete rows. Repeating either operation is a no-op.

Opening a Work Item through a notification applies current Work Item permissions; the notification grants nothing.

## 12. Notification production matrix

Notifications are inserted inside the source database transaction and reference its `work_item_events.id`.

| Source operation | Recipient | Type | Exclusion |
|---|---|---|---|
| Create with initial assignee | New assignee | `assigned_to_you` | Actor is recipient |
| Reassign | New assignee | `assigned_to_you` | Actor is recipient |
| Reassign away | Old assignee | `reassigned_away_from_you` | Actor is recipient |
| Status transition | Current assignee | `status_changed` | Actor is recipient |
| Blocker create | Current assignee | `blocker_created` | Actor is recipient |
| Blocker resolve | Current assignee | `blocker_resolved` | Actor is recipient |
| Comment add | Current assignee | `comment_added` | Actor is recipient |

No comment edit/withdrawal, subtask, label/date/Figma edit, work log, due/stale condition, group event, or self-action creates a notification. The unique source constraint makes retries harmless.

## 13. Recalculation contract

Private `recalculate_work_items(work_item_ids uuid[])` runs inside work-log submit/correct/withdraw transactions:

1. lock affected Work Items in UUID order;
2. calculate `last_worked_on` from valid ticket entries;
3. validate that contributor views resolve from assignment effective dates;
4. update only changed caches; and
5. leave report aggregates query-derived.

`last_activity_at` is set from the current source operation and can be rebuilt as the maximum event occurrence time. `completed_at` is maintained only by status transition and can be rebuilt from Done history.

No mutation stores:

- a manual contributor;
- Active work days;
- ticket-days;
- planned-until;
- overdue/due-soon/stale flags;
- no-recent-work flags; or
- designer/report summary totals.

Report and Dashboard queries use the formulas in `schema-contract.md`. Historical snapshots resolve status, assignment, archive, hierarchy, and source events as of the requested instant.

## 14. Concurrency and rollback cases

- Work Item mutations use expected `updated_at` plus row locks. A stale edit returns `DF_CONFLICT`; it does not overwrite.
- Status, assignment, and blocker operations lock the Work Item and current open rows before validation.
- `set_member_access`, deactivation, and reactivation lock every affected profile/reporting row and the active-Admin set before final-Admin validation.
- Controlled-list reorder locks the full active list.
- Work-log correction locks the batch, entries, and old/new Work Items before revisions/recalculation.
- Any database exception rolls back current state, history, notifications, and idempotency completion together.
- Edge cross-system failures follow the fail-closed order described above and remain safely retryable.

## 15. Operation test gate

D-100 keeps these operation contracts fixed while staging their implementation.
Phase 1 creates `operation_requests` and every physical dependency, denies
premature browser mutation access, and tests the shared structural and read
security foundation. Each public mutation and its tests ship in the Phase 2–4
vertical slice that owns the feature.

Before an owning feature phase is complete, its implementation tests must
prove the applicable cases below; by the end of Phase 4 the combined suite must
prove all of them:

- each public mutation is available only at its assigned boundary;
- all seven valid principals receive every specified allow/deny outcome;
- Viewer + Admin, inactive, and password-restricted states are rejected correctly;
- every compound operation is atomic under forced mid-operation failures;
- repeated operation IDs produce no duplicate history, notifications, work entries, accounts, or audit;
- ticket creation, work-log submission, and status transition require distinct operation IDs and cannot accept one another's fields;
- Create New Ticket resumes the client draft with the returned Work Item selected without creating work-log or status effects;
- a failed work-log submission prevents the optional status call, while a failed status call after successful logging preserves the committed log and reports partial success without compensation;
- concurrent status, assignment, blocker, work-log, and final-Admin changes serialize correctly;
- temporary credentials never appear in database/log fixtures;
- old/new ticket recalculation after work correction/withdrawal is complete;
- same-day reassignment produces the final-assignment work-date attribution;
- exports and normal views exclude withdrawn bodies/rows; and
- no application mutation hard-deletes historical records.
