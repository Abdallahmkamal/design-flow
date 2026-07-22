begin;

select plan(27);

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;

select set_config('design_flow.phase4_item', (
  public.create_work_item(
    '[SYNTHETIC TEST] Phase 4 work log', null,
    '50000000-0000-4000-8000-000000000001', null, null, null, null,
    array[]::uuid[], '90000000-0000-4000-8000-000000000401'
  ) ->> 'id'
), true);

select lives_ok(
  $$ select public.submit_work_log(
    'ticket', current_setting('design_flow.phase4_item')::uuid, null, null,
    '[{"work_date":"2026-07-21","work_type_code":"ui_visual_design","description":"[SYNTHETIC TEST] work"}]'::jsonb,
    null, '90000000-0000-4000-8000-000000000402'
  ) $$,
  'Designer can submit own ticket work through the RPC'
);

select is(
  (select last_worked_on from public.work_items where id = current_setting('design_flow.phase4_item')::uuid),
  date '2026-07-21',
  'submission calculates actual last-worked date without changing planned dates'
);

select is(
  (select count(*)::integer from public.valid_work_log_entries where work_item_id = current_setting('design_flow.phase4_item')::uuid),
  1, 'submission creates one active entry'
);

select is(
  (select count(*)::integer from public.work_item_events where work_item_id = current_setting('design_flow.phase4_item')::uuid and event_type_code = 'work_log_submitted'),
  1, 'submission creates one timeline event for the batch'
);

select is(
  (select count(*)::integer from jsonb_array_elements(public.get_work_item_detail((select display_id from public.work_items where id = current_setting('design_flow.phase4_item')::uuid))->'events') event where event->>'type' = 'work_log_submitted'),
  1, 'Work Item detail exposes the work-log submission event'
);

select lives_ok(
  $$ select public.submit_work_log(
    'ticket', current_setting('design_flow.phase4_item')::uuid, null, null,
    '[{"work_date":"2026-07-21","work_type_code":"ui_visual_design","description":"[SYNTHETIC TEST] work"}]'::jsonb,
    null, '90000000-0000-4000-8000-000000000402'
  ) $$,
  'same operation ID is idempotent'
);

reset role;
select is(
  (select count(*)::integer from public.work_log_batches where work_item_id = current_setting('design_flow.phase4_item')::uuid),
  1, 'idempotent retry creates no second batch'
);

set local role authenticated;

select throws_ok(
  $$ select public.submit_work_log('ticket', current_setting('design_flow.phase4_item')::uuid, null, null, '[{"work_date":"2099-01-01","work_type_code":"ui_visual_design"}]'::jsonb, null, '90000000-0000-4000-8000-000000000403') $$,
  'P0001', 'DF_VALIDATION', 'future actual dates are denied'
);

