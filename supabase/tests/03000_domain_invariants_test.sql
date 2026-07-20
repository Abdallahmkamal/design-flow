begin;

select plan(37);

set constraints all immediate;

insert into public.operation_requests (
  id,
  operation_code,
  actor_id,
  request_hash,
  state,
  result,
  completed_at
)
values (
  '80000000-0000-4000-8000-000000000001',
  'domain_invariant_test_fixture',
  '10000000-0000-4000-8000-000000000007',
  encode(
    extensions.digest(
      '80000000-0000-4000-8000-000000000001',
      'sha256'
    ),
    'hex'
  ),
  'completed',
  '{"synthetic": true}'::jsonb,
  statement_timestamp()
);

select is(
  (
    select count(*)::integer
    from public.profiles profile
    left join public.profile_access_periods access_period
      on access_period.profile_id = profile.id
      and access_period.ended_at is null
    where access_period.id is null
      or access_period.position_code <> profile.position_code
      or access_period.is_admin <> profile.is_admin
      or access_period.is_active <> profile.is_active
  ),
  0,
  'current profile snapshots agree with their open access periods'
);

select is(
  (
    select count(*)::integer
    from public.profiles profile
    left join public.reporting_line_assignments reporting_line
      on reporting_line.person_id = profile.id
      and reporting_line.ended_on is null
    where (
      profile.is_active
      and profile.position_code in ('designer', 'lead')
      and reporting_line.supervisor_id is distinct from profile.current_reports_to_id
    )
    or (
      (
        not profile.is_active
        or profile.position_code in ('viewer', 'manager')
      )
      and (
        profile.current_reports_to_id is not null
        or reporting_line.id is not null
      )
    )
  ),
  0,
  'current reporting caches agree with effective-dated reporting lines'
);

select throws_ok(
  $$
    update public.profiles
    set created_by = null
    where id = '10000000-0000-4000-8000-000000000001'
  $$,
  '23514',
  null,
  'created_by can be null only for the first bootstrap profile'
);

select throws_ok(
  $$
    insert into public.profile_access_periods (
      profile_id,
      position_code,
      is_admin,
      is_active,
      started_at,
      ended_at,
      changed_by,
      start_operation_id,
      end_operation_id
    )
    values (
      '10000000-0000-4000-8000-000000000002',
      'designer',
      false,
      true,
      '2026-01-10 09:00:00+00',
      '2026-02-10 09:00:00+00',
      '10000000-0000-4000-8000-000000000007',
      '80000000-0000-4000-8000-000000000001',
      '80000000-0000-4000-8000-000000000001'
    )
  $$,
  '23P01',
  null,
  'profile access periods cannot overlap'
);

select throws_ok(
  $$
    insert into public.reporting_line_assignments (
      person_id,
      supervisor_id,
      started_on,
      ended_on,
      assigned_by,
      start_operation_id,
      end_operation_id
    )
    values (
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000004',
      '2026-01-10',
      '2026-02-10',
      '10000000-0000-4000-8000-000000000007',
      '80000000-0000-4000-8000-000000000001',
      '80000000-0000-4000-8000-000000000001'
    )
  $$,
  '23P01',
  null,
  'reporting-line date ranges cannot overlap'
);

select throws_ok(
  $$
    insert into public.work_items (
      title,
      area_id,
      status_code,
      created_by
    )
    values (
      '[SYNTHETIC TEST] Missing active assignee',
      '50000000-0000-4000-8000-000000000001',
      'todo',
      '10000000-0000-4000-8000-000000000007'
    )
  $$,
  '23514',
  null,
  'an active status cannot commit without a primary assignee'
);

select throws_ok(
  $$
    insert into public.work_items (
      title,
      area_id,
      status_code,
      primary_assignee_id,
      created_by
    )
    values (
      '[SYNTHETIC TEST] Viewer assignment',
      '50000000-0000-4000-8000-000000000001',
      'todo',
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000007'
    )
  $$,
  '23514',
  null,
  'Viewer is not eligible for primary assignment'
);

