# Design Flow physical schema contract

**Status:** Approved Phase 0 implementation contract  
**Decision date:** 2026-07-19  
**Applies to:** First Supabase/Postgres migration and all later migrations  
**Sources:** `product-spec.md`, `technical-plan.md`, `build-plan.md`, module specifications, `data-model.md`, and `decisions.md`

**Last amended:** 2026-07-20 — D-100 resolves the Phase 1 database boundary

This document fixes the physical Postgres contract for the MVP before application scaffolding. It refines the conceptual model without adding application scope. Migrations, generated database types, RLS policies, RPCs, fixtures, reports, and exports must agree with it.

## 1. Resolved contract points

- The valid position/privilege combinations are Viewer, Designer, Designer + Admin, Lead, Lead + Admin, Manager, and Manager + Admin. Viewer + Admin is invalid.
- Admin remains an independent privilege for Designer, Lead, and Manager. It does not change position, reporting line, work credit, or default people scope.
- Work entries contain a team-local `work_date`, not a work time. Assignment rows capture immutable team-local `started_on`/`ended_on` dates when an assignment changes. When history changes during a date, primary/contributor attribution uses the final assignment effective on that date. A later timezone change cannot reinterpret it.
- Reporting-line periods use inclusive `started_on` and exclusive `ended_on` dates. A line effective on a work/event date is therefore unambiguous.
- The product does not define a restricted status-transition graph beyond its invariants. The initial system transition table permits every change between two different MVP statuses. Active-assignee, blocker, archive, and authorization rules still apply.
- A work-log correction may replace the active one-to-five entry set in a batch. Removed entries are soft-withdrawn, not deleted. Withdrawing a submission withdraws the batch as a whole.
- Current contributors and report aggregates are derived from valid source rows. Only `work_items.last_worked_on`, `last_activity_at`, and `completed_at` are maintained snapshot caches; all are recalculable.
- The Log Work Create New Ticket path, work-log submission, and optional status transition are independent operations. They use existing records and separate `operation_requests`; no combined flow, draft, requested-status, or compensation row is persisted.

## 2. Database-wide conventions

### Names, keys, and time

- Application tables live in `public`; Supabase-owned identity remains in `auth.users`.
- SQL names use `snake_case`. Primary keys use `uuid` with `gen_random_uuid()` unless a singleton or stable code is more appropriate.
- System timestamps use `timestamptz`, are written in UTC, and default to `statement_timestamp()` for ordinary inserts.
- Product work dates and effective reporting dates use `date`.
- Timestamp intervals are half-open: `[started_at, ended_at)`. Date intervals are `[started_on, ended_on)`.
- Foreign keys use `ON DELETE RESTRICT` or the default `NO ACTION`. Normal product behavior never cascades or hard-deletes history.
- Actor columns reference `profiles(id)`. Bootstrap-only actor columns may be null only where explicitly stated.
- `created_at` is immutable. Append-only rows have no application update/delete policy.

### Extensions

The first migration enables:

- `pgcrypto` for UUID generation;
- `citext` for case-insensitive email and controlled-list name uniqueness; and
- `btree_gist` for non-overlapping UUID-keyed effective periods; and
- `pg_trgm` for case-insensitive partial Work Item search.

### Controlled values

Persisted controlled values use stable lowercase `snake_case` codes and separate display labels. A code is never renamed or reused. System-managed values may be made unavailable for new selection by setting `is_selectable = false`; referenced history remains valid.

Postgres enums are not used for positions, workflow statuses, or work types. Reference tables and foreign keys permit forward, compatibility-tested migrations.

### Text and JSON

- Required human text is trimmed and must contain at least one non-whitespace character.
- Empty optional strings are normalized to null by the owning RPC.
- Audit JSON columns contain JSON objects with stable field names, IDs/codes, and approved display values. They never contain passwords, temporary credentials, tokens, complete withdrawn comment bodies, or other secrets.
- The database accepts only HTTPS Figma URLs whose hostname is `figma.com` or ends in `.figma.com`; credentials in a URL are rejected. The system stores the URL only and never fetches it.

## 3. System-managed reference and policy tables

### `position_definitions`

| Column | Type | Rules |
|---|---|---|
| `code` | `text` | Primary key |
| `display_label` | `text` | Required |
| `sort_order` | `smallint` | Unique, positive |
| `admin_eligible` | `boolean` | Required |
| `work_attribution_eligible` | `boolean` | Required |
| `primary_assignment_eligible` | `boolean` | Required |
| `is_selectable` | `boolean` | Required, default true |

Initial rows:

| Code | Label | Admin eligible | Work/assignment eligible |
|---|---|:---:|:---:|
| `viewer` | Viewer | No | No |
| `designer` | Designer | Yes | Yes |
| `lead` | Lead | Yes | Yes |
| `manager` | Manager | Yes | Yes |

