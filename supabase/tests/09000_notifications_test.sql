begin;

select plan(33);
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select set_config('design_flow.notify_item', (
  public.create_work_item(
    '[SYNTHETIC TEST] Notification isolation', null,
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002', null, null, null,
    array[]::uuid[], '90000000-0000-4000-8000-000000000601'
  ) ->> 'id'
), true);
select set_config('design_flow.notify_version', (
  select updated_at::text from public.work_items
  where id = current_setting('design_flow.notify_item')::uuid
), true);
reset role;

select is((select count(*)::integer from public.notifications where recipient_id = '10000000-0000-4000-8000-000000000002' and notification_type_code = 'assigned_to_you'), 1, 'Initial assignment notifies the new assignee once');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select public.transition_work_item_status(
  current_setting('design_flow.notify_item')::uuid, 'todo', 'backlog',
  current_setting('design_flow.notify_version')::timestamptz,
  false, '90000000-0000-4000-8000-000000000602'
);
reset role;
select is((select count(*)::integer from public.notifications where recipient_id = '10000000-0000-4000-8000-000000000002' and notification_type_code = 'status_changed'), 1, 'Status change notifies the current assignee once');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select public.transition_work_item_status(
  current_setting('design_flow.notify_item')::uuid, 'todo', 'backlog',
  current_setting('design_flow.notify_version')::timestamptz,
  false, '90000000-0000-4000-8000-000000000602'
);
reset role;
select is((select count(*)::integer from public.notifications where recipient_id = '10000000-0000-4000-8000-000000000002' and notification_type_code = 'status_changed'), 1, 'Status retry cannot duplicate its notification');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select public.create_blocker(
  current_setting('design_flow.notify_item')::uuid,
  '[SYNTHETIC SECRET] Blocker reason must not be copied', null, 'todo',
  '90000000-0000-4000-8000-000000000603'
);
reset role;
select is((select count(*)::integer from public.notifications where recipient_id = '10000000-0000-4000-8000-000000000002' and notification_type_code = 'blocker_created'), 1, 'Blocker creation notifies the current assignee once');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select is(strpos(public.get_notification_inbox()::text, 'Blocker reason must not be copied'), 0, 'Inbox never copies blocker reason text');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select public.add_comment(
  current_setting('design_flow.notify_item')::uuid,
  '[SYNTHETIC SECRET] Comment body must not be copied',
  '90000000-0000-4000-8000-000000000604'
);
reset role;
select is((select count(*)::integer from public.notifications where recipient_id = '10000000-0000-4000-8000-000000000002' and notification_type_code = 'comment_added'), 1, 'Comment addition notifies the current assignee once');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select is(strpos(public.get_notification_inbox()::text, 'Comment body must not be copied'), 0, 'Inbox never copies comment body text');
select public.add_comment(
  current_setting('design_flow.notify_item')::uuid,
  '[SYNTHETIC TEST] Self comment',
  '90000000-0000-4000-8000-000000000605'
);
reset role;
select is((select count(*)::integer from public.notifications where recipient_id = '10000000-0000-4000-8000-000000000002' and notification_type_code = 'comment_added'), 1, 'Self comment creates no notification');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select public.submit_work_log(
  'ticket', current_setting('design_flow.notify_item')::uuid, null, null,
  jsonb_build_array(jsonb_build_object(
    'work_date', (now() at time zone 'Africa/Cairo')::date, 'work_type_code', 'ui_visual_design'
  )), null, '90000000-0000-4000-8000-000000000606'
);
reset role;
select is((select count(*)::integer from public.notifications where recipient_id = '10000000-0000-4000-8000-000000000002'), 4, 'Work logging creates no notification');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select public.reassign_work_item(
  current_setting('design_flow.notify_item')::uuid,
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000002',
  (select updated_at from public.work_items where id = current_setting('design_flow.notify_item')::uuid),
  '90000000-0000-4000-8000-000000000607'
);
reset role;
select is((select count(*)::integer from public.notifications where recipient_id = '10000000-0000-4000-8000-000000000002' and notification_type_code = 'reassigned_away_from_you'), 1, 'Reassignment away notifies the old assignee');
select is((select count(*)::integer from public.notifications where recipient_id = '10000000-0000-4000-8000-000000000003' and notification_type_code = 'assigned_to_you'), 1, 'Reassignment notifies the new assignee');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select is((public.get_notification_inbox()->>'totalCount')::integer, 5, 'Recipient inbox total reconciles its five source events');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
select is((public.get_notification_inbox()->>'totalCount')::integer, 1, 'Another recipient sees only its own source event');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select lives_ok($$ select public.get_notification_inbox() $$, 'Viewer can read own notification inbox');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select lives_ok($$ select public.get_notification_inbox() $$, 'Designer can read own notification inbox');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
select lives_ok($$ select public.get_notification_inbox() $$, 'Designer Admin can read own notification inbox');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select lives_ok($$ select public.get_notification_inbox() $$, 'Lead can read own notification inbox');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
set local role authenticated;
select lives_ok($$ select public.get_notification_inbox() $$, 'Lead Admin can read own notification inbox');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
set local role authenticated;
select lives_ok($$ select public.get_notification_inbox() $$, 'Manager can read own notification inbox');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000007', true);
set local role authenticated;
select lives_ok($$ select public.get_notification_inbox() $$, 'Manager Admin can read own notification inbox');
reset role;

