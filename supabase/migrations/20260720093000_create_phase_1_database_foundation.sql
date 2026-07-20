-- Design Flow Phase 1 database foundation.
--
-- D-100 boundary:
--   * complete physical schema, constraints, indexes, controlled values,
--     RLS/read surfaces, authorization helpers, and generated-type inputs;
--   * no feature mutation RPCs or direct browser domain writes before the
--     owning Phase 2-4 vertical slice.

begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists btree_gist with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.position_definitions (
  code text primary key,
  display_label text not null check (btrim(display_label) <> ''),
  sort_order smallint not null unique check (sort_order > 0),
  admin_eligible boolean not null,
  work_attribution_eligible boolean not null,
  primary_assignment_eligible boolean not null,
  is_selectable boolean not null default true
);

create table public.work_item_statuses (
  code text primary key,
  display_label text not null check (btrim(display_label) <> ''),
  sort_order smallint not null unique check (sort_order > 0),
  reporting_bucket text not null
    check (reporting_bucket in ('backlog', 'active', 'completed', 'paused')),
  requires_primary_assignee boolean not null,
  archive_eligible boolean not null,
  is_selectable boolean not null default true
);

create table public.work_item_status_transitions (
  from_status_code text not null
    references public.work_item_statuses(code) on delete restrict,
  to_status_code text not null
    references public.work_item_statuses(code) on delete restrict,
  is_allowed boolean not null,
  introduced_in_policy_version integer not null check (introduced_in_policy_version > 0),
  primary key (from_status_code, to_status_code),
  check (from_status_code <> to_status_code)
);

create table public.work_type_definitions (
  code text primary key,
  context_code text not null
    check (context_code in ('ticket', 'standalone_visual')),
  display_label text not null check (btrim(display_label) <> ''),
  sort_order smallint not null check (sort_order > 0),
  is_selectable boolean not null default true,
  unique (context_code, sort_order)
);

create table public.product_policy_versions (
  version integer primary key check (version > 0),
  effective_from timestamptz not null,
  effective_to timestamptz,
  week_starts_on smallint not null check (week_starts_on between 0 and 6),
  working_days smallint[] not null,
  stale_after_working_days smallint not null check (stale_after_working_days > 0),
  due_soon_working_days smallint not null check (due_soon_working_days > 0),
  max_work_log_entries smallint not null check (max_work_log_entries between 1 and 5),
  created_at timestamptz not null default statement_timestamp(),
  check (effective_to is null or effective_to > effective_from),
  check (
    cardinality(working_days) between 1 and 7
    and working_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  ),
  exclude using gist (
    tstzrange(effective_from, effective_to, '[)') with &&
  )
);

create unique index product_policy_versions_one_current
  on public.product_policy_versions ((effective_to is null))
  where effective_to is null;

create table public.admin_audit_event_types (
  code text primary key
);

create table public.work_item_event_types (
  code text primary key
);