### `work_item_statuses`

| Column | Type | Rules |
|---|---|---|
| `code` | `text` | Primary key |
| `display_label` | `text` | Required |
| `sort_order` | `smallint` | Unique, positive |
| `reporting_bucket` | `text` | `backlog`, `active`, `completed`, or `paused` |
| `requires_primary_assignee` | `boolean` | Required |
| `archive_eligible` | `boolean` | Required |
| `is_selectable` | `boolean` | Required, default true |

Initial rows:

| Code | Label | Bucket | Requires assignee | Archive eligible |
|---|---|---|:---:|:---:|
| `backlog` | Backlog | `backlog` | No | Yes |
| `todo` | To do | `active` | Yes | No |
| `in_progress` | In Progress | `active` | Yes | No |
| `in_review` | In Review | `active` | Yes | No |
| `done` | Done | `completed` | No | Yes |
| `paused` | Paused | `paused` | No | Yes |

### `work_item_status_transitions`

| Column | Type | Rules |
|---|---|---|
| `from_status_code` | `text` | FK to `work_item_statuses` |
| `to_status_code` | `text` | FK to `work_item_statuses`; differs from `from_status_code` |
| `is_allowed` | `boolean` | Required |
| `introduced_in_policy_version` | `integer` | Required |

Primary key: `(from_status_code, to_status_code)`. The initial seed contains all 30 distinct pairs with `is_allowed = true`. A later workflow restriction changes this table through a versioned migration and compatibility tests.

### `work_type_definitions`

| Column | Type | Rules |
|---|---|---|
| `code` | `text` | Primary key |
| `context_code` | `text` | `ticket` or `standalone_visual` |
| `display_label` | `text` | Required |
| `sort_order` | `smallint` | Positive |
| `is_selectable` | `boolean` | Required, default true |

Unique: `(context_code, sort_order)`.

Ticket seeds, in order:

1. `planning_alignment` — Planning & alignment
2. `discovery_research` — Discovery & research
3. `mapping_information_architecture` — Mapping & information architecture
4. `ideation_wireframing` — Ideation & wireframing
5. `ui_visual_design` — UI & visual design
6. `prototyping_interaction` — Prototyping & interaction
7. `design_system` — Design system
8. `testing_validation` — Testing & validation
9. `review_iteration` — Review & iteration
10. `documentation_handoff` — Documentation & handoff
11. `design_qa_implementation_support` — Design QA & implementation support
12. `team_support_collaboration` — Team support & collaboration
13. `other` — Other

Standalone visual seeds, in order:

1. `new_visual_asset` — New visual asset
2. `resizing_adaptation` — Resizing & adaptation
3. `presentation_support` — Presentation support
4. `image_editing` — Image editing
5. `illustration_iconography` — Illustration & iconography
6. `other_visual_work` — Other visual work

### `product_policy_versions`

This append-only, system-managed table is the single database source for calendar and threshold rules.

| Column | Type | Rules |
|---|---|---|
| `version` | `integer` | Primary key, positive |
| `effective_from` | `timestamptz` | Required |
| `effective_to` | `timestamptz` | Nullable, exclusive |
| `week_starts_on` | `smallint` | `0..6`; Sunday is 0 |
| `working_days` | `smallint[]` | Unique values in `0..6` |
| `stale_after_working_days` | `smallint` | Positive |
| `due_soon_working_days` | `smallint` | Positive |
| `max_work_log_entries` | `smallint` | `1..5` |
| `created_at` | `timestamptz` | Required |

Periods must not overlap and exactly one row is current. Version 1 seeds Sunday start, working days `{0,1,2,3,4}`, stale threshold 5, due-soon window 5, and maximum batch entries 5. Product migrations, not Settings, change this table.

### Event-type references

`admin_audit_event_types(code text primary key)`, `work_item_event_types(code text primary key)`, and `notification_type_definitions(code text primary key)` hold stable event codes.

Initial administration codes:

`bootstrap_completed`, `account_created`, `position_changed`, `admin_privilege_granted`, `admin_privilege_removed`, `reporting_line_changed`, `account_deactivated`, `account_reactivated`, `password_reset_issued`, `work_area_created`, `work_area_renamed`, `work_area_reordered`, `work_area_archived`, `work_area_reactivated`, `label_created`, `label_renamed`, `label_reordered`, `label_archived`, `label_reactivated`, and `team_timezone_changed`.

Initial Work Item codes:

`created`, `core_fields_changed`, `labels_changed`, `assignment_changed`, `status_changed`, `reopened`, `blocker_created`, `blocker_resolved`, `subtask_added`, `subtask_renamed`, `subtask_reordered`, `subtask_completed`, `subtask_reopened`, `subtask_withdrawn`, `comment_added`, `comment_edited`, `comment_withdrawn`, `work_log_submitted`, `work_log_corrected`, `work_log_withdrawn`, `archived`, and `restored`.