with inserted_item as (
  insert into public.work_items (
    id,
    title,
    area_id,
    status_code,
    primary_assignee_id,
    created_by
  )
  values (
    '80000000-0000-4000-8000-000000000010',
    '[SYNTHETIC TEST] Valid active Work Item',
    '50000000-0000-4000-8000-000000000001',
    'todo',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000007'
  )
  returning id
)
insert into public.work_item_assignments (
  id,
  work_item_id,
  assignee_id,
  started_at,
  started_on,
  assigned_by,
  start_operation_id
)
select
  '80000000-0000-4000-8000-000000000011',
  inserted_item.id,
  '10000000-0000-4000-8000-000000000002',
  statement_timestamp(),
  private.current_team_date(),
  '10000000-0000-4000-8000-000000000007',
  '80000000-0000-4000-8000-000000000001'
from inserted_item;

select is(
  (
    select count(*)::integer
    from public.work_items item
    join public.work_item_assignments assignment
      on assignment.work_item_id = item.id
      and assignment.ended_at is null
      and assignment.assignee_id = item.primary_assignee_id
    where item.id = '80000000-0000-4000-8000-000000000010'
  ),
  1,
  'an active Work Item commits with one matching open assignment'
);

select throws_ok(
  $$
    insert into public.work_item_assignments (
      work_item_id,
      assignee_id,
      started_at,
      started_on,
      assigned_by,
      start_operation_id
    )
    values (
      '80000000-0000-4000-8000-000000000010',
      '10000000-0000-4000-8000-000000000003',
      statement_timestamp() + interval '1 second',
      private.current_team_date(),
      '10000000-0000-4000-8000-000000000007',
      '80000000-0000-4000-8000-000000000001'
    )
  $$,
  '23505',
  null,
  'a Work Item cannot have two open assignments'
);

select throws_ok(
  $$
    update public.work_items
    set
      archived_by = '10000000-0000-4000-8000-000000000007',
      archived_at = statement_timestamp()
    where id = '80000000-0000-4000-8000-000000000010'
  $$,
  '23514',
  null,
  'an active-status Work Item cannot be archived'
);

insert into public.blockers (
  id,
  work_item_id,
  reason,
  blocked_by,
  create_operation_id
)
values (
  '80000000-0000-4000-8000-000000000012',
  '80000000-0000-4000-8000-000000000010',
  '[SYNTHETIC TEST] Waiting for review input',
  '10000000-0000-4000-8000-000000000002',
  '80000000-0000-4000-8000-000000000001'
);

select is(
  (
    select count(*)::integer
    from public.blockers
    where work_item_id = '80000000-0000-4000-8000-000000000010'
      and resolved_at is null
  ),
  1,
  'one active blocker is valid on an active-status Work Item'
);

select throws_ok(
  $$
    update public.work_items
    set status_code = 'paused'
    where id = '80000000-0000-4000-8000-000000000010'
  $$,
  '23514',
  null,
  'a Work Item with an active blocker cannot leave the active bucket'
);

insert into public.work_items (
  id,
  title,
  area_id,
  status_code,
  created_by
)
values (
  '80000000-0000-4000-8000-000000000020',
  '[SYNTHETIC TEST] Backlog blocker target',
  '50000000-0000-4000-8000-000000000001',
  'backlog',
  '10000000-0000-4000-8000-000000000007'
);

select throws_ok(
  $$
    insert into public.blockers (
      work_item_id,
      reason,
      blocked_by,
      create_operation_id
    )
    values (
      '80000000-0000-4000-8000-000000000020',
      '[SYNTHETIC TEST] Invalid backlog blocker',
      '10000000-0000-4000-8000-000000000002',
      '80000000-0000-4000-8000-000000000001'
    )
  $$,
  '23514',
  null,
  'an active blocker cannot be created outside an active status'
);

select throws_ok(
  $$
    with inserted_batch as (
      insert into public.work_log_batches (
        id,
        context_code,
        related_area_id,
        worked_by,
        logged_by,
        create_operation_id
      )
      values (
        '80000000-0000-4000-8000-000000000030',
        'standalone_visual',
        '50000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000004',
        '80000000-0000-4000-8000-000000000001'
      )
      returning id
    )
    insert into public.work_log_entries (
      batch_id,
      work_date,
      work_type_code,
      position
    )
    select
      inserted_batch.id,
      private.current_team_date(),
      'new_visual_asset',
      1
    from inserted_batch
  $$,
  '23514',
  null,
  'Viewer cannot be the worked_by subject'
);