create table public.notification_type_definitions (
  code text primary key
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  email extensions.citext not null unique,
  display_name text not null check (btrim(display_name) <> ''),
  position_code text not null
    references public.position_definitions(code) on delete restrict,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  current_reports_to_id uuid references public.profiles(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (not is_admin or position_code <> 'viewer'),
  check (current_reports_to_id is null or current_reports_to_id <> id),
  check (updated_at >= created_at)
);

create index profiles_active_position_idx
  on public.profiles (is_active, position_code);
create index profiles_reports_to_idx
  on public.profiles (current_reports_to_id);
create unique index profiles_active_admin_idx
  on public.profiles (id)
  where is_admin and is_active;

create table public.operation_requests (
  id uuid primary key,
  operation_code text not null check (btrim(operation_code) <> ''),
  actor_id uuid references public.profiles(id) on delete restrict,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  state text not null check (state in ('started', 'pending_external', 'completed')),
  result jsonb check (result is null or jsonb_typeof(result) = 'object'),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  completed_at timestamptz,
  check (updated_at >= created_at),
  check (
    (state = 'completed' and completed_at is not null)
    or (state <> 'completed' and completed_at is null)
  ),
  check (actor_id is not null or operation_code = 'bootstrap_first_admin')
);

create index operation_requests_actor_created_idx
  on public.operation_requests (actor_id, created_at desc);

create table public.profile_access_periods (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  position_code text not null
    references public.position_definitions(code) on delete restrict,
  is_admin boolean not null,
  is_active boolean not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  changed_by uuid references public.profiles(id) on delete restrict,
  start_operation_id uuid not null
    references public.operation_requests(id) on delete restrict,
  end_operation_id uuid
    references public.operation_requests(id) on delete restrict,
  check (not is_admin or position_code <> 'viewer'),
  check (ended_at is null or ended_at > started_at),
  check ((ended_at is null) = (end_operation_id is null)),
  exclude using gist (
    profile_id with =,
    tstzrange(started_at, ended_at, '[)') with &&
  ) deferrable initially immediate
);

create unique index profile_access_periods_one_open
  on public.profile_access_periods (profile_id)
  where ended_at is null;
create index profile_access_periods_history_idx
  on public.profile_access_periods (profile_id, started_at desc);

create table public.reporting_line_assignments (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.profiles(id) on delete restrict,
  supervisor_id uuid not null references public.profiles(id) on delete restrict,
  started_on date not null,
  ended_on date,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  start_operation_id uuid not null
    references public.operation_requests(id) on delete restrict,
  end_operation_id uuid
    references public.operation_requests(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  check (person_id <> supervisor_id),
  check (ended_on is null or ended_on >= started_on),
  check ((ended_on is null) = (end_operation_id is null)),
  exclude using gist (
    person_id with =,
    daterange(started_on, ended_on, '[)') with &&
  ) deferrable initially immediate
);

create unique index reporting_line_assignments_one_open
  on public.reporting_line_assignments (person_id)
  where ended_on is null;
create index reporting_line_assignments_person_idx
  on public.reporting_line_assignments (person_id, started_on desc);
create index reporting_line_assignments_supervisor_idx
  on public.reporting_line_assignments (supervisor_id, started_on, ended_on);

create table public.team_settings (
  singleton_key boolean primary key default true check (singleton_key),
  timezone text,
  updated_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default statement_timestamp(),
  check ((timezone is null) = (updated_by is null))
);

create table public.bootstrap_state (
  singleton_key boolean primary key default true check (singleton_key),
  consumed_at timestamptz,
  first_admin_profile_id uuid references public.profiles(id) on delete restrict,
  operation_id uuid references public.operation_requests(id) on delete restrict,
  check (
    (consumed_at is null and first_admin_profile_id is null and operation_id is null)
    or
    (consumed_at is not null and first_admin_profile_id is not null and operation_id is not null)
  )
);

create table public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type_code text not null
    references public.admin_audit_event_types(code) on delete restrict,
  actor_id uuid references public.profiles(id) on delete restrict,
  subject_type text not null check (btrim(subject_type) <> ''),
  subject_id uuid,
  previous_values jsonb check (
    previous_values is null or jsonb_typeof(previous_values) = 'object'
  ),
  new_values jsonb check (
    new_values is null or jsonb_typeof(new_values) = 'object'
  ),
  operation_id uuid not null
    references public.operation_requests(id) on delete restrict,
  occurred_at timestamptz not null default statement_timestamp(),
  check (actor_id is not null or event_type_code = 'bootstrap_completed'),
  check (
    subject_id is not null
    or event_type_code in ('bootstrap_completed', 'team_timezone_changed')
  )
);

create index admin_audit_events_occurred_idx
  on public.admin_audit_events (occurred_at desc);
create index admin_audit_events_subject_idx
  on public.admin_audit_events (subject_type, subject_id, occurred_at desc);
create index admin_audit_events_actor_idx
  on public.admin_audit_events (actor_id);

create table public.work_areas (
  id uuid primary key default gen_random_uuid(),
  name extensions.citext not null check (btrim(name::text) <> ''),
  sort_order integer not null check (sort_order >= 0),
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  archived_by uuid references public.profiles(id) on delete restrict,
  archived_at timestamptz,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default statement_timestamp(),
  check ((archived_by is null) = (archived_at is null)),
  check (is_active = (archived_at is null)),
  check (updated_at >= created_at)
);

create unique index work_areas_active_name
  on public.work_areas (name)
  where is_active;
create index work_areas_listing_idx
  on public.work_areas (is_active, sort_order, name);

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  name extensions.citext not null check (btrim(name::text) <> ''),
  sort_order integer not null check (sort_order >= 0),
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  archived_by uuid references public.profiles(id) on delete restrict,
  archived_at timestamptz,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default statement_timestamp(),
  check ((archived_by is null) = (archived_at is null)),
  check (is_active = (archived_at is null)),
  check (updated_at >= created_at)
);

create unique index labels_active_name
  on public.labels (name)
  where is_active;
create index labels_listing_idx
  on public.labels (is_active, sort_order, name);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  work_item_number bigint generated always as identity unique,
  display_id text generated always as (
    'DF-' || lpad(
      work_item_number::text,
      greatest(6, length(work_item_number::text)),
      '0'
    )
  ) stored unique,
  title text not null check (btrim(title) <> ''),
  description text,
  area_id uuid not null references public.work_areas(id) on delete restrict,
  status_code text not null default 'backlog'
    references public.work_item_statuses(code) on delete restrict,
  primary_assignee_id uuid references public.profiles(id) on delete restrict,
  planned_start_date date,
  due_date date,
  figma_url text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  last_worked_on date,
  last_activity_at timestamptz not null default statement_timestamp(),
  completed_at timestamptz,
  archived_by uuid references public.profiles(id) on delete restrict,
  archived_at timestamptz,
  check (description is null or btrim(description) <> ''),
  check (planned_start_date is null or due_date is null or due_date >= planned_start_date),
  check ((archived_by is null) = (archived_at is null)),
  check (updated_at >= created_at),
  check (last_activity_at >= created_at),
  check (
    figma_url is null
    or figma_url ~* '^https://([a-z0-9-]+\.)*figma\.com(/|$)'
  )
);

create index work_items_status_archive_idx
  on public.work_items (status_code, archived_at);
create index work_items_assignee_status_idx
  on public.work_items (primary_assignee_id, status_code, archived_at);
create index work_items_area_status_idx
  on public.work_items (area_id, status_code, archived_at);
create index work_items_due_date_idx on public.work_items (due_date);
create index work_items_last_worked_idx on public.work_items (last_worked_on);
create index work_items_last_activity_idx on public.work_items (last_activity_at);
create index work_items_display_id_trgm_idx
  on public.work_items using gin (display_id extensions.gin_trgm_ops);
create index work_items_title_trgm_idx
  on public.work_items using gin (title extensions.gin_trgm_ops);
create index work_items_description_trgm_idx
  on public.work_items using gin (description extensions.gin_trgm_ops);