Initial notification codes:

`assigned_to_you`, `reassigned_away_from_you`, `status_changed`, `blocker_created`, `blocker_resolved`, and `comment_added`.

## 4. Identity, access, hierarchy, and Settings

### `profiles`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK and FK to `auth.users(id)` |
| `email` | `citext` | Required, unique; Admin-only field |
| `display_name` | `text` | Required, nonblank |
| `position_code` | `text` | FK to `position_definitions` |
| `is_admin` | `boolean` | Required, default false |
| `is_active` | `boolean` | Required, default true |
| `must_change_password` | `boolean` | Required, default true |
| `current_reports_to_id` | `uuid` | Nullable FK to `profiles`; cannot equal `id` |
| `created_by` | `uuid` | Nullable only for first bootstrap |
| `created_at` | `timestamptz` | Required |
| `updated_at` | `timestamptz` | Required |

Database invariant: `is_admin = false OR position_code <> 'viewer'`. A deferred authorization trigger also verifies `admin_eligible` from the position reference. An active Designer must have an active Lead supervisor; an active Lead must have an active Manager supervisor; Viewer and Manager have no supervisor. Those cross-row rules are enforced by the access-management RPC plus deferred constraint triggers.

Indexes: `(is_active, position_code)`, `current_reports_to_id`, and partial `(id) WHERE is_admin AND is_active`.

### `profile_access_periods`

System of record for position, Admin, and active-state history.

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `profile_id` | `uuid` | FK to `profiles` |
| `position_code` | `text` | FK to `position_definitions` |
| `is_admin` | `boolean` | Viewer + Admin prohibited |
| `is_active` | `boolean` | Required |
| `started_at` | `timestamptz` | Required |
| `ended_at` | `timestamptz` | Nullable, exclusive |
| `changed_by` | `uuid` | Nullable only for bootstrap |
| `start_operation_id` | `uuid` | Required FK to `operation_requests` |
| `end_operation_id` | `uuid` | Nullable FK to `operation_requests`; required when closed |

Periods for one profile may not overlap; exactly one open period matches the current `profiles` snapshot. Indexes: `(profile_id, started_at DESC)` and a unique partial index on `profile_id WHERE ended_at IS NULL`.

### `reporting_line_assignments`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `person_id` | `uuid` | FK to `profiles` |
| `supervisor_id` | `uuid` | FK to `profiles`; differs from person |
| `started_on` | `date` | Inclusive |
| `ended_on` | `date` | Nullable, exclusive; greater than or equal to `started_on` |
| `assigned_by` | `uuid` | FK to `profiles` |
| `start_operation_id` | `uuid` | FK to `operation_requests` |
| `end_operation_id` | `uuid` | Nullable FK to `operation_requests`; required when closed |
| `created_at` | `timestamptz` | Required |

Per-person date ranges may not overlap. A relationship replaced on its start date may close with `ended_on = started_on`, preserving the event but receiving no daily attribution; the final relationship of the team-local date owns that date. Pairing is Designer → Lead or Lead → Manager as determined by the access periods effective on `started_on`. Cycles are rejected. The open row must agree with `profiles.current_reports_to_id`.

Indexes: `(person_id, started_on DESC)`, `(supervisor_id, started_on, ended_on)`, and unique partial `person_id WHERE ended_on IS NULL`.

### `team_settings`

| Column | Type | Rules |
|---|---|---|
| `singleton_key` | `boolean` | PK, always true |
| `timezone` | `text` | IANA name present in `pg_timezone_names`; null only before first-Admin bootstrap |
| `updated_by` | `uuid` | Nullable FK to `profiles`; null only before first-Admin bootstrap |
| `updated_at` | `timestamptz` | Required |

One row is seeded with null bootstrap values. Bootstrap supplies the production team timezone and fills `updated_by`; a deferred constraint rejects either value being null afterward. Local synthetic fixtures use `Africa/Cairo`. Only the owning RPC may update it.

### `bootstrap_state`

| Column | Type | Rules |
|---|---|---|
| `singleton_key` | `boolean` | PK, always true |
| `consumed_at` | `timestamptz` | Nullable |
| `first_admin_profile_id` | `uuid` | Nullable FK to `profiles` |
| `operation_id` | `uuid` | Nullable FK to `operation_requests` |

The row is seeded unconsumed. The bootstrap transaction may set it once and never clear it.

### `admin_audit_events`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `event_type_code` | `text` | FK to `admin_audit_event_types` |
| `actor_id` | `uuid` | Nullable only for bootstrap |
| `subject_type` | `text` | Stable non-secret subject category |
| `subject_id` | `uuid` | Nullable only for singleton settings |
| `previous_values` | `jsonb` | Nullable JSON object |
| `new_values` | `jsonb` | Nullable JSON object |
| `operation_id` | `uuid` | FK to `operation_requests` |
| `occurred_at` | `timestamptz` | Required |

