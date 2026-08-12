begin;

select plan(31);

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000007', true);
set local role authenticated;

select set_config('design_flow.dashboard_d', (
  public.create_work_item(
    '[SYNTHETIC TEST] Designer active', null,
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002', null,
    (now() at time zone 'Africa/Cairo')::date, null, array[]::uuid[],
    '90000000-0000-4000-8000-000000000501'
  ) ->> 'id'
), true);
select public.transition_work_item_status(
  current_setting('design_flow.dashboard_d')::uuid, 'todo', 'backlog',
  (select updated_at from public.work_items where id = current_setting('design_flow.dashboard_d')::uuid),
  false, '90000000-0000-4000-8000-000000000502'
);

select set_config('design_flow.dashboard_da', (
  public.create_work_item(
    '[SYNTHETIC TEST] Designer Admin missing due', null,
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003', null,
    null, null, array[]::uuid[],
    '90000000-0000-4000-8000-000000000503'
  ) ->> 'id'
), true);
select public.transition_work_item_status(
  current_setting('design_flow.dashboard_da')::uuid, 'in_progress', 'backlog',
  (select updated_at from public.work_items where id = current_setting('design_flow.dashboard_da')::uuid),
  false, '90000000-0000-4000-8000-000000000504'
);

select set_config('design_flow.dashboard_lead', (
  public.create_work_item(
    '[SYNTHETIC TEST] Lead review waiting', null,
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000004', null,
    (now() at time zone 'Africa/Cairo')::date, null, array[]::uuid[],
    '90000000-0000-4000-8000-000000000505'
  ) ->> 'id'
), true);
select public.transition_work_item_status(
  current_setting('design_flow.dashboard_lead')::uuid, 'in_review', 'backlog',
  (select updated_at from public.work_items where id = current_setting('design_flow.dashboard_lead')::uuid),
  false, '90000000-0000-4000-8000-000000000506'
);

select public.submit_work_log(
  'ticket', current_setting('design_flow.dashboard_d')::uuid, null,
  '10000000-0000-4000-8000-000000000002',
  jsonb_build_array(jsonb_build_object(
    'work_date', (now() at time zone 'Africa/Cairo')::date,
    'work_type_code', 'ui_visual_design',
    'description', '[SYNTHETIC TEST] Dashboard ticket source'
  )), null, '90000000-0000-4000-8000-000000000507'
);
select public.submit_work_log(
  'standalone_visual', null, null,
  '10000000-0000-4000-8000-000000000003',
  jsonb_build_array(jsonb_build_object(
    'work_date', (now() at time zone 'Africa/Cairo')::date,
    'work_type_code', 'new_visual_asset',
    'description', '[SYNTHETIC TEST] Standalone Dashboard source'
  )), null, '90000000-0000-4000-8000-000000000508'
);

reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select is(public.get_dashboard()->>'defaultScopeKey', 'all', 'Viewer defaults to All');
select is((public.get_dashboard()->'cards'->>'active')::integer, 3, 'Viewer All reconciles three active tickets');
select throws_ok($$ select public.get_dashboard('me', null, null) $$, 'P0001', 'DF_FORBIDDEN', 'Viewer People scope is read-only at All');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select is(public.get_dashboard()->>'defaultScopeKey', 'me', 'Designer defaults to Me');
select is((public.get_dashboard()->'cards'->>'active')::integer, 1, 'Designer default reconciles own active ticket');
select is((select row->>'plannedUntil' from jsonb_array_elements(public.get_dashboard()->'workload') row where row->'person'->>'id' = auth.uid()::text), (now() at time zone 'Africa/Cairo')::date::text, 'Planned until uses the owned due date');
select throws_ok($$ select public.get_dashboard('all', null, null) $$, 'P0001', 'DF_FORBIDDEN', 'Designer without Admin cannot broaden people scope');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
select is(public.get_dashboard()->>'defaultScopeKey', 'all', 'Designer Admin defaults to All');
select is((public.get_dashboard()->'cards'->>'active')::integer, 3, 'Designer Admin default reconciles all active tickets');
select is((public.get_dashboard('all')->'cards'->>'active')::integer, 3, 'Designer Admin can deliberately select All');
select is((select (row->>'missingDueDateCount')::integer from jsonb_array_elements(public.get_dashboard('me')->'workload') row where row->'person'->>'id' = auth.uid()::text), 1, 'Missing due-date count is disclosed separately');
select is(jsonb_array_length(public.get_dashboard()->'recentVisualWork'), 1, 'Standalone visual work appears in its separate source list');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select is(public.get_dashboard()->>'defaultScopeKey', 'lead:10000000-0000-4000-8000-000000000004', 'Lead defaults to own reporting group');
select is((public.get_dashboard()->'cards'->>'active')::integer, 3, 'Lead group reconciles Lead and direct-report active tickets');
select is(jsonb_array_length(public.get_dashboard()->'recentTicketWork'), 1, 'Ticket recent work uses actual ticket work dates');
select is((public.get_dashboard('people', array['10000000-0000-4000-8000-000000000003'::uuid])->'cards'->>'active')::integer, 1, 'Lead can deliberately select a specific person');
select is((public.get_dashboard('all')->'cards'->>'active')::integer, 3, 'Lead can deliberately select All');
select is((public.get_dashboard('me')->'cards'->>'active')::integer, 1, 'Lead can deliberately select Me');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
set local role authenticated;
select is(public.get_dashboard()->>'defaultScopeKey', 'all', 'Lead Admin defaults to All');
select is((public.get_dashboard()->'cards'->>'active')::integer, 3, 'Lead Admin default reconciles all active tickets');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
set local role authenticated;
select is(public.get_dashboard()->>'defaultScopeKey', 'all', 'Manager defaults to All');
select is((public.get_dashboard()->'cards'->>'active')::integer, 3, 'Manager All reconciles active tickets');
select is((public.get_dashboard('manager:10000000-0000-4000-8000-000000000007')->'cards'->>'active')::integer, 0, 'Manager can deliberately select another Manager group');
select is((public.get_dashboard('me')->'cards'->>'active')::integer, 0, 'Manager can deliberately select Me');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000007', true);
set local role authenticated;
select is(public.get_dashboard()->>'defaultScopeKey', 'all', 'Manager Admin defaults to All');
select is((public.get_dashboard()->'cards'->>'active')::integer, 3, 'Manager Admin default reconciles all active tickets');
reset role;