select set_config('design_flow.other_notification', (select id::text from public.notifications where recipient_id = '10000000-0000-4000-8000-000000000003' limit 1), true);
select set_config('design_flow.own_notification', (select id::text from public.notifications where recipient_id = '10000000-0000-4000-8000-000000000002' order by created_at limit 1), true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select is((select count(*)::integer from public.notifications), 5, 'RLS SELECT exposes only the current recipient rows');
select results_eq($$ with changed as (update public.notifications set read_at = statement_timestamp() where id = current_setting('design_flow.other_notification')::uuid returning 1) select count(*)::integer from changed $$, $$ values (0) $$, 'Recipient cannot mutate another inbox row');
select results_eq($$ with changed as (update public.notifications set read_at = statement_timestamp() where id = current_setting('design_flow.own_notification')::uuid returning 1) select count(*)::integer from changed $$, $$ values (1) $$, 'Recipient can mark one own notification read');
select is(public.get_notification_unread_count(), 4, 'Unread count follows own read state');
select results_eq($$ with changed as (update public.notifications set read_at = statement_timestamp() where recipient_id = auth.uid() and read_at is null returning 1) select count(*)::integer from changed $$, $$ values (4) $$, 'Mark all updates only remaining own unread rows');
select is(public.get_notification_unread_count(), 0, 'Mark all leaves own unread count at zero');
select results_eq($$ with changed as (update public.notifications set read_at = statement_timestamp() where recipient_id = auth.uid() and read_at is null returning 1) select count(*)::integer from changed $$, $$ values (0) $$, 'Repeated mark all is a no-op');
select throws_ok($$ insert into public.notifications (recipient_id, actor_id, work_item_id, source_event_id, notification_type_code) select auth.uid(), actor_id, work_item_id, source_event_id, notification_type_code from public.notifications limit 1 $$, '42501', null, 'Direct browser notification insert remains denied');
select throws_ok($$ delete from public.notifications where id = current_setting('design_flow.own_notification')::uuid $$, '42501', null, 'Notification deletion remains denied');
select throws_ok($$ update public.notifications set recipient_id = auth.uid() where id = current_setting('design_flow.own_notification')::uuid $$, '42501', null, 'Browser cannot alter notification content or recipient');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000008', true);
set local role authenticated;
select throws_ok($$ select public.get_notification_inbox() $$, 'P0001', 'DF_ACCOUNT_INACTIVE', 'Inactive account cannot access notifications');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000009', true);
set local role authenticated;
select throws_ok($$ select public.get_notification_inbox() $$, 'P0001', 'DF_PASSWORD_CHANGE_REQUIRED', 'Password-restricted account cannot access notifications');
reset role;
select is_empty('select 1 from public.profiles where position_code = ''viewer'' and is_admin', 'Viewer Admin remains rejected');

select * from finish();
rollback;