Append-only. Indexes: `(occurred_at DESC)`, `(subject_type, subject_id, occurred_at DESC)`, and `actor_id`.

### `work_areas` and `labels`

Both use the following shape:

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `citext` | Required, nonblank |
| `sort_order` | `integer` | Nonnegative |
| `is_active` | `boolean` | Required |
| `created_by` | `uuid` | FK to `profiles` |
| `created_at` | `timestamptz` | Required |
| `archived_by` | `uuid` | Nullable FK to `profiles` |
| `archived_at` | `timestamptz` | Nullable |
| `updated_by` | `uuid` | FK to `profiles` |
| `updated_at` | `timestamptz` | Required |

Archive actor/time are both null or both non-null and agree with `is_active`. Active names are case-insensitively unique. Indexes: unique partial `name WHERE is_active`, `(is_active, sort_order, name)`.

## 5. Work Item core and history

### `work_items`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `work_item_number` | `bigint` | Generated identity, unique |
| `display_id` | `text` | Stored generated `DF-` plus six-or-more zero-padded digits; unique |
| `title` | `text` | Required, nonblank |
| `description` | `text` | Nullable |
| `area_id` | `uuid` | Required FK to `work_areas` |
| `status_code` | `text` | FK to `work_item_statuses`; default `backlog` |
| `primary_assignee_id` | `uuid` | Nullable FK to `profiles` |
| `planned_start_date` | `date` | Nullable |
| `due_date` | `date` | Nullable |
| `figma_url` | `text` | Nullable, validated Figma HTTPS URL |
| `created_by` | `uuid` | FK to `profiles` |
| `created_at` | `timestamptz` | Required |
| `updated_at` | `timestamptz` | Required |
| `last_worked_on` | `date` | Nullable recalculable cache |
| `last_activity_at` | `timestamptz` | Required |
| `completed_at` | `timestamptz` | Nullable latest Done transition |
| `archived_by` | `uuid` | Nullable FK to `profiles` |
| `archived_at` | `timestamptz` | Nullable |

Invariants:

- A status with `requires_primary_assignee = true` has an active, work-attribution-eligible primary assignee.
- An archived row has both archive columns, and its status is archive-eligible.
- Status, assignment, archive, and history snapshots agree at transaction commit.
- `updated_at` changes for title, description, Area/Squad, status, primary assignee, planned dates, Figma URL, labels, and archive state. Work logging, comments, blockers, and subtask-only changes do not change it.
- `last_activity_at >= created_at`.

Indexes: `display_id`, `(status_code, archived_at)`, `(primary_assignee_id, status_code, archived_at)`, `(area_id, status_code, archived_at)`, `due_date`, `last_worked_on`, `last_activity_at`, plus trigram GIN indexes supporting case-insensitive partial display ID/title/description search.

### `work_item_assignments`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `work_item_id` | `uuid` | FK to `work_items` |
| `assignee_id` | `uuid` | FK to eligible `profiles` |
| `started_at` | `timestamptz` | Required |
| `ended_at` | `timestamptz` | Nullable, exclusive |
| `started_on` | `date` | Immutable team-local effective date, inclusive |
| `ended_on` | `date` | Nullable immutable team-local effective date, exclusive |
| `assigned_by` | `uuid` | FK to `profiles` |
| `start_operation_id` | `uuid` | FK to `operation_requests` |
| `end_operation_id` | `uuid` | Nullable FK to `operation_requests`; required when closed |

Timestamp periods for a ticket may not overlap. Daily effective ranges may not overlap, but an assignment replaced or removed on its start date may have `ended_on = started_on`, preserving the timestamp event while giving it no daily attribution. Exactly one open period agrees with a non-null current assignee; no open period agrees with a null current assignee. Indexes: `(work_item_id, started_at DESC)`, `(work_item_id, started_on DESC)`, `(assignee_id, started_at, ended_at)`, and unique partial `work_item_id WHERE ended_at IS NULL`.

On assignment, reassignment, or removal, the operation captures the current team-local date. A replacement closes the old row with that `ended_on` and opens the new row with that `started_on`, so the final assignment of the date owns the date. For work date `d`, attribution uses the row where `started_on <= d AND (ended_on IS NULL OR d < ended_on)`. If none exists, the entry has no primary relationship and the eligible `worked_by` person is a contributor.

### `work_item_status_history`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `work_item_id` | `uuid` | FK to `work_items` |
| `from_status_code` | `text` | Nullable only for creation |
| `to_status_code` | `text` | FK to `work_item_statuses` |
| `changed_by` | `uuid` | FK to `profiles` |
| `changed_at` | `timestamptz` | Required |
| `changed_on` | `date` | Immutable team-local date captured at change time |
| `operation_id` | `uuid` | FK to `operation_requests` |