create table public.work_item_assignments (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete restrict,
  assignee_id uuid not null references public.profiles(id) on delete restrict,
  started_at timestamptz not null,
  ended_at timestamptz,
  started_on date not null,
  ended_on date,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  start_operation_id uuid not null
    references public.operation_requests(id) on delete restrict,
  end_operation_id uuid
    references public.operation_requests(id) on delete restrict,
  check (ended_at is null or ended_at > started_at),
  check (ended_on is null or ended_on >= started_on),
  check ((ended_at is null) = (end_operation_id is null)),
  check ((ended_at is null) = (ended_on is null)),
  exclude using gist (
    work_item_id with =,
    tstzrange(started_at, ended_at, '[)') with &&
  ) deferrable initially immediate,
  exclude using gist (
    work_item_id with =,
    daterange(started_on, ended_on, '[)') with &&
  ) deferrable initially immediate
);

create unique index work_item_assignments_one_open
  on public.work_item_assignments (work_item_id)
  where ended_at is null;
create index work_item_assignments_history_idx
  on public.work_item_assignments (work_item_id, started_at desc);
create index work_item_assignments_date_idx
  on public.work_item_assignments (work_item_id, started_on desc);
create index work_item_assignments_assignee_idx
  on public.work_item_assignments (assignee_id, started_at, ended_at);

create table public.work_item_status_history (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete restrict,
  from_status_code text references public.work_item_statuses(code) on delete restrict,
  to_status_code text not null
    references public.work_item_statuses(code) on delete restrict,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  changed_at timestamptz not null default statement_timestamp(),
  changed_on date not null,
  operation_id uuid not null
    references public.operation_requests(id) on delete restrict,
  check (from_status_code is null or from_status_code <> to_status_code)
);

create index work_item_status_history_time_idx
  on public.work_item_status_history (work_item_id, changed_at desc);
create index work_item_status_history_date_idx
  on public.work_item_status_history (work_item_id, changed_on desc, changed_at desc);
create index work_item_status_history_target_idx
  on public.work_item_status_history (to_status_code, changed_at);

create table public.work_item_events (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete restrict,
  event_type_code text not null
    references public.work_item_event_types(code) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  subject_type text not null check (btrim(subject_type) <> ''),
  subject_id uuid,
  previous_values jsonb check (
    previous_values is null or jsonb_typeof(previous_values) = 'object'
  ),
  new_values jsonb check (
    new_values is null or jsonb_typeof(new_values) = 'object'
  ),
  operation_id uuid not null
    references public.operation_requests(id) on delete restrict,
  occurred_at timestamptz not null default statement_timestamp()
);

create index work_item_events_timeline_idx
  on public.work_item_events (work_item_id, occurred_at desc, id);
create index work_item_events_operation_idx
  on public.work_item_events (operation_id, event_type_code);
create index work_item_events_subject_idx
  on public.work_item_events (subject_id);

create table public.work_item_labels (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete restrict,
  label_id uuid not null references public.labels(id) on delete restrict,
  applied_by uuid not null references public.profiles(id) on delete restrict,
  applied_at timestamptz not null default statement_timestamp(),
  removed_by uuid references public.profiles(id) on delete restrict,
  removed_at timestamptz,
  apply_operation_id uuid not null
    references public.operation_requests(id) on delete restrict,
  remove_operation_id uuid
    references public.operation_requests(id) on delete restrict,
  check ((removed_by is null) = (removed_at is null)),
  check ((removed_at is null) = (remove_operation_id is null))
);

create unique index work_item_labels_one_current
  on public.work_item_labels (work_item_id, label_id)
  where removed_at is null;
create index work_item_labels_history_idx
  on public.work_item_labels (work_item_id, applied_at, removed_at);

create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete restrict,
  title text not null check (btrim(title) <> ''),
  position integer not null check (position > 0),
  active_position integer generated always as (
    case when withdrawn_at is null then position else null end
  ) stored,
  is_completed boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  completed_by uuid references public.profiles(id) on delete restrict,
  completed_at timestamptz,
  withdrawn_by uuid references public.profiles(id) on delete restrict,
  withdrawn_at timestamptz,
  updated_at timestamptz not null default statement_timestamp(),
  unique (work_item_id, active_position),
  check ((completed_by is null) = (completed_at is null)),
  check (is_completed = (completed_at is not null)),
  check ((withdrawn_by is null) = (withdrawn_at is null)),
  check (updated_at >= created_at)
);

create index subtasks_work_item_idx
  on public.subtasks (work_item_id, active_position, created_at);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (btrim(body) <> ''),
  created_at timestamptz not null default statement_timestamp(),
  edited_at timestamptz,
  withdrawn_by uuid references public.profiles(id) on delete restrict,
  withdrawn_at timestamptz,
  check ((withdrawn_by is null) = (withdrawn_at is null)),
  check (edited_at is null or edited_at >= created_at)
);

create index comments_work_item_idx
  on public.comments (work_item_id, created_at, id);

create table public.comment_revisions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  previous_body text not null,
  new_body text,
  change_kind text not null check (change_kind in ('edit', 'withdraw')),
  changed_by uuid not null references public.profiles(id) on delete restrict,
  operation_id uuid not null
    references public.operation_requests(id) on delete restrict,
  changed_at timestamptz not null default statement_timestamp(),
  unique (comment_id, revision_number),
  check (
    (change_kind = 'edit' and new_body is not null and btrim(new_body) <> '')
    or (change_kind = 'withdraw' and new_body is null)
  )
);