reset role;
select set_config('design_flow.phase4_batch', (select id::text from public.work_log_batches where work_item_id = current_setting('design_flow.phase4_item')::uuid), true);
select set_config('design_flow.phase4_batch_version', (select created_at::text from public.work_log_batches where id = current_setting('design_flow.phase4_batch')::uuid), true);
set local role authenticated;
select lives_ok(
  $$ select public.withdraw_work_log(current_setting('design_flow.phase4_batch')::uuid, current_setting('design_flow.phase4_batch_version')::timestamptz, '90000000-0000-4000-8000-000000000404') $$,
  'Designer can withdraw own-attributed batch'
);
select is((select last_worked_on from public.work_items where id = current_setting('design_flow.phase4_item')::uuid), null::date, 'withdrawal recalculates last-worked date');
select is((select count(*)::integer from public.valid_work_log_entries where work_item_id = current_setting('design_flow.phase4_item')::uuid), 0, 'withdrawal excludes work from normal reporting view');
select is(
  (select count(*)::integer from jsonb_array_elements(public.get_work_item_detail((select display_id from public.work_items where id = current_setting('design_flow.phase4_item')::uuid))->'events') event where event->>'type' = 'work_log_withdrawn'),
  1, 'Work Item detail exposes the work-log withdrawal event'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select throws_ok(
  $$ select public.submit_work_log('standalone_visual', null, null, null, '[{"work_date":"2026-07-21","work_type_code":"new_visual_asset"}]'::jsonb, null, '90000000-0000-4000-8000-000000000405') $$,
  'P0001', 'DF_FORBIDDEN', 'Viewer cannot submit work'
);
select throws_ok(
  $$ insert into public.work_log_batches (context_code, work_item_id, worked_by, logged_by, create_operation_id) values ('ticket', current_setting('design_flow.phase4_item')::uuid, auth.uid(), auth.uid(), gen_random_uuid()) $$,
  '42501', null, 'direct browser work-log writes remain denied'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select lives_ok(
  $$ select public.submit_work_log('standalone_visual', null, null, '10000000-0000-4000-8000-000000000002', '[{"work_date":"2026-07-19","work_type_code":"new_visual_asset"}]'::jsonb, null, '90000000-0000-4000-8000-000000000406') $$,
  'Lead can submit work on behalf of an eligible person'
);
reset role;
select is((select count(*)::integer from public.work_log_batches where context_code = 'standalone_visual'), 1, 'standalone work has no ticket lifecycle record');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select lives_ok(
  $$ select public.submit_work_log('ticket', current_setting('design_flow.phase4_item')::uuid, null, null, '[{"work_date":"2026-07-20","work_type_code":"ui_visual_design","description":"[SYNTHETIC TEST] initial"}]'::jsonb, null, '90000000-0000-4000-8000-000000000407') $$,
  'Designer can create a batch that is later corrected'
);
reset role;
select set_config('design_flow.phase4_correction_batch', (select id::text from public.work_log_batches where create_operation_id = '90000000-0000-4000-8000-000000000407'::uuid), true);
select set_config('design_flow.phase4_correction_version', (select created_at::text from public.work_log_batches where id = current_setting('design_flow.phase4_correction_batch')::uuid), true);
select set_config('design_flow.phase4_correction_entry', (select id::text from public.work_log_entries where batch_id = current_setting('design_flow.phase4_correction_batch')::uuid), true);
set local role authenticated;
select lives_ok(
  $$ select public.correct_work_log(current_setting('design_flow.phase4_correction_batch')::uuid, current_setting('design_flow.phase4_correction_version')::timestamptz, 'ticket', current_setting('design_flow.phase4_item')::uuid, null, '10000000-0000-4000-8000-000000000002', jsonb_build_array(jsonb_build_object('id', current_setting('design_flow.phase4_correction_entry'), 'work_date', '2026-07-19', 'work_type_code', 'ui_visual_design', 'description', '[SYNTHETIC TEST] corrected')), '90000000-0000-4000-8000-000000000408') $$,
  'Designer can correct own-attributed batch with an audited revision'
);
reset role;
select is((select count(*)::integer from public.work_log_entry_revisions where entry_id = current_setting('design_flow.phase4_correction_entry')::uuid), 1, 'correction records one entry revision');
set local role authenticated;
select is(
  (select count(*)::integer from jsonb_array_elements(public.get_work_item_detail((select display_id from public.work_items where id = current_setting('design_flow.phase4_item')::uuid))->'events') event where event->>'type' = 'work_log_corrected'),
  1, 'Work Item detail exposes the work-log correction event'
);
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
select lives_ok($$ select public.submit_work_log('standalone_visual', null, null, null, '[{"work_date":"2026-07-20","work_type_code":"image_editing"}]'::jsonb, null, '90000000-0000-4000-8000-000000000409') $$, 'Designer + Admin can submit own work');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
set local role authenticated;
select lives_ok($$ select public.submit_work_log('standalone_visual', null, null, null, '[{"work_date":"2026-07-20","work_type_code":"image_editing"}]'::jsonb, null, '90000000-0000-4000-8000-000000000410') $$, 'Lead + Admin can submit own work');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
set local role authenticated;
select lives_ok($$ select public.submit_work_log('standalone_visual', null, null, null, '[{"work_date":"2026-07-20","work_type_code":"image_editing"}]'::jsonb, null, '90000000-0000-4000-8000-000000000411') $$, 'Manager can submit own work');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000007', true);
set local role authenticated;
select lives_ok($$ select public.submit_work_log('standalone_visual', null, null, null, '[{"work_date":"2026-07-20","work_type_code":"image_editing"}]'::jsonb, null, '90000000-0000-4000-8000-000000000412') $$, 'Manager + Admin can submit own work');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000008', true);
set local role authenticated;
select throws_ok($$ select public.submit_work_log('standalone_visual', null, null, null, '[{"work_date":"2026-07-20","work_type_code":"image_editing"}]'::jsonb, null, '90000000-0000-4000-8000-000000000413') $$, 'P0001', 'DF_ACCOUNT_INACTIVE', 'inactive account cannot submit work');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000009', true);
set local role authenticated;
select throws_ok($$ select public.submit_work_log('standalone_visual', null, null, null, '[{"work_date":"2026-07-20","work_type_code":"image_editing"}]'::jsonb, null, '90000000-0000-4000-8000-000000000414') $$, 'P0001', 'DF_PASSWORD_CHANGE_REQUIRED', 'password-restricted account cannot submit work');
reset role;
select is_empty('select 1 from public.profiles where position_code = ''viewer'' and is_admin', 'Viewer + Admin is rejected as an account state');

select * from finish();
rollback;