Append-only. The creation row has null `from_status_code`; later rows chain without gaps and agree with the current snapshot. For a date-only work record, the latest transition with `changed_on <= work_date`, ordered by `changed_on` then `changed_at`, is the end-of-date status. Indexes: `(work_item_id, changed_at DESC)`, `(work_item_id, changed_on DESC, changed_at DESC)`, and `(to_status_code, changed_at)`.

### `work_item_events`

Unified append-only timeline and notification source.

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `work_item_id` | `uuid` | FK to `work_items` |
| `event_type_code` | `text` | FK to `work_item_event_types` |
| `actor_id` | `uuid` | FK to `profiles` |
| `subject_type` | `text` | Stable category |
| `subject_id` | `uuid` | Nullable |
| `previous_values` | `jsonb` | Nullable JSON object |
| `new_values` | `jsonb` | Nullable JSON object |
| `operation_id` | `uuid` | FK to `operation_requests` |
| `occurred_at` | `timestamptz` | Required |

One compound operation may create several typed events, but a semantic change is recorded exactly once. Indexes: `(work_item_id, occurred_at DESC, id)`, `(operation_id, event_type_code)`, and `subject_id`.

### `work_item_labels`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `work_item_id` | `uuid` | FK to `work_items` |
| `label_id` | `uuid` | FK to `labels` |
| `applied_by` | `uuid` | FK to `profiles` |
| `applied_at` | `timestamptz` | Required |
| `removed_by` | `uuid` | Nullable FK to `profiles` |
| `removed_at` | `timestamptz` | Nullable |
| `apply_operation_id` | `uuid` | FK to `operation_requests` |
| `remove_operation_id` | `uuid` | Nullable FK to `operation_requests`; required when removed |

Removal metadata is paired. A partial unique index on `(work_item_id, label_id) WHERE removed_at IS NULL` prevents duplicate current labels. History is never deleted.

## 6. Subtasks, comments, and blockers

### `subtasks`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `work_item_id` | `uuid` | FK to `work_items` |
| `title` | `text` | Required, nonblank |
| `position` | `integer` | Positive |
| `active_position` | `integer` | Generated as position while not withdrawn, else null |
| `is_completed` | `boolean` | Required |
| `created_by` / `created_at` | `uuid` / `timestamptz` | Required |
| `completed_by` / `completed_at` | `uuid` / `timestamptz` | Paired, nullable |
| `withdrawn_by` / `withdrawn_at` | `uuid` / `timestamptz` | Paired, nullable |
| `updated_at` | `timestamptz` | Required |

Unique `(work_item_id, active_position)`. A withdrawn subtask is not current or counted. Completion actor/time agrees with `is_completed`; reopening clears both. Rename, reorder, completion, reopening, and withdrawal are preserved in `work_item_events`.

### `comments`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `work_item_id` | `uuid` | FK to `work_items` |
| `author_id` | `uuid` | FK to `profiles` |
| `body` | `text` | Required, nonblank |
| `created_at` | `timestamptz` | Required |
| `edited_at` | `timestamptz` | Nullable |
| `withdrawn_by` | `uuid` | Nullable FK to `profiles` |
| `withdrawn_at` | `timestamptz` | Nullable |

`comment_revisions` has:

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `comment_id` | `uuid` | FK to `comments` |
| `revision_number` | `integer` | Positive, sequential per comment |
| `previous_body` | `text` | Required |
| `new_body` | `text` | Nullable only for withdrawal |
| `change_kind` | `text` | `edit` or `withdraw` |
| `changed_by` | `uuid` | FK to `profiles` |
| `operation_id` | `uuid` | FK to `operation_requests` |
| `changed_at` | `timestamptz` | Required |

It is append-only and excluded from normal Work Item/report/export reads. A withdrawal revision retains the former body only in restricted audit storage; ordinary timeline events record only that withdrawal occurred.

Indexes: comments `(work_item_id, created_at, id)`; revisions unique `(comment_id, revision_number)`.

### `blockers`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `work_item_id` | `uuid` | FK to `work_items` |
| `reason` | `text` | Required, nonblank |
| `blocked_by` / `blocked_at` | `uuid` / `timestamptz` | Required |
| `expected_resolution_date` | `date` | Nullable |
| `resolved_by` / `resolved_at` | `uuid` / `timestamptz` | Paired, nullable |
| `resolution_note` | `text` | Nullable |
| `create_operation_id` | `uuid` | FK to `operation_requests` |
| `resolve_operation_id` | `uuid` | Nullable FK to `operation_requests` |