insert into public.operation_requests (
  id, operation_code, actor_id, request_hash, state, result,
  created_at, updated_at, completed_at
) values (
  '90000000-0000-4000-8000-000000000509', 'synthetic_stale_boundary',
  '10000000-0000-4000-8000-000000000007', repeat('a', 64), 'completed', '{}'::jsonb,
  statement_timestamp(), statement_timestamp(), statement_timestamp()
);
select set_config('design_flow.dashboard_stale_basis', (
  select candidate::text
  from generate_series(private.current_team_date() - 10, private.current_team_date(), interval '1 day') candidate
  where private.add_working_days(candidate::date, 5) <= private.current_team_date()
  order by private.add_working_days(candidate::date, 5) desc, candidate desc limit 1
), true);
insert into public.work_items (
  id, title, area_id, status_code, primary_assignee_id, planned_start_date,
  created_by, created_at, updated_at, last_activity_at
) values (
  '70000000-0000-4000-8000-000000000509', '[SYNTHETIC TEST] Exact fifth-day stale boundary',
  '50000000-0000-4000-8000-000000000001', 'todo',
  '10000000-0000-4000-8000-000000000002',
  current_setting('design_flow.dashboard_stale_basis')::date,
  '10000000-0000-4000-8000-000000000007',
  current_setting('design_flow.dashboard_stale_basis')::date::timestamptz,
  current_setting('design_flow.dashboard_stale_basis')::date::timestamptz,
  current_setting('design_flow.dashboard_stale_basis')::date::timestamptz
);
insert into public.work_item_assignments (
  work_item_id, assignee_id, started_at, started_on, assigned_by, start_operation_id
) values (
  '70000000-0000-4000-8000-000000000509', '10000000-0000-4000-8000-000000000002',
  current_setting('design_flow.dashboard_stale_basis')::date::timestamptz,
  current_setting('design_flow.dashboard_stale_basis')::date,
  '10000000-0000-4000-8000-000000000007', '90000000-0000-4000-8000-000000000509'
);
insert into public.work_item_status_history (
  work_item_id, from_status_code, to_status_code, changed_by, changed_at,
  changed_on, operation_id
) values (
  '70000000-0000-4000-8000-000000000509', 'backlog', 'todo',
  '10000000-0000-4000-8000-000000000007',
  current_setting('design_flow.dashboard_stale_basis')::date::timestamptz,
  current_setting('design_flow.dashboard_stale_basis')::date,
  '90000000-0000-4000-8000-000000000509'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select is((public.get_dashboard()->'cards'->>'stale')::integer, 1, 'Dashboard remains stale on and after the fifth-working-day cutoff');
select is((public.list_work_items('{"peopleIds":["10000000-0000-4000-8000-000000000002"],"stale":"stale"}'::jsonb)->>'totalCount')::integer, 1, 'All Tickets uses the same fifth-working-day cutoff');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000008', true);
set local role authenticated;
select throws_ok($$ select public.get_dashboard() $$, 'P0001', 'DF_ACCOUNT_INACTIVE', 'Inactive account cannot read Dashboard');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000009', true);
set local role authenticated;
select throws_ok($$ select public.get_dashboard() $$, 'P0001', 'DF_PASSWORD_CHANGE_REQUIRED', 'Password-restricted account cannot read Dashboard');
reset role;

select is_empty('select 1 from public.profiles where position_code = ''viewer'' and is_admin', 'Viewer Admin remains rejected');

select * from finish();
rollback;