create table public.blockers (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete restrict,
  reason text not null check (btrim(reason) <> ''),
  blocked_by uuid not null references public.profiles(id) on delete restrict,
  blocked_at timestamptz not null default statement_timestamp(),
  expected_resolution_date date,
  resolved_by uuid references public.profiles(id) on delete restrict,
  resolved_at timestamptz,
  resolution_note text,
  create_operation_id uuid not null
    references public.operation_requests(id) on delete restrict,
  resolve_operation_id uuid
    references public.operation_requests(id) on delete restrict,
  check ((resolved_by is null) = (resolved_at is null)),
  check ((resolved_at is null) = (resolve_operation_id is null)),
  check (resolved_at is null or resolved_at >= blocked_at),
  check (resolution_note is null or btrim(resolution_note) <> '')
);

create unique index blockers_one_active
  on public.blockers (work_item_id)
  where resolved_at is null;
create index blockers_history_idx
  on public.blockers (work_item_id, blocked_at desc);
create index blockers_resolution_idx
  on public.blockers (resolved_at, work_item_id);

create table public.work_log_batches (
  id uuid primary key default gen_random_uuid(),
  context_code text not null
    check (context_code in ('ticket', 'standalone_visual')),
  work_item_id uuid references public.work_items(id) on delete restrict,
  related_area_id uuid references public.work_areas(id) on delete restrict,
  worked_by uuid not null references public.profiles(id) on delete restrict,
  logged_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  edited_at timestamptz,
  withdrawn_by uuid references public.profiles(id) on delete restrict,
  withdrawn_at timestamptz,
  create_operation_id uuid not null
    references public.operation_requests(id) on delete restrict,
  check (
    (context_code = 'ticket' and work_item_id is not null and related_area_id is null)
    or
    (context_code = 'standalone_visual' and work_item_id is null)
  ),
  check ((withdrawn_by is null) = (withdrawn_at is null)),
  check (edited_at is null or edited_at >= created_at)
);

create index work_log_batches_ticket_idx
  on public.work_log_batches (work_item_id, withdrawn_at, created_at);
create index work_log_batches_person_idx
  on public.work_log_batches (worked_by, withdrawn_at, created_at);
create index work_log_batches_area_idx
  on public.work_log_batches (related_area_id, withdrawn_at);

create table public.work_log_entries (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.work_log_batches(id) on delete restrict,
  work_date date not null,
  work_type_code text not null
    references public.work_type_definitions(code) on delete restrict,
  description text,
  position smallint not null check (position between 1 and 5),
  withdrawn_by uuid references public.profiles(id) on delete restrict,
  withdrawn_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (description is null or btrim(description) <> ''),
  check ((withdrawn_by is null) = (withdrawn_at is null)),
  check (updated_at >= created_at)
);

create index work_log_entries_batch_idx
  on public.work_log_entries (batch_id, position);
create index work_log_entries_reporting_idx
  on public.work_log_entries (work_date, work_type_code);
create unique index work_log_entries_active_position
  on public.work_log_entries (batch_id, position)
  where withdrawn_at is null;
create index work_log_entries_active_date_idx
  on public.work_log_entries (batch_id, work_date)
  where withdrawn_at is null;