A partial unique index on `work_item_id WHERE resolved_at IS NULL` permits one active blocker. Creation is valid only in `todo`, `in_progress`, or `in_review`. Resolution never deletes the row. Indexes: `(work_item_id, blocked_at DESC)` and `(resolved_at, work_item_id)`.

## 7. Work logging and audit

### `work_log_batches`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `context_code` | `text` | `ticket` or `standalone_visual` |
| `work_item_id` | `uuid` | Required only for ticket context |
| `related_area_id` | `uuid` | Nullable; allowed only for visual context |
| `worked_by` | `uuid` | FK to active, work-attribution-eligible profile at submission |
| `logged_by` | `uuid` | FK to active profile |
| `created_at` | `timestamptz` | Required |
| `edited_at` | `timestamptz` | Nullable |
| `withdrawn_by` | `uuid` | Nullable FK to `profiles` |
| `withdrawn_at` | `timestamptz` | Nullable |
| `create_operation_id` | `uuid` | FK to `operation_requests` |

Context columns are mutually consistent. Withdrawal metadata is paired. Indexes: `(work_item_id, withdrawn_at, created_at)`, `(worked_by, withdrawn_at, created_at)`, `(related_area_id, withdrawn_at)`.

`work_log_batches` never stores a requested ticket status, ticket-creation payload, or unfinished UI draft. The selected Work Item is the result of an already completed `create_work_item` operation when the user entered through Create New Ticket.

