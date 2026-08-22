begin;

select plan(33);

select is(private.count_working_days(null, date '2026-08-09'), null::integer, 'Days Open is absent without a Start Date');
select is(private.count_working_days(date '2026-08-09', date '2026-08-09'), 0, 'Days Open is zero when Start Date is today');
select is(private.count_working_days(date '2026-08-10', date '2026-08-09'), 0, 'Days Open never becomes negative for a future Start Date');
select is(private.count_working_days(date '2026-08-06', date '2026-08-09'), 1, 'Days Open excludes Friday and Saturday');
select is(private.count_working_days(date '2026-08-02', date '2026-08-09'), 5, 'Days Open counts Sunday through Thursday after the start date');
select set_config('design_flow.slice3_team_date', private.current_team_date()::text, true);
select set_config('design_flow.slice3_open7', private.count_working_days(private.current_team_date() - 7, private.current_team_date())::text, true);
select set_config('design_flow.slice3_done_days', private.count_working_days(date '2026-07-01', date '2026-07-09')::text, true);
select set_config('design_flow.slice3_reopened_days', private.count_working_days(date '2026-07-01', private.current_team_date())::text, true);

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;

select set_config('design_flow.slice3_core', (
  public.create_work_item(
    '[SYNTHETIC TEST] Slice 3 core', null,
    '50000000-0000-4000-8000-000000000001', null,
    current_setting('design_flow.slice3_team_date')::date - 7, null, null, array[]::uuid[],
    '91000000-0000-4000-8000-000000000001'
  ) ->> 'id'
), true);

select lives_ok(
  $$ select public.submit_work_log(
    'ticket', current_setting('design_flow.slice3_core')::uuid, null, null,
    jsonb_build_array(
      jsonb_build_object('work_date', current_setting('design_flow.slice3_team_date')::date - 2, 'work_type_code', 'ui_visual_design'),
      jsonb_build_object('work_date', current_setting('design_flow.slice3_team_date')::date - 2, 'work_type_code', 'prototyping_interaction'),
      jsonb_build_object('work_date', current_setting('design_flow.slice3_team_date')::date - 1, 'work_type_code', 'review_iteration')
    ), null, '91000000-0000-4000-8000-000000000002'
  ) $$,
  'multiple same-day and cross-day work logs can populate the read model'
);

select lives_ok(
  format(
    $$ select public.reassign_work_item('%s', '10000000-0000-4000-8000-000000000002', null, '%s', '91000000-0000-4000-8000-000000000003') $$,
    current_setting('design_flow.slice3_core'),
    (select updated_at from public.work_items where id = current_setting('design_flow.slice3_core')::uuid)
  ),
  'the contributor can subsequently become the primary assignee'
);

-- Keep synthetic statement timestamps monotonic on coarse/adjusting local clocks.
select pg_sleep(0.25);
select lives_ok(
  format(
    $$ select public.add_comment('%s', '[SYNTHETIC TEST] Latest meaningful activity', '91000000-0000-4000-8000-000000000004') $$,
    current_setting('design_flow.slice3_core')
  ),
  'a meaningful comment can become Last Activity'
);

select is(
  (select (row ->> 'daysActive')::integer from jsonb_array_elements(public.list_work_items(jsonb_build_object('search', 'Slice 3 core')) -> 'rows') row),
  1,
  'Days Active counts distinct Sunday-through-Thursday dates rather than entries'
);
select is(
  (public.list_work_items(jsonb_build_object('peopleIds', jsonb_build_array('10000000-0000-4000-8000-000000000002'))) ->> 'totalCount')::integer,
  1,
  'People matches the assignee/contributor union'
);
select is(
  jsonb_array_length(public.list_work_items(jsonb_build_object('peopleIds', jsonb_build_array('10000000-0000-4000-8000-000000000002'))) -> 'rows'),
  1,
  'a person matching both relationships never duplicates a ticket row'
);
select is(
  (select jsonb_array_length(row -> 'contributors') from jsonb_array_elements(public.list_work_items(jsonb_build_object('search', 'Slice 3 core')) -> 'rows') row),
  1,
  'the read model preserves the derived contributor separately from the assignee'
);
select is(
  (select row ->> 'lastActivityType' from jsonb_array_elements(public.list_work_items(jsonb_build_object('search', 'Slice 3 core')) -> 'rows') row),
  'comment_added',
  'Last Activity exposes the latest meaningful activity type'
);
select is(
  (select (row ->> 'lastActivityAt')::timestamptz from jsonb_array_elements(public.list_work_items(jsonb_build_object('search', 'Slice 3 core')) -> 'rows') row),
  (select last_activity_at from public.work_items where id = current_setting('design_flow.slice3_core')::uuid),
  'Last Activity uses the system activity timestamp, not a backdated work date'
);
select is(
  (public.list_work_items(jsonb_build_object(
    'daysActiveMin', 1, 'daysActiveMax', 1,
    'daysOpenMin', current_setting('design_flow.slice3_open7')::integer,
    'daysOpenMax', current_setting('design_flow.slice3_open7')::integer
  )) ->> 'totalCount')::integer,
  1,
  'calculated exact/range filters apply to the full result before pagination'
);