create table public.work_log_batch_revisions (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.work_log_batches(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  previous_values jsonb not null check (jsonb_typeof(previous_values) = 'object'),
  new_values jsonb not null check (jsonb_typeof(new_values) = 'object'),
  change_kind text not null check (change_kind in ('correction', 'withdrawal')),
  changed_by uuid not null references public.profiles(id) on delete restrict,
  operation_id uuid not null
    references public.operation_requests(id) on delete restrict,
  changed_at timestamptz not null default statement_timestamp(),
  unique (batch_id, revision_number)
);

create index work_log_batch_revisions_operation_idx
  on public.work_log_batch_revisions (operation_id, changed_at);

create table public.work_log_entry_revisions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.work_log_entries(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  previous_values jsonb not null check (jsonb_typeof(previous_values) = 'object'),
  new_values jsonb not null check (jsonb_typeof(new_values) = 'object'),
  change_kind text not null check (change_kind in ('correction', 'withdrawal')),
  changed_by uuid not null references public.profiles(id) on delete restrict,
  operation_id uuid not null
    references public.operation_requests(id) on delete restrict,
  changed_at timestamptz not null default statement_timestamp(),
  unique (entry_id, revision_number)
);

create index work_log_entry_revisions_operation_idx
  on public.work_log_entry_revisions (operation_id, changed_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  work_item_id uuid not null references public.work_items(id) on delete restrict,
  source_event_id uuid not null
    references public.work_item_events(id) on delete restrict,
  notification_type_code text not null
    references public.notification_type_definitions(code) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  read_at timestamptz,
  check (actor_id <> recipient_id),
  check (read_at is null or read_at >= created_at),
  unique (recipient_id, notification_type_code, source_event_id)
);

create index notifications_inbox_idx
  on public.notifications (recipient_id, read_at, created_at desc);
create index notifications_ticket_idx
  on public.notifications (work_item_id, created_at desc);

insert into public.position_definitions (
  code,
  display_label,
  sort_order,
  admin_eligible,
  work_attribution_eligible,
  primary_assignment_eligible
)
values
  ('viewer', 'Viewer', 1, false, false, false),
  ('designer', 'Designer', 2, true, true, true),
  ('lead', 'Lead', 3, true, true, true),
  ('manager', 'Manager', 4, true, true, true);

insert into public.work_item_statuses (
  code,
  display_label,
  sort_order,
  reporting_bucket,
  requires_primary_assignee,
  archive_eligible
)
values
  ('backlog', 'Backlog', 1, 'backlog', false, true),
  ('todo', 'To do', 2, 'active', true, false),
  ('in_progress', 'In Progress', 3, 'active', true, false),
  ('in_review', 'In Review', 4, 'active', true, false),
  ('done', 'Done', 5, 'completed', false, true),
  ('paused', 'Paused', 6, 'paused', false, true);

insert into public.work_item_status_transitions (
  from_status_code,
  to_status_code,
  is_allowed,
  introduced_in_policy_version
)
select source.code, target.code, true, 1
from public.work_item_statuses source
cross join public.work_item_statuses target
where source.code <> target.code;

insert into public.work_type_definitions (
  code,
  context_code,
  display_label,
  sort_order
)
values
  ('planning_alignment', 'ticket', 'Planning & alignment', 1),
  ('discovery_research', 'ticket', 'Discovery & research', 2),
  ('mapping_information_architecture', 'ticket', 'Mapping & information architecture', 3),
  ('ideation_wireframing', 'ticket', 'Ideation & wireframing', 4),
  ('ui_visual_design', 'ticket', 'UI & visual design', 5),
  ('prototyping_interaction', 'ticket', 'Prototyping & interaction', 6),
  ('design_system', 'ticket', 'Design system', 7),
  ('testing_validation', 'ticket', 'Testing & validation', 8),
  ('review_iteration', 'ticket', 'Review & iteration', 9),
  ('documentation_handoff', 'ticket', 'Documentation & handoff', 10),
  ('design_qa_implementation_support', 'ticket', 'Design QA & implementation support', 11),
  ('team_support_collaboration', 'ticket', 'Team support & collaboration', 12),
  ('other', 'ticket', 'Other', 13),
  ('new_visual_asset', 'standalone_visual', 'New visual asset', 1),
  ('resizing_adaptation', 'standalone_visual', 'Resizing & adaptation', 2),
  ('presentation_support', 'standalone_visual', 'Presentation support', 3),
  ('image_editing', 'standalone_visual', 'Image editing', 4),
  ('illustration_iconography', 'standalone_visual', 'Illustration & iconography', 5),
  ('other_visual_work', 'standalone_visual', 'Other visual work', 6);

insert into public.product_policy_versions (
  version,
  effective_from,
  week_starts_on,
  working_days,
  stale_after_working_days,
  due_soon_working_days,
  max_work_log_entries
)
values (
  1,
  '2026-01-01 00:00:00+00',
  0,
  array[0, 1, 2, 3, 4]::smallint[],
  5,
  5,
  5
);

insert into public.admin_audit_event_types(code)
select unnest(array[
  'bootstrap_completed',
  'account_created',
  'position_changed',
  'admin_privilege_granted',
  'admin_privilege_removed',
  'reporting_line_changed',
  'account_deactivated',
  'account_reactivated',
  'password_reset_issued',
  'work_area_created',
  'work_area_renamed',
  'work_area_reordered',
  'work_area_archived',
  'work_area_reactivated',
  'label_created',
  'label_renamed',
  'label_reordered',
  'label_archived',
  'label_reactivated',
  'team_timezone_changed'
]::text[]);

insert into public.work_item_event_types(code)
select unnest(array[
  'created',
  'core_fields_changed',
  'labels_changed',
  'assignment_changed',
  'status_changed',
  'reopened',
  'blocker_created',
  'blocker_resolved',
  'subtask_added',
  'subtask_renamed',
  'subtask_reordered',
  'subtask_completed',
  'subtask_reopened',
  'subtask_withdrawn',
  'comment_added',
  'comment_edited',
  'comment_withdrawn',
  'work_log_submitted',
  'work_log_corrected',
  'work_log_withdrawn',
  'archived',
  'restored'
]::text[]);

insert into public.notification_type_definitions(code)
select unnest(array[
  'assigned_to_you',
  'reassigned_away_from_you',
  'status_changed',
  'blocker_created',
  'blocker_resolved',
  'comment_added'
]::text[]);

insert into public.team_settings(singleton_key) values (true);
insert into public.bootstrap_state(singleton_key) values (true);

create function private.is_valid_iana_timezone(value text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select value is not null
    and exists (
      select 1
      from pg_catalog.pg_timezone_names
      where name = value
    );
$$;

alter table public.team_settings
  add constraint team_settings_timezone_is_iana
  check (timezone is null or private.is_valid_iana_timezone(timezone));

create function private.is_application_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.is_active
      and not profile.must_change_password
      and not (profile.position_code = 'viewer' and profile.is_admin)
  );
$$;

create function private.current_position_code()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select profile.position_code
  from public.profiles profile
  where profile.id = auth.uid()
    and profile.is_active
    and not profile.must_change_password;
$$;

create function private.current_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select profile.is_admin
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.is_active
      and not profile.must_change_password
      and profile.position_code <> 'viewer'
  ), false);
$$;

create function private.is_lead_or_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_position_code() in ('lead', 'manager'), false);
$$;

create function private.is_work_attribution_eligible(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles profile
    join public.position_definitions position
      on position.code = profile.position_code
    where profile.id = profile_id
      and profile.is_active
      and position.work_attribution_eligible
  );
$$;