select throws_ok(
  $$
    with inserted_batch as (
      insert into public.work_log_batches (
        id,
        context_code,
        related_area_id,
        worked_by,
        logged_by,
        create_operation_id
      )
      values (
        '80000000-0000-4000-8000-000000000034',
        'standalone_visual',
        '50000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000009',
        '80000000-0000-4000-8000-000000000001'
      )
      returning id
    )
    insert into public.work_log_entries (
      batch_id,
      work_date,
      work_type_code,
      position
    )
    select
      inserted_batch.id,
      private.current_team_date(),
      'new_visual_asset',
      1
    from inserted_batch
  $$,
  '23514',
  null,
  'a password-restricted profile cannot be the logging actor'
);

select throws_ok(
  $$
    insert into public.work_log_batches (
      context_code,
      related_area_id,
      worked_by,
      logged_by,
      create_operation_id
    )
    values (
      'standalone_visual',
      '50000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000002',
      '80000000-0000-4000-8000-000000000001'
    )
  $$,
  '23514',
  null,
  'an active work-log batch cannot contain zero entries'
);

select throws_ok(
  $$
    with inserted_batch as (
      insert into public.work_log_batches (
        id,
        context_code,
        related_area_id,
        worked_by,
        logged_by,
        create_operation_id
      )
      values (
        '80000000-0000-4000-8000-000000000031',
        'standalone_visual',
        '50000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000002',
        '80000000-0000-4000-8000-000000000001'
      )
      returning id
    )
    insert into public.work_log_entries (
      batch_id,
      work_date,
      work_type_code,
      position
    )
    select
      inserted_batch.id,
      private.current_team_date(),
      'new_visual_asset',
      6
    from inserted_batch
  $$,
  '23514',
  null,
  'a work-log batch cannot exceed the five-entry position range'
);

select throws_ok(
  $$
    with inserted_batch as (
      insert into public.work_log_batches (
        id,
        context_code,
        related_area_id,
        worked_by,
        logged_by,
        create_operation_id
      )
      values (
        '80000000-0000-4000-8000-000000000032',
        'standalone_visual',
        '50000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000002',
        '80000000-0000-4000-8000-000000000001'
      )
      returning id
    )
    insert into public.work_log_entries (
      batch_id,
      work_date,
      work_type_code,
      position
    )
    select
      inserted_batch.id,
      private.current_team_date(),
      'planning_alignment',
      1
    from inserted_batch
  $$,
  '23514',
  null,
  'work type context must match its batch context'
);

select throws_ok(
  $$
    with inserted_batch as (
      insert into public.work_log_batches (
        id,
        context_code,
        related_area_id,
        worked_by,
        logged_by,
        create_operation_id
      )
      values (
        '80000000-0000-4000-8000-000000000033',
        'standalone_visual',
        '50000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000002',
        '80000000-0000-4000-8000-000000000001'
      )
      returning id
    )
    insert into public.work_log_entries (
      batch_id,
      work_date,
      work_type_code,
      position
    )
    select
      inserted_batch.id,
      private.current_team_date() + 1,
      'new_visual_asset',
      1
    from inserted_batch
  $$,
  '23514',
  null,
  'future work dates are rejected in the team timezone'
);

with inserted_item as (
  insert into public.work_items (
    id,
    title,
    area_id,
    status_code,
    primary_assignee_id,
    created_by
  )
  values (
    '80000000-0000-4000-8000-000000000040',
    '[SYNTHETIC TEST] Same-day reassignment',
    '50000000-0000-4000-8000-000000000001',
    'in_progress',
    '10000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000007'
  )
  returning id
),
closed_assignment as (
  insert into public.work_item_assignments (
    id,
    work_item_id,
    assignee_id,
    started_at,
    ended_at,
    started_on,
    ended_on,
    assigned_by,
    start_operation_id,
    end_operation_id
  )
  select
    '80000000-0000-4000-8000-000000000041',
    inserted_item.id,
    '10000000-0000-4000-8000-000000000002',
    statement_timestamp() - interval '10 days',
    statement_timestamp(),
    private.current_team_date() - 10,
    private.current_team_date(),
    '10000000-0000-4000-8000-000000000007',
    '80000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000001'
  from inserted_item
  returning work_item_id
)
insert into public.work_item_assignments (
  id,
  work_item_id,
  assignee_id,
  started_at,
  started_on,
  assigned_by,
  start_operation_id
)
select
  '80000000-0000-4000-8000-000000000042',
  closed_assignment.work_item_id,
  '10000000-0000-4000-8000-000000000003',
  statement_timestamp(),
  private.current_team_date(),
  '10000000-0000-4000-8000-000000000007',
  '80000000-0000-4000-8000-000000000001'