### `work_log_entries`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `batch_id` | `uuid` | FK to `work_log_batches` |
| `work_date` | `date` | Required; not later than team-local today |
| `work_type_code` | `text` | FK to `work_type_definitions`; context must match batch |
| `description` | `text` | Nullable for every type |
| `position` | `smallint` | `1..5` |
| `withdrawn_by` | `uuid` | Nullable FK to `profiles` |
| `withdrawn_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | Required |
| `updated_at` | `timestamptz` | Required |

A non-withdrawn batch has one to five non-withdrawn entries, with unique active positions. Friday and Saturday are valid dates. Same person/ticket/date duplicates are allowed.

Indexes: `(batch_id, position)`, `(work_date, work_type_code)`, and partial `(batch_id, work_date) WHERE withdrawn_at IS NULL`.

### Work-log revisions

`work_log_batch_revisions` has:

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `batch_id` | `uuid` | FK to `work_log_batches` |
| `revision_number` | `integer` | Positive, sequential per batch |
| `previous_values` | `jsonb` | Exact previous context, Work Item/Area IDs, attribution, and withdrawal state |
| `new_values` | `jsonb` | Exact new values |
| `change_kind` | `text` | `correction` or `withdrawal` |
| `changed_by` | `uuid` | FK to `profiles` |
| `operation_id` | `uuid` | FK to `operation_requests` |
| `changed_at` | `timestamptz` | Required |

`work_log_entry_revisions` has:

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `entry_id` | `uuid` | FK to `work_log_entries` |
| `revision_number` | `integer` | Positive, sequential per entry |
| `previous_values` | `jsonb` | Previous date, type, description, position, and withdrawal state |
| `new_values` | `jsonb` | New values; nullable fields retain explicit JSON null |
| `change_kind` | `text` | `correction` or `withdrawal` |
| `changed_by` | `uuid` | FK to `profiles` |
| `operation_id` | `uuid` | FK to `operation_requests` |
| `changed_at` | `timestamptz` | Required |

Both tables are append-only. Unique indexes enforce `(batch_id, revision_number)` and `(entry_id, revision_number)`; operation/changed-at indexes support audit reconstruction.

The current batch/entry rows are the normal-query source of truth. Revision rows are the audit reconstruction source. A correction transaction recalculates both the old and new affected tickets.

## 8. Notifications and idempotency

### `notifications`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK |
| `recipient_id` | `uuid` | FK to `profiles` |
| `actor_id` | `uuid` | FK to `profiles`; differs from recipient |
| `work_item_id` | `uuid` | FK to `work_items` |
| `source_event_id` | `uuid` | FK to `work_item_events` |
| `notification_type_code` | `text` | FK to `notification_type_definitions` |
| `created_at` | `timestamptz` | Required |
| `read_at` | `timestamptz` | Nullable |

Approved codes: `assigned_to_you`, `reassigned_away_from_you`, `status_changed`, `blocker_created`, `blocker_resolved`, and `comment_added`.

Unique `(recipient_id, notification_type_code, source_event_id)`. No comment body, blocker reason, or arbitrary source free text is copied. Indexes: `(recipient_id, read_at, created_at DESC)` and `(work_item_id, created_at DESC)`.

### `operation_requests`

Every mutating RPC and Edge Function receives a caller-stable UUID idempotency key.

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK; caller-supplied |
| `operation_code` | `text` | Stable operation name |
| `actor_id` | `uuid` | Nullable only for first bootstrap |
| `request_hash` | `text` | SHA-256 of canonical non-secret input |
| `state` | `text` | `started`, `pending_external`, or `completed` |
| `result` | `jsonb` | Nullable, contains IDs/status only |
| `created_at` | `timestamptz` | Required |
| `updated_at` | `timestamptz` | Required |
| `completed_at` | `timestamptz` | Nullable |

The row is written in the same transaction as the mutation. Database-only operations move directly to `completed`. Edge operations may remain `pending_external` while an Auth action is safely retried, then move to `completed` through the owning RPC. A retry with the same ID and hash returns the recorded non-secret result; the same ID with a different hash fails. Results never contain passwords or temporary credentials.

A client flow that creates a Work Item, submits work, and requests a status transition creates up to three `operation_requests`, one for each operation code. An operation ID cannot be shared across those boundaries, and their results do not imply that another operation completed.

## 9. Derived definitions and sources

A **valid work entry** is a `work_log_entries` row where neither the entry nor its batch is withdrawn.

| Derived value | Formula and source |
|---|---|
| Current contributors | Distinct eligible `worked_by` on valid ticket entries whose end-of-work-date assignee is null or different |
| Ticket Active work days | Count distinct valid ticket `work_date` per ticket |
| `last_worked_on` | Maximum valid ticket `work_date`; null when none |
| First actual work date | Minimum valid ticket `work_date` |
| `last_activity_at` | Maximum occurrence timestamp across core events, work-log submit/edit/withdraw, comments, blockers, and subtask activity |
| `completed_at` | Timestamp of most recent transition into `done`; null if never Done |
| Reopen count | Count status-history rows whose `from_status_code = 'done'` and target differs |
| Completed as primary | Assignee interval effective at the Done-transition timestamp |
| Status on work date | Final status-history row with captured `changed_on <= work_date`, ordered by effective date then transition time; null when approved backdated work predates ticket creation |
| Ticket-day | Distinct `(worked_by, work_item_id, work_date)` among valid ticket entries |
| Ticket active day | Distinct `(worked_by, work_date)` among valid ticket entries |
| Visual activity-day | Distinct `(worked_by, work_date)` among valid visual entries |
| Overall active calendar day | Distinct `(worked_by, work_date)` across both valid contexts |
| Planned until | Maximum due date over current unarchived owned tickets in active reporting bucket, plus a separate count with null due date |
| Overdue | Unarchived active-bucket ticket with non-null due date before snapshot local date |
| Due soon | Unarchived active-bucket ticket due from snapshot local date through `add_working_days(snapshot_date, 5)`, inclusive; the helper skips Friday/Saturday when finding the cutoff |
| Stale | Unarchived active-bucket ticket for which five working days have elapsed after the latest of last valid work date, start of the current uninterrupted active run, and planned start; a future planned start prevents staleness |
| No recent work recorded | Active profile with no valid ticket or visual work date in the preceding five working days |

The current active run begins on transition from a non-active reporting bucket into any active-bucket status. Transitions among `todo`, `in_progress`, and `in_review` do not reset it. Working-day functions use the product policy version effective at the evaluated instant.

`working_days_elapsed_after(anchor, as_of)` counts policy working dates where `anchor < date <= as_of`. A ticket becomes stale when that count reaches 5. `add_working_days(date, 5)` advances across five policy working dates after the input date; calendar weekend due dates between the input and cutoff remain included. The No recent work window is the five most recent policy working dates on or before the as-of date. Sunday-through-Saturday period presets are calendar ranges and do not discard valid Friday/Saturday work.

Historical report snapshots use:

- latest status history at or before the snapshot instant;
- final captured team-local status and assignment effective on a date-only work record;
- assignment interval containing the snapshot instant;
- archive event state at the snapshot instant;
- label/subtask/event periods at the snapshot instant;
- reporting line effective on the work/event date; and
- work records by `work_date`, not submission time.

No report total, contributor list, workload score, or availability value is a manually editable system of record.

## 10. System-of-record map

| Record or relationship | System of record |
|---|---|
| Authentication identity/session | `auth.users` and Supabase Auth |
| Current portal identity/access snapshot | `profiles` |
| Position/Admin/active history | `profile_access_periods` |
| Effective reporting hierarchy | `reporting_line_assignments` |
| Team timezone | `team_settings` |
| Product calendar/threshold rules | `product_policy_versions` |
| Positions/statuses/work types | Their system reference tables |
| Areas/Squads and labels | `work_areas`, `labels` |
| Settings/access audit | `admin_audit_events` |
| Current Work Item | `work_items` |
| Assignment history | `work_item_assignments` |
| Status history | `work_item_status_history` |
| Work Item timeline/audit | `work_item_events` plus restricted revision tables |
| Current and historical labels | `work_item_labels` active/removal periods |
| Subtasks | `subtasks` plus `work_item_events` |
| Comments and revisions | `comments`, `comment_revisions` |
| Blocker history | `blockers` |
| Work submissions and dates | `work_log_batches`, `work_log_entries` |
| Work-log audit | Work-log revision tables and `work_item_events` |
| Notification/read state | `notifications` |
| Mutation idempotency | `operation_requests` |
| Unfinished Log Work draft and return state | Client form state only; not persisted in the MVP |

## 11. Archive, withdrawal, effective-date, and append-only rules

- Product actions never hard-delete a profile, Work Item, assignment, status row, label relationship, subtask, comment, blocker, work log, notification, or audit event.
- Areas/Squads and labels use active/archive state. Historically referenced values remain readable.
- Work Item archive/restore changes archive metadata only; it never changes workflow status.
- Comments and subtasks use withdrawal metadata. Normal reads show a withdrawal marker where required and never expose former withdrawn bodies.
- A withdrawn work-log batch or entry is excluded from contribution, last-worked, Dashboard, reports, and exports, but retained with revisions and timeline events.
- Effective periods are closed by setting the exclusive end; old periods are never rewritten to a different meaning.
- Status history, Work Item events, administration audit, and revision tables are append-only to application roles.
- Corrections write a revision before updating the current snapshot in the same transaction.

## 12. Migration, generated-type, seed, and fixture conventions

### Migrations

- Location: `supabase/migrations/`.
- Name: `<14-digit UTC timestamp>_<imperative_snake_case_description>.sql`, for example `20260719090000_create_identity_and_policy_schema.sql`.
- Migrations are forward-only and deterministic. They contain no environment-specific IDs, production data, or secrets.
- The initial schema and RLS ship together. No table is exposed to authenticated users before its RLS policies exist.
- Destructive meaning changes use expand–migrate–contract across releases.
- A migration that changes a controlled code, workflow, capability, calendar rule, history interpretation, or derived cache includes compatibility notes and regression tests.

### Generated types

- Canonical generated file: `src/shared/supabase/database.types.ts`.
- Generate from a freshly reset local database after all migrations.
- Never hand-edit generated types.
- CI resets the database, regenerates to a temporary file, and fails on a diff.

### Seed data

- `supabase/seed.sql` contains only idempotent system references and visibly synthetic development data.
- Reference rows use stable codes from this contract.
- Local/staging seed accounts use reserved synthetic email domains and conspicuous names; no production or customer data is allowed.
- Areas, labels, tickets, work dates, comments, and Figma URLs in fixtures are explicitly synthetic.

### Permission fixtures

The minimum reusable persona set is:

- active Viewer;
- active Designer and Designer + Admin;
- active Lead and Lead + Admin;
- active Manager and Manager + Admin;
- inactive examples for each affected access test; and
- a negative account-state case proving Viewer + Admin is rejected.

Representative domain fixtures include current and historical reporting lines, every status, archived records, active/resolved blockers, reassignment on a work date, backdated Friday/Saturday work, multi-date batches, corrected/withdrawn entries, contributors, incomplete/completed/withdrawn subtasks, edited/withdrawn comments, and every notification type.

## 13. First-migration and feature-operation verification gates

Under D-100, the Phase 1 first migration creates the complete physical
table/constraint/index/reference-data foundation, RLS/read surfaces,
authorization helpers, synthetic principal fixtures, and generated database
types. It does not expose feature mutations early. The Phase 1 database slice
is not complete until pgTAP tests prove:

Masked comment and valid-work views are security-barrier, owner-checked views
with an explicit application-user predicate because browser roles do not
retain the underlying sensitive base-table grants. Security-invoker views
remain preferred where the caller safely holds every required base privilege.

- every key, FK, uniqueness, interval, eligibility, active-assignee, archive, blocker, batch-size, context, and future-date invariant;
- Viewer + Admin rejection;
- current snapshots agree with open history periods;
- append-only tables reject update/delete;
- same-day assignment attribution uses the end-of-team-local-day rule;
- every table has RLS enabled and forced before authenticated exposure;
- column privacy and all applicable read allow/deny cases in
  `permission-matrix.md` pass for the seven valid principals plus
  inactive/password-restricted cases; and
- feature tables have no browser mutation path before their owning RPC exists.

The owning Phase 2–4 feature slice must add the applicable pgTAP tests before
exposing each mutation. Across those slices, the complete suite must prove:

- final-active-Admin protection;
- correction/withdrawal recalculates both old and new affected tickets;
- work-log submission cannot mutate Work Item status or write status history,
  status transition cannot write work-log rows, and ticket creation cannot
  submit work;
- status, assignment, blocker, comment, and notification events are exactly
  once under idempotent retries; and
- every remaining write/RPC allow/deny case in `permission-matrix.md`.