create function private.can_edit_work_item(work_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_application_user()
    and exists (
      select 1
      from public.work_items item
      where item.id = work_item_id
        and (
          private.current_is_admin()
          or private.is_lead_or_manager()
          or (
            private.current_position_code() = 'designer'
            and (
              item.created_by = auth.uid()
              or item.primary_assignee_id = auth.uid()
              or exists (
                select 1
                from public.work_log_batches batch
                join public.work_log_entries entry
                  on entry.batch_id = batch.id
                left join public.work_item_assignments assignment
                  on assignment.work_item_id = batch.work_item_id
                  and assignment.started_on <= entry.work_date
                  and (
                    assignment.ended_on is null
                    or entry.work_date < assignment.ended_on
                  )
                where batch.work_item_id = item.id
                  and batch.worked_by = auth.uid()
                  and batch.withdrawn_at is null
                  and entry.withdrawn_at is null
                  and (
                    assignment.assignee_id is null
                    or assignment.assignee_id <> batch.worked_by
                  )
              )
            )
          )
        )
    );
$$;

create function private.can_moderate_comments()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_application_user()
    and (private.current_is_admin() or private.is_lead_or_manager());
$$;

create function private.can_manage_settings()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_application_user() and private.current_is_admin();
$$;

create function private.can_export_reports()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_application_user()
    and (private.current_is_admin() or private.is_lead_or_manager());
$$;

create function private.can_export_work_item()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_application_user()
    and private.current_position_code() in ('designer', 'lead', 'manager');
$$;

create function private.current_team_date()
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (
    statement_timestamp() at time zone coalesce(
      (select timezone from public.team_settings where singleton_key),
      'UTC'
    )
  )::date;
$$;

grant execute on function private.is_application_user() to authenticated;
grant execute on function private.current_position_code() to authenticated;
grant execute on function private.current_is_admin() to authenticated;
grant execute on function private.is_lead_or_manager() to authenticated;
grant execute on function private.is_work_attribution_eligible(uuid) to authenticated;
grant execute on function private.can_edit_work_item(uuid) to authenticated;
grant execute on function private.can_moderate_comments() to authenticated;
grant execute on function private.can_manage_settings() to authenticated;
grant execute on function private.can_export_reports() to authenticated;
grant execute on function private.can_export_work_item() to authenticated;

create function private.assert_profile_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  target public.profiles;
  supervisor public.profiles;
  definition public.position_definitions;
  open_access public.profile_access_periods;
  open_line public.reporting_line_assignments;
begin
  target_id := case tg_table_name
    when 'profiles' then (to_jsonb(new) ->> 'id')::uuid
    when 'profile_access_periods' then (to_jsonb(new) ->> 'profile_id')::uuid
    else (to_jsonb(new) ->> 'person_id')::uuid
  end;

  select * into target
  from public.profiles
  where id = target_id;

  if target.id is null then
    return new;
  end if;

  select * into definition
  from public.position_definitions
  where code = target.position_code;

  if target.is_admin and not definition.admin_eligible then
    raise exception using errcode = '23514', message = 'invalid admin eligibility';
  end if;

  if target.created_by is null and target.id is distinct from (
    select first_admin_profile_id
    from public.bootstrap_state
    where singleton_key
  ) then
    raise exception using errcode = '23514', message = 'created_by is null outside first bootstrap';
  end if;

  select * into open_access
  from public.profile_access_periods
  where profile_id = target.id and ended_at is null;

  if open_access.id is null
    or open_access.position_code <> target.position_code
    or open_access.is_admin <> target.is_admin
    or open_access.is_active <> target.is_active
  then
    raise exception using errcode = '23514', message = 'profile snapshot does not match open access period';
  end if;

  select * into open_line
  from public.reporting_line_assignments
  where person_id = target.id and ended_on is null;

  if target.is_active and target.position_code in ('designer', 'lead') then
    if target.current_reports_to_id is null or open_line.supervisor_id is distinct from target.current_reports_to_id then
      raise exception using errcode = '23514', message = 'active profile requires matching reporting line';
    end if;

    select * into supervisor
    from public.profiles
    where id = target.current_reports_to_id;

    if not supervisor.is_active
      or (target.position_code = 'designer' and supervisor.position_code <> 'lead')
      or (target.position_code = 'lead' and supervisor.position_code <> 'manager')
    then
      raise exception using errcode = '23514', message = 'invalid active reporting hierarchy';
    end if;
  elsif target.current_reports_to_id is not null or open_line.id is not null then
    raise exception using errcode = '23514', message = 'position must not have a current supervisor';
  end if;

  return new;
end;
$$;

create constraint trigger profiles_assert_state
after insert or update on public.profiles
deferrable initially deferred
for each row execute function private.assert_profile_state();

create constraint trigger profile_access_periods_assert_state
after insert or update on public.profile_access_periods
deferrable initially deferred
for each row execute function private.assert_profile_state();

create constraint trigger reporting_lines_assert_state
after insert or update on public.reporting_line_assignments
deferrable initially deferred
for each row execute function private.assert_profile_state();

create function private.assert_bootstrap_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  state public.bootstrap_state;
  settings public.team_settings;
begin
  select * into state from public.bootstrap_state where singleton_key;
  select * into settings from public.team_settings where singleton_key;

  if state.consumed_at is not null then
    if settings.timezone is null or settings.updated_by is null then
      raise exception using errcode = '23514', message = 'consumed bootstrap requires team settings';
    end if;

    if not exists (
      select 1
      from public.profiles
      where is_active and is_admin and position_code <> 'viewer'
    ) then
      raise exception using errcode = '23514', message = 'at least one active admin is required';
    end if;
  end if;

  return new;
end;
$$;

create constraint trigger bootstrap_state_assert
after insert or update on public.bootstrap_state
deferrable initially deferred
for each row execute function private.assert_bootstrap_state();

create constraint trigger team_settings_assert_bootstrap
after insert or update on public.team_settings
deferrable initially deferred
for each row execute function private.assert_bootstrap_state();

create function private.assert_work_item_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  item public.work_items;
  status public.work_item_statuses;
begin
  target_id := case tg_table_name
    when 'work_items' then (to_jsonb(new) ->> 'id')::uuid
    else (to_jsonb(new) ->> 'work_item_id')::uuid
  end;

  select * into item
  from public.work_items
  where id = target_id;

  if item.id is null then
    return new;
  end if;

  select * into status
  from public.work_item_statuses
  where code = item.status_code;

  if status.requires_primary_assignee then
    if item.primary_assignee_id is null
      or not private.is_work_attribution_eligible(item.primary_assignee_id)
    then
      raise exception using errcode = '23514', message = 'status requires an eligible primary assignee';
    end if;
  end if;

  if item.primary_assignee_id is null then
    if exists (
      select 1 from public.work_item_assignments
      where work_item_id = item.id and ended_at is null
    ) then
      raise exception using errcode = '23514', message = 'null assignee conflicts with open assignment';
    end if;
  elsif not exists (
    select 1 from public.work_item_assignments
    where work_item_id = item.id
      and assignee_id = item.primary_assignee_id
      and ended_at is null
  ) then
    raise exception using errcode = '23514', message = 'current assignee requires matching open assignment';
  end if;

  if item.archived_at is not null and not status.archive_eligible then
    raise exception using errcode = '23514', message = 'status is not archive eligible';
  end if;

  if exists (
    select 1
    from public.blockers
    where work_item_id = item.id and resolved_at is null
  ) and item.status_code not in ('todo', 'in_progress', 'in_review') then
    raise exception using errcode = '23514', message = 'active blocker requires active status';
  end if;

  return new;
end;
$$;

create constraint trigger work_items_assert_state
after insert or update on public.work_items
deferrable initially deferred
for each row execute function private.assert_work_item_state();

create constraint trigger work_item_assignments_assert_state
after insert or update on public.work_item_assignments
deferrable initially deferred
for each row execute function private.assert_work_item_state();

create constraint trigger blockers_assert_work_item_state
after insert or update on public.blockers
deferrable initially deferred
for each row execute function private.assert_work_item_state();

create function private.assert_work_log_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  batch public.work_log_batches;
  active_entry_count integer;
begin
  target_id := case tg_table_name
    when 'work_log_batches' then (to_jsonb(new) ->> 'id')::uuid
    else (to_jsonb(new) ->> 'batch_id')::uuid
  end;

  select * into batch
  from public.work_log_batches
  where id = target_id;

  if batch.id is null then
    return new;
  end if;

  if not private.is_work_attribution_eligible(batch.worked_by) then
    raise exception using errcode = '23514', message = 'worked_by is not eligible';
  end if;

  if not exists (
    select 1
    from public.profiles logger
    where logger.id = batch.logged_by
      and logger.is_active
      and not logger.must_change_password
      and logger.position_code in ('designer', 'lead', 'manager')
  ) then
    raise exception using errcode = '23514', message = 'logged_by is not permitted';
  end if;

  if batch.context_code = 'ticket' and exists (
    select 1 from public.work_items
    where id = batch.work_item_id and archived_at is not null
  ) and batch.created_at = coalesce(batch.edited_at, batch.created_at) then
    raise exception using errcode = '23514', message = 'new ticket work requires an unarchived work item';
  end if;

  select count(*) into active_entry_count
  from public.work_log_entries
  where batch_id = batch.id and withdrawn_at is null;

  if batch.withdrawn_at is null and active_entry_count not between 1 and 5 then
    raise exception using errcode = '23514', message = 'active work batch requires one to five entries';
  end if;

  if exists (
    select 1
    from public.work_log_entries entry
    join public.work_type_definitions type
      on type.code = entry.work_type_code
    where entry.batch_id = batch.id
      and entry.withdrawn_at is null
      and (
        type.context_code <> batch.context_code
        or entry.work_date > private.current_team_date()
      )
  ) then
    raise exception using errcode = '23514', message = 'work entry context or date is invalid';
  end if;

  return new;
end;
$$;

create constraint trigger work_log_batches_assert_state
after insert or update on public.work_log_batches
deferrable initially deferred
for each row execute function private.assert_work_log_state();

create constraint trigger work_log_entries_assert_state
after insert or update on public.work_log_entries
deferrable initially deferred
for each row execute function private.assert_work_log_state();

create function private.reject_client_history_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception using errcode = '42501', message = 'history is append-only';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger admin_audit_events_append_only
before update or delete on public.admin_audit_events
for each row execute function private.reject_client_history_change();
create trigger work_item_status_history_append_only
before update or delete on public.work_item_status_history
for each row execute function private.reject_client_history_change();
create trigger work_item_events_append_only
before update or delete on public.work_item_events
for each row execute function private.reject_client_history_change();
create trigger comment_revisions_append_only
before update or delete on public.comment_revisions
for each row execute function private.reject_client_history_change();
create trigger work_log_batch_revisions_append_only
before update or delete on public.work_log_batch_revisions
for each row execute function private.reject_client_history_change();
create trigger work_log_entry_revisions_append_only
before update or delete on public.work_log_entry_revisions
for each row execute function private.reject_client_history_change();

create function private.normalize_notification_read()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    if old.read_at is not null then
      new.read_at := old.read_at;
    else
      new.read_at := statement_timestamp();
    end if;
  end if;

  return new;
end;
$$;

create trigger notifications_normalize_read
before update of read_at on public.notifications
for each row execute function private.normalize_notification_read();

create view public.team_directory
with (security_invoker = true)
as
select
  profile.id,
  profile.display_name,
  profile.position_code,
  profile.is_admin,
  profile.current_reports_to_id
from public.profiles profile
where profile.is_active;

create view public.visible_comments
with (security_barrier = true)
as
select
  comment.id,
  comment.work_item_id,
  comment.author_id,
  case when comment.withdrawn_at is null then comment.body else null end as body,
  comment.created_at,
  comment.edited_at,
  comment.withdrawn_at,
  comment.withdrawn_by
from public.comments comment
where private.is_application_user();

create view public.valid_work_log_entries
with (security_barrier = true)
as
select
  entry.id,
  entry.batch_id,
  batch.context_code,
  batch.work_item_id,
  batch.related_area_id,
  batch.worked_by,
  batch.logged_by,
  entry.work_date,
  entry.work_type_code,
  entry.description,
  entry.position,
  batch.created_at as logged_at,
  greatest(batch.edited_at, entry.updated_at) as last_edited_at
from public.work_log_entries entry
join public.work_log_batches batch on batch.id = entry.batch_id
where private.is_application_user()
  and entry.withdrawn_at is null
  and batch.withdrawn_at is null;

create view public.current_work_item_contributors
with (security_barrier = true)
as
select distinct
  batch.work_item_id,
  batch.worked_by as profile_id
from public.work_log_batches batch
join public.work_log_entries entry on entry.batch_id = batch.id
left join public.work_item_assignments assignment
  on assignment.work_item_id = batch.work_item_id
  and assignment.started_on <= entry.work_date
  and (assignment.ended_on is null or entry.work_date < assignment.ended_on)
where batch.context_code = 'ticket'
  and private.is_application_user()
  and batch.withdrawn_at is null
  and entry.withdrawn_at is null
  and (
    assignment.assignee_id is null
    or assignment.assignee_id <> batch.worked_by
  );

create view public.work_item_active_work_days
with (security_barrier = true)
as
select
  batch.work_item_id,
  count(distinct entry.work_date)::integer as active_work_days
from public.work_log_batches batch
join public.work_log_entries entry on entry.batch_id = batch.id
where batch.context_code = 'ticket'
  and private.is_application_user()
  and batch.withdrawn_at is null
  and entry.withdrawn_at is null
group by batch.work_item_id;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'position_definitions',
    'work_item_statuses',
    'work_item_status_transitions',
    'work_type_definitions',
    'product_policy_versions',
    'admin_audit_event_types',
    'work_item_event_types',
    'notification_type_definitions',
    'profiles',
    'operation_requests',
    'profile_access_periods',
    'reporting_line_assignments',
    'team_settings',
    'bootstrap_state',
    'admin_audit_events',
    'work_areas',
    'labels',
    'work_items',
    'work_item_assignments',
    'work_item_status_history',
    'work_item_events',
    'work_item_labels',
    'subtasks',
    'comments',
    'comment_revisions',
    'blockers',
    'work_log_batches',
    'work_log_entries',
    'work_log_batch_revisions',
    'work_log_entry_revisions',
    'notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end;
$$;

create policy reference_read on public.position_definitions
  for select to authenticated using (private.is_application_user());
create policy reference_read on public.work_item_statuses
  for select to authenticated using (private.is_application_user());
create policy reference_read on public.work_item_status_transitions
  for select to authenticated using (private.is_application_user());
create policy reference_read on public.work_type_definitions
  for select to authenticated using (private.is_application_user());
create policy reference_read on public.product_policy_versions
  for select to authenticated using (private.is_application_user());
create policy reference_read on public.work_item_event_types
  for select to authenticated using (private.is_application_user());
create policy reference_read on public.notification_type_definitions
  for select to authenticated using (private.is_application_user());

create policy profile_read on public.profiles
  for select to authenticated
  using (
    (id = auth.uid() and is_active)
    or (private.is_application_user() and is_active)
    or private.current_is_admin()
  );

create policy normal_read on public.profile_access_periods
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.reporting_line_assignments
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.team_settings
  for select to authenticated using (private.is_application_user());
create policy admin_read on public.admin_audit_events
  for select to authenticated using (private.can_manage_settings());
create policy normal_read on public.work_areas
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.labels
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.work_items
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.work_item_assignments
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.work_item_status_history
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.work_item_events
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.work_item_labels
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.subtasks
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.comments
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.blockers
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.work_log_batches
  for select to authenticated using (private.is_application_user());
create policy normal_read on public.work_log_entries
  for select to authenticated using (private.is_application_user());

create policy recipient_read on public.notifications
  for select to authenticated
  using (private.is_application_user() and recipient_id = auth.uid());
create policy recipient_mark_read on public.notifications
  for update to authenticated
  using (private.is_application_user() and recipient_id = auth.uid())
  with check (private.is_application_user() and recipient_id = auth.uid());

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on
  public.position_definitions,
  public.work_item_statuses,
  public.work_item_status_transitions,
  public.work_type_definitions,
  public.product_policy_versions,
  public.work_item_event_types,
  public.notification_type_definitions,
  public.profile_access_periods,
  public.reporting_line_assignments,
  public.team_settings,
  public.admin_audit_events,
  public.work_areas,
  public.labels,
  public.work_items,
  public.work_item_assignments,
  public.work_item_status_history,
  public.work_item_events,
  public.work_item_labels,
  public.subtasks,
  public.blockers,
  public.notifications
to authenticated;

grant select (
  id,
  display_name,
  position_code,
  is_admin,
  is_active,
  current_reports_to_id,
  created_at,
  updated_at
) on public.profiles to authenticated;

grant update (read_at) on public.notifications to authenticated;

grant select on
  public.team_directory,
  public.visible_comments,
  public.valid_work_log_entries,
  public.current_work_item_contributors,
  public.work_item_active_work_days
to authenticated;

revoke execute on all functions in schema private from public, anon;

commit;