reset role;
update public.work_items set archived_by = '10000000-0000-4000-8000-000000000004', archived_at = statement_timestamp()
where id = current_setting('design_flow.slice3_core')::uuid;
set local role authenticated;
select is((public.list_work_items(jsonb_build_object('search', 'Slice 3 core')) ->> 'totalCount')::integer, 0, 'default visibility excludes archived tickets');
select is((public.list_work_items(jsonb_build_object('archivedOnly', true, 'search', 'Slice 3 core')) ->> 'totalCount')::integer, 1, 'Archived only switches exclusively to archived tickets and combines with search');

select set_config('design_flow.slice3_done', (
  public.create_work_item('[SYNTHETIC TEST] Slice 3 done', null, '50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', date '2026-07-01', null, null, array[]::uuid[], '91000000-0000-4000-8000-000000000005') ->> 'id'
), true);
select set_config('design_flow.slice3_reopened', (
  public.create_work_item('[SYNTHETIC TEST] Slice 3 reopened', null, '50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', date '2026-07-01', null, null, array[]::uuid[], '91000000-0000-4000-8000-000000000006') ->> 'id'
), true);
select set_config('design_flow.slice3_missing', (
  public.create_work_item('[SYNTHETIC TEST] Slice 3 missing', null, '50000000-0000-4000-8000-000000000001', null, null, null, null, array[]::uuid[], '91000000-0000-4000-8000-000000000007') ->> 'id'
), true);
select set_config('design_flow.slice3_future', (
  public.create_work_item('[SYNTHETIC TEST] Slice 3 future', null, '50000000-0000-4000-8000-000000000001', null, current_setting('design_flow.slice3_team_date')::date + 5, null, null, array[]::uuid[], '91000000-0000-4000-8000-000000000008') ->> 'id'
), true);

reset role;
update public.work_items set status_code = 'done', completed_at = '2026-07-09 12:00:00+00'
where id = current_setting('design_flow.slice3_done')::uuid;
insert into public.work_item_status_history (work_item_id, from_status_code, to_status_code, changed_by, changed_at, changed_on, operation_id)
values (current_setting('design_flow.slice3_done')::uuid, 'in_review', 'done', '10000000-0000-4000-8000-000000000002', '2026-07-09 12:00:00+00', '2026-07-09', '91000000-0000-4000-8000-000000000005');
insert into public.work_item_status_history (work_item_id, from_status_code, to_status_code, changed_by, changed_at, changed_on, operation_id)
values
  (current_setting('design_flow.slice3_reopened')::uuid, 'in_review', 'done', '10000000-0000-4000-8000-000000000002', '2026-07-09 12:00:00+00', '2026-07-09', '91000000-0000-4000-8000-000000000006'),
  (current_setting('design_flow.slice3_reopened')::uuid, 'done', 'in_progress', '10000000-0000-4000-8000-000000000002', '2026-07-12 12:00:00+00', '2026-07-12', '91000000-0000-4000-8000-000000000006');
update public.work_items set status_code = 'in_progress', completed_at = '2026-07-09 12:00:00+00'
where id = current_setting('design_flow.slice3_reopened')::uuid;
set local role authenticated;