from closed_assignment;

with inserted_batch as (
  insert into public.work_log_batches (
    id,
    context_code,
    work_item_id,
    worked_by,
    logged_by,
    create_operation_id
  )
  values
    (
      '80000000-0000-4000-8000-000000000043',
      'ticket',
      '80000000-0000-4000-8000-000000000040',
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000002',
      '80000000-0000-4000-8000-000000000001'
    ),
    (
      '80000000-0000-4000-8000-000000000044',
      'ticket',
      '80000000-0000-4000-8000-000000000040',
      '10000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000003',
      '80000000-0000-4000-8000-000000000001'
    )
  returning id
)
insert into public.work_log_entries (
  batch_id,
  work_date,
  work_type_code,
  position
)
select
  inserted_batch.id,
  private.current_team_date(),
  'ui_visual_design',
  1
from inserted_batch;

select is(
  (
    select count(*)::integer
    from public.work_log_entries entry
    join public.work_log_batches batch on batch.id = entry.batch_id
    where batch.work_item_id = '80000000-0000-4000-8000-000000000040'
  ),
  2,
  'valid same-day ticket work entries commit'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_eq(
  $$
    select profile_id
    from public.current_work_item_contributors
    where work_item_id = '80000000-0000-4000-8000-000000000040'
  $$,
  array['10000000-0000-4000-8000-000000000002'::uuid],
  'the final same-day assignment owns assignment credit and the former assignee is a contributor'
);

select is(
  (
    select active_work_days
    from public.work_item_active_work_days
    where work_item_id = '80000000-0000-4000-8000-000000000040'
  ),
  1,
  'multiple same-date entries count as one active work day'
);

select is(
  (
    select count(*)::integer
    from public.valid_work_log_entries
    where work_item_id = '80000000-0000-4000-8000-000000000040'
  ),
  2,
  'the valid-work read surface includes both active entries'
);

select throws_ok(
  $$select count(*) from public.work_log_batches$$,
  '42501',
  null,
  'the browser cannot read withdrawn-capable work-log batches directly'
);

select throws_ok(
  $$select count(*) from public.work_log_entries$$,
  '42501',
  null,
  'the browser cannot read withdrawn-capable work-log entries directly'
);

reset role;

insert into public.work_item_labels (
  work_item_id,
  label_id,
  applied_by,
  apply_operation_id
)
values (
  '80000000-0000-4000-8000-000000000020',
  '60000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000007',
  '80000000-0000-4000-8000-000000000001'
);

select throws_ok(
  $$
    insert into public.work_item_labels (
      work_item_id,
      label_id,
      applied_by,
      apply_operation_id
    )
    values (
      '80000000-0000-4000-8000-000000000020',
      '60000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000007',
      '80000000-0000-4000-8000-000000000001'
    )
  $$,
  '23505',
  null,
  'a Work Item cannot have the same current label twice'
);

insert into public.subtasks (
  work_item_id,
  title,
  position,
  created_by
)
values (
  '80000000-0000-4000-8000-000000000020',
  '[SYNTHETIC TEST] First active subtask',
  1,
  '10000000-0000-4000-8000-000000000002'
);

select throws_ok(
  $$
    insert into public.subtasks (
      work_item_id,
      title,
      position,
      created_by
    )
    values (
      '80000000-0000-4000-8000-000000000020',
      '[SYNTHETIC TEST] Duplicate active position',
      1,
      '10000000-0000-4000-8000-000000000002'
    )
  $$,
  '23505',
  null,
  'active subtask positions are unique per Work Item'
);

select throws_ok(
  $$
    insert into public.product_policy_versions (
      version,
      effective_from,
      effective_to,
      week_starts_on,
      working_days,
      stale_after_working_days,
      due_soon_working_days,
      max_work_log_entries
    )
    values (
      2,
      '2026-06-01 00:00:00+00',
      '2026-12-01 00:00:00+00',
      0,
      array[0, 1, 2, 3, 4]::smallint[],
      5,
      5,
      5
    )
  $$,
  '23P01',
  null,
  'product policy effective periods cannot overlap'
);

select throws_ok(
  $$
    insert into public.work_items (
      title,
      area_id,
      figma_url,
      created_by
    )
    values (
      '[SYNTHETIC TEST] Invalid Figma URL',
      '50000000-0000-4000-8000-000000000001',
      'https://example.invalid/not-figma',
      '10000000-0000-4000-8000-000000000007'
    )
  $$,
  '23514',
  null,
  'only Figma URLs can be stored in the Figma field'
);

insert into public.work_item_status_history (
  id,
  work_item_id,
  from_status_code,
  to_status_code,
  changed_by,
  changed_on,
  operation_id
)
values (
  '80000000-0000-4000-8000-000000000050',
  '80000000-0000-4000-8000-000000000010',
  'backlog',
  'todo',
  '10000000-0000-4000-8000-000000000007',
  private.current_team_date(),
  '80000000-0000-4000-8000-000000000001'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select throws_ok(
  $$
    update public.work_item_status_history
    set changed_on = changed_on - 1
    where id = '80000000-0000-4000-8000-000000000050'
  $$,
  '42501',
  null,
  'authenticated clients cannot update append-only status history'
);

select throws_ok(
  $$
    delete from public.work_item_status_history
    where id = '80000000-0000-4000-8000-000000000050'
  $$,
  '42501',
  null,
  'authenticated clients cannot delete append-only status history'
);

reset role;

select throws_ok(
  $$
    insert into public.operation_requests (
      id,
      operation_code,
      actor_id,
      request_hash,
      state
    )
    values (
      '80000000-0000-4000-8000-000000000060',
      'invalid_hash',
      '10000000-0000-4000-8000-000000000007',
      'not-a-sha-256-hash',
      'started'
    )
  $$,
  '23514',
  null,
  'operation request hashes must be canonical SHA-256 hex'
);

select throws_ok(
  $$
    insert into public.operation_requests (
      id,
      operation_code,
      actor_id,
      request_hash,
      state
    )
    values (
      '80000000-0000-4000-8000-000000000061',
      'not_bootstrap',
      null,
      encode(
        extensions.digest(
          '80000000-0000-4000-8000-000000000061',
          'sha256'
        ),
        'hex'
      ),
      'started'
    )
  $$,
  '23514',
  null,
  'only the first-bootstrap operation may omit its actor'
);

select throws_ok(
  $$
    insert into public.admin_audit_events (
      event_type_code,
      actor_id,
      subject_type,
      subject_id,
      operation_id
    )
    values (
      'team_timezone_changed',
      null,
      'team_settings',
      null,
      '80000000-0000-4000-8000-000000000001'
    )
  $$,
  '23514',
  null,
  'only the bootstrap audit event may omit its actor'
);

select throws_ok(
  $$
    insert into public.admin_audit_events (
      event_type_code,
      actor_id,
      subject_type,
      subject_id,
      operation_id
    )
    values (
      'account_created',
      '10000000-0000-4000-8000-000000000007',
      'profile',
      null,
      '80000000-0000-4000-8000-000000000001'
    )
  $$,
  '23514',
  null,
  'non-singleton audit subjects require a subject ID'
);

insert into public.work_item_events (
  id,
  work_item_id,
  event_type_code,
  actor_id,
  subject_type,
  operation_id
)
values (
  '80000000-0000-4000-8000-000000000070',
  '80000000-0000-4000-8000-000000000020',
  'comment_added',
  '10000000-0000-4000-8000-000000000002',
  'comment',
  '80000000-0000-4000-8000-000000000001'
);

select throws_ok(
  $$
    insert into public.notifications (
      recipient_id,
      actor_id,
      work_item_id,
      source_event_id,
      notification_type_code
    )
    values (
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000002',
      '80000000-0000-4000-8000-000000000020',
      '80000000-0000-4000-8000-000000000070',
      'comment_added'
    )
  $$,
  '23514',
  null,
  'self-events cannot create notifications'
);

select throws_ok(
  $$
    insert into public.work_items (
      title,
      area_id,
      planned_start_date,
      due_date,
      created_by
    )
    values (
      '[SYNTHETIC TEST] Invalid planned dates',
      '50000000-0000-4000-8000-000000000001',
      '2026-07-20',
      '2026-07-19',
      '10000000-0000-4000-8000-000000000007'
    )
  $$,
  '23514',
  null,
  'due date cannot precede planned start date'
);

select * from finish();

rollback;
