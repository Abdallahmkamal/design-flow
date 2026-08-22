begin;

select plan(18);
select set_config('design_flow.slice1_today', private.current_team_date()::text, true);

select ok(private.is_working_day(date '2026-08-20'), 'Thursday is a working day');
select ok(not private.is_working_day(date '2026-08-21'), 'Friday is not a working day');
select ok(not private.is_working_day(date '2026-08-22'), 'Saturday is not a working day');
select ok(private.is_working_day(date '2026-08-23'), 'Sunday is a working day');
select is(private.count_working_days(date '2026-08-20', date '2026-08-23'), 1, 'Days Open crosses the Friday/Saturday boundary once');

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;

select set_config('design_flow.slice1_metric', (
  public.create_work_item(
    '[SYNTHETIC TEST] Slice 1 metrics', null,
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    date '2026-08-16', date '2026-08-30', null, array[]::uuid[],
    '92000000-0000-4000-8000-000000000001'
  ) ->> 'id'
), true);

select lives_ok(
  $$ select public.submit_work_log(
    'ticket', current_setting('design_flow.slice1_metric')::uuid, null,
    '10000000-0000-4000-8000-000000000003',
    jsonb_build_array(
      jsonb_build_object('work_date', date '2026-08-20', 'work_type_code', 'ui_visual_design'),
      jsonb_build_object('work_date', date '2026-08-21', 'work_type_code', 'ui_visual_design'),
      jsonb_build_object('work_date', date '2026-08-22', 'work_type_code', 'ui_visual_design')
    ), null, '92000000-0000-4000-8000-000000000002'
  ) $$,
  'weekday and weekend work logs remain valid and visible'
);

reset role;

select is(
  private.work_item_days_active(current_setting('design_flow.slice1_metric')::uuid, date '2026-08-22'),
  1,
  'Days Active excludes Friday and Saturday while retaining their logs'
);
select is(
  (select count(*)::integer from public.valid_work_log_entries where work_item_id = current_setting('design_flow.slice1_metric')::uuid),
  3,
  'weekend work remains visible in valid detail history'
);
select is(
  private.work_item_days_open(current_setting('design_flow.slice1_metric')::uuid, date '2026-08-20'),
  4,
  'Days Open starts after planned Start Date and counts Sunday through Thursday'
);

reset role;
insert into public.operation_requests (id, operation_code, actor_id, request_hash, state, result, completed_at)
select id, 'slice_1_status_fixture', '10000000-0000-4000-8000-000000000003', repeat('a', 64), 'completed', '{}'::jsonb, statement_timestamp()
from unnest(array[
  '92000000-0000-4000-8000-000000000011'::uuid,
  '92000000-0000-4000-8000-000000000012'::uuid,
  '92000000-0000-4000-8000-000000000013'::uuid,
  '92000000-0000-4000-8000-000000000014'::uuid,
  '92000000-0000-4000-8000-000000000015'::uuid
]) id;
insert into public.work_item_status_history (
  work_item_id, from_status_code, to_status_code, changed_by,
  changed_at, changed_on, operation_id
) values
  (current_setting('design_flow.slice1_metric')::uuid, 'backlog', 'todo', '10000000-0000-4000-8000-000000000003', '2026-08-17 07:00:00+00', '2026-08-17', '92000000-0000-4000-8000-000000000011'),
  (current_setting('design_flow.slice1_metric')::uuid, 'todo', 'in_progress', '10000000-0000-4000-8000-000000000003', '2026-08-17 15:00:00+00', '2026-08-17', '92000000-0000-4000-8000-000000000012'),
  (current_setting('design_flow.slice1_metric')::uuid, 'in_progress', 'in_review', '10000000-0000-4000-8000-000000000003', '2026-08-18 15:00:00+00', '2026-08-18', '92000000-0000-4000-8000-000000000013'),
  (current_setting('design_flow.slice1_metric')::uuid, 'in_review', 'done', '10000000-0000-4000-8000-000000000003', '2026-08-19 15:00:00+00', '2026-08-19', '92000000-0000-4000-8000-000000000014'),
  (current_setting('design_flow.slice1_metric')::uuid, 'done', 'in_progress', '10000000-0000-4000-8000-000000000003', '2026-08-20 15:00:00+00', '2026-08-20', '92000000-0000-4000-8000-000000000015');

select is((private.work_item_status_durations(current_setting('design_flow.slice1_metric')::uuid, date '2026-08-20')->>'todoDays')::integer, 0, 'same-day To Do loses ownership to the final status');
select is((private.work_item_status_durations(current_setting('design_flow.slice1_metric')::uuid, date '2026-08-20')->>'inProgressDays')::integer, 2, 'repeated In Progress periods accumulate with end-of-day ownership');
select is((private.work_item_status_durations(current_setting('design_flow.slice1_metric')::uuid, date '2026-08-20')->>'reviewDays')::integer, 1, 'Review owns its end-of-day working date');
select is((private.work_item_status_durations(current_setting('design_flow.slice1_metric')::uuid, date '2026-08-20')->>'pausedDays')::integer, 0, 'unvisited duration buckets remain zero');

set local role authenticated;
select set_config('design_flow.slice1_return', (
  public.create_work_item(
    '[SYNTHETIC TEST] Slice 1 review return', null,
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    date '2026-08-16', current_setting('design_flow.slice1_today')::date - 1, null, array[]::uuid[],
    '92000000-0000-4000-8000-000000000021'
  ) ->> 'id'
), true);
select public.transition_work_item_status(
  current_setting('design_flow.slice1_return')::uuid, 'in_review', 'backlog',
  (select updated_at from public.work_items where id = current_setting('design_flow.slice1_return')::uuid),
  false, '92000000-0000-4000-8000-000000000022'
);
select throws_ok(
  format(
    $$ select public.transition_work_item_status('%s', 'in_progress', 'in_review', '%s', false, '92000000-0000-4000-8000-000000000023') $$,
    current_setting('design_flow.slice1_return'),
    (select updated_at from public.work_items where id = current_setting('design_flow.slice1_return')::uuid)
  ),
  'P0001', 'DF_NEXT_DEADLINE_REQUIRED',
  'legacy review return cannot bypass the mandatory Next Deadline'
);
select lives_ok(
  format(
    $$ select public.transition_work_item_status('%s', 'in_progress', 'in_review', '%s', false, '92000000-0000-4000-8000-000000000024', '%s') $$,
    current_setting('design_flow.slice1_return'),
    (select updated_at from public.work_items where id = current_setting('design_flow.slice1_return')::uuid),
    current_setting('design_flow.slice1_today')::date + 5
  ),
  'review return stores status and a concrete new Next Deadline atomically'
);
select is(
  (select due_date from public.work_items where id = current_setting('design_flow.slice1_return')::uuid),
  current_setting('design_flow.slice1_today')::date + 5,
  'the new Next Deadline replaces the stale current value'
);
select is(
  (select previous_values ->> 'due_date' from public.work_item_events
   where operation_id = '92000000-0000-4000-8000-000000000024' and event_type_code = 'core_fields_changed'),
  (current_setting('design_flow.slice1_today')::date - 1)::text,
  'the prior deadline remains auditable'
);
reset role;
select ok(
  not private.work_item_is_overdue(current_setting('design_flow.slice1_return')::uuid, current_setting('design_flow.slice1_today')::date),
  'the returned ticket is not immediately overdue'
);

select * from finish();
rollback;