select is((select (row ->> 'daysOpen')::integer from jsonb_array_elements(public.list_work_items(jsonb_build_object('search', 'Slice 3 done')) -> 'rows') row), current_setting('design_flow.slice3_done_days')::integer, 'Done freezes Days Open on its Done date');
select is((select (row ->> 'daysOpen')::integer from jsonb_array_elements(public.list_work_items(jsonb_build_object('search', 'Slice 3 reopened')) -> 'rows') row), current_setting('design_flow.slice3_reopened_days')::integer, 'reopened tickets resume from the original Start Date');
select is((select row ->> 'daysOpen' from jsonb_array_elements(public.list_work_items(jsonb_build_object('search', 'Slice 3 missing')) -> 'rows') row), null::text, 'missing Start Date returns an em dash-ready null value');
select is((select (row ->> 'daysOpen')::integer from jsonb_array_elements(public.list_work_items(jsonb_build_object('search', 'Slice 3 future')) -> 'rows') row), 0, 'future Start Date returns zero in the list read model');

reset role;
insert into public.work_items (title, area_id, status_code, created_by)
select '[SYNTHETIC TEST] Slice 3 page tie', '50000000-0000-4000-8000-000000000001', case when number = 30 then 'done' else 'backlog' end, '10000000-0000-4000-8000-000000000002'
from generate_series(1, 30) number;
set local role authenticated;

select is((public.list_work_items(jsonb_build_object('search', 'Slice 3 page tie')) ->> 'totalCount')::integer, 30, 'exact total counts the full filtered result');
select is(jsonb_array_length(public.list_work_items(jsonb_build_object('search', 'Slice 3 page tie')) -> 'rows'), 25, 'desktop defaults to 25 rows after full filtering');
select is(jsonb_array_length(public.list_work_items(jsonb_build_object('search', 'Slice 3 page tie', 'pageSize', 50)) -> 'rows'), 30, 'desktop accepts a 50-row page size');
select is((public.list_work_items(jsonb_build_object('search', 'Slice 3 page tie', 'pageSize', 100)) ->> 'pageSize')::integer, 100, 'desktop accepts a 100-row page size');
select is((public.list_work_items(jsonb_build_object('search', 'Slice 3 page tie', 'statuses', jsonb_build_array('done'), 'page', 2)) ->> 'totalCount')::integer, 1, 'server filters and exact-counts before clamping pagination');
select is(
  (select string_agg(row ->> 'displayId', ',' order by ordinal) from jsonb_array_elements(public.list_work_items(jsonb_build_object('search', 'Slice 3 page tie', 'sort', 'ticket', 'direction', 'asc')) -> 'rows') with ordinality result(row, ordinal)),
  (select string_agg(display_id, ',' order by display_id) from (select display_id from public.work_items where title = '[SYNTHETIC TEST] Slice 3 page tie' order by display_id limit 25) expected),
  'equal sort values use stable display-ID ordering'
);
select throws_ok($$ select public.list_work_items('{"pageSize":30}'::jsonb) $$, 'P0001', 'DF_VALIDATION', 'unsupported server page sizes are rejected');
select throws_ok($$ select public.list_work_items('{"peopleIds":["not-a-uuid"]}'::jsonb) $$, 'P0001', 'DF_VALIDATION', 'malformed server filter identifiers use the stable validation error');
select is((public.list_work_items(jsonb_build_object('search', 'Slice 3 missing', 'unassignedOnly', true)) ->> 'totalCount')::integer, 1, 'Unassigned is a visible server-side refinement');
select throws_ok($$ select public.list_work_items('{"unassignedOnly":true,"peopleIds":["10000000-0000-4000-8000-000000000002"]}'::jsonb) $$, 'P0001', 'DF_VALIDATION', 'Unassigned rejects a contradictory People refinement');

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select is((public.list_work_items(jsonb_build_object('search', 'Slice 3 page tie')) ->> 'totalCount')::integer, 30, 'Viewer retains whole-team All Tickets visibility');

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000008', true);
set local role authenticated;
select throws_ok($$ select public.list_work_items('{}'::jsonb) $$, 'P0001', 'DF_ACCOUNT_INACTIVE', 'inactive accounts cannot use the All Tickets read model');

select * from finish();
rollback;
