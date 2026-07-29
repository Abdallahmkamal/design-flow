begin;

select plan(65);

select set_config('design_flow.phase3_due_date', private.current_team_date()::text, true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;

select is(
  (public.list_work_items('{}'::jsonb) ->> 'totalCount')::integer,
  0,
  'Viewer can read an empty paginated work-item result'
);

select is(
  public.get_work_item_detail('DF-999999'),
  null,
  'a missing display ID returns no detail payload'
);

select throws_ok(
  $$ select public.create_work_item(
    '[SYNTHETIC TEST] Viewer denied', null,
    '50000000-0000-4000-8000-000000000001', null,
    null, null, null, array[]::uuid[],
    '90000000-0000-4000-8000-000000000001'
  ) $$,
  'P0001', 'DF_FORBIDDEN',
  'Viewer cannot create a Work Item'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;

select lives_ok(
  $$ select public.create_work_item(
    '[SYNTHETIC TEST] Phase 3 foundation',
    '[SYNTHETIC TEST] Created by pgTAP.',
    '50000000-0000-4000-8000-000000000001', null,
    '2026-07-22', current_setting('design_flow.phase3_due_date')::date,
    'https://www.figma.com/design/synthetic-pgtap',
    array['60000000-0000-4000-8000-000000000001']::uuid[],
    '90000000-0000-4000-8000-000000000002'
  ) $$,
  'Designer can create a Backlog Work Item'
);

select set_config(
  'design_flow.phase3_item',
  (public.create_work_item(
    '[SYNTHETIC TEST] Phase 3 foundation',
    '[SYNTHETIC TEST] Created by pgTAP.',
    '50000000-0000-4000-8000-000000000001', null,
    '2026-07-22', current_setting('design_flow.phase3_due_date')::date,
    'https://www.figma.com/design/synthetic-pgtap',
    array['60000000-0000-4000-8000-000000000001']::uuid[],
    '90000000-0000-4000-8000-000000000002'
  ) ->> 'id'), true
);

select is(
  (select status_code from public.work_items where id = current_setting('design_flow.phase3_item')::uuid),
  'backlog',
  'creation fixes status to Backlog'
);

select matches(
  (select display_id from public.work_items where id = current_setting('design_flow.phase3_item')::uuid),
  '^DF-[0-9]{6,}$',
  'creation returns a stable display-ID-backed item'
);

select is(
  (select count(*)::integer from public.work_item_status_history where work_item_id = current_setting('design_flow.phase3_item')::uuid),
  1,
  'creation writes the initial status history exactly once'
);

select is(
  (select count(*)::integer from public.work_item_events where work_item_id = current_setting('design_flow.phase3_item')::uuid and event_type_code = 'created'),
  1,
  'creation writes one created event'
);

reset role;
select is(
  (select count(*)::integer from public.work_log_batches where work_item_id = current_setting('design_flow.phase3_item')::uuid),
  0,
  'creation has no work-log side effect'
);
set local role authenticated;

select lives_ok(
  $$ select public.create_work_item(
    '[SYNTHETIC TEST] Phase 3 foundation',
    '[SYNTHETIC TEST] Created by pgTAP.',
    '50000000-0000-4000-8000-000000000001', null,
    '2026-07-22', current_setting('design_flow.phase3_due_date')::date,
    'https://www.figma.com/design/synthetic-pgtap',
    array['60000000-0000-4000-8000-000000000001']::uuid[],
    '90000000-0000-4000-8000-000000000002'
  ) $$,
  'an identical create retry returns the completed result'
);

select is(
  (select count(*)::integer from public.work_item_events where work_item_id = current_setting('design_flow.phase3_item')::uuid and event_type_code = 'created'),
  1,
  'create retry does not duplicate history'
);

select is(
  public.get_work_item_detail(
    (select display_id from public.work_items where id = current_setting('design_flow.phase3_item')::uuid)
  ) ->> 'title',
  '[SYNTHETIC TEST] Phase 3 foundation',
  'detail resolves a Work Item by display ID'
);

select is(
  (public.get_work_item_detail(
    (select display_id from public.work_items where id = current_setting('design_flow.phase3_item')::uuid)
  ) #>> '{capabilities,canEdit}')::boolean,
  true,
  'detail exposes server-authoritative Designer capabilities'
);

select set_config(
  'design_flow.phase3_old_version',
  (select updated_at::text from public.work_items where id = current_setting('design_flow.phase3_item')::uuid),
  true
);

select lives_ok(
  format(
    $$ select public.update_work_item('%s', '[SYNTHETIC TEST] Updated foundation', '[SYNTHETIC TEST] Preserved description', '50000000-0000-4000-8000-000000000001', '2026-07-22', current_setting('design_flow.phase3_due_date')::date, 'https://www.figma.com/design/synthetic-updated', array['60000000-0000-4000-8000-000000000001']::uuid[], '%s', '90000000-0000-4000-8000-000000000030') $$,
    current_setting('design_flow.phase3_item'),
    current_setting('design_flow.phase3_old_version')
  ),
  'an owner can update the core fields and desired label set'
);

select is(
  (select title from public.work_items where id = current_setting('design_flow.phase3_item')::uuid),
  '[SYNTHETIC TEST] Updated foundation',
  'the core-field update is authoritative'
);

select throws_ok(
  format(
    $$ select public.update_work_item('%s', '[SYNTHETIC TEST] Stale update', null, '50000000-0000-4000-8000-000000000001', null, null, null, array[]::uuid[], '%s', '90000000-0000-4000-8000-000000000031') $$,
    current_setting('design_flow.phase3_item'),
    current_setting('design_flow.phase3_old_version')
  ),
  'P0001', 'DF_CONFLICT',
  'a stale core-field update is rejected'
);

select lives_ok(
  format(
    $$ select public.update_work_item('%s', '[SYNTHETIC TEST] Updated foundation', '[SYNTHETIC TEST] Preserved description', '50000000-0000-4000-8000-000000000001', '2026-07-22', current_setting('design_flow.phase3_due_date')::date, 'https://www.figma.com/design/synthetic-updated', array['60000000-0000-4000-8000-000000000001']::uuid[], '%s', '90000000-0000-4000-8000-000000000030') $$,
    current_setting('design_flow.phase3_item'),
    current_setting('design_flow.phase3_old_version')
  ),
  'an identical update retry returns the completed result'
);

select is(
  (select count(*)::integer from public.work_item_events where work_item_id = current_setting('design_flow.phase3_item')::uuid and event_type_code = 'core_fields_changed'),
  1,
  'update retry does not duplicate semantic history'
);

select is(
  (public.list_work_items('{"due":"due_soon","view":"all","peopleIds":[]}'::jsonb) ->> 'totalCount')::integer,
  1,
  'working-day due-soon filtering includes the updated synthetic ticket'
);

select is(
  (public.list_work_items('{"view":"all"}'::jsonb) ->> 'pageSize')::integer,
  25,
  'list pagination keeps the contracted fixed page size'
);

select lives_ok(
  format(
    $$ select public.reassign_work_item('%s', '10000000-0000-4000-8000-000000000003', null, '%s', '90000000-0000-4000-8000-000000000003') $$,
    current_setting('design_flow.phase3_item'),
    (select updated_at from public.work_items where id = current_setting('design_flow.phase3_item')::uuid)
  ),
  'Designer can reassign an owned Work Item to an eligible person'
);

select is(
  (select count(*)::integer from public.work_item_assignments where work_item_id = current_setting('design_flow.phase3_item')::uuid and ended_at is null),
  1,
  'reassignment leaves one open assignment'
);

reset role;
select is(
  (select count(*)::integer from public.notifications where work_item_id = current_setting('design_flow.phase3_item')::uuid and notification_type_code = 'assigned_to_you'),
  1,
  'reassignment produces the assignment notification once'
);
set local role authenticated;

select lives_ok(
  format(
    $$ select public.transition_work_item_status('%s', 'todo', 'backlog', '%s', false, '90000000-0000-4000-8000-000000000004') $$,
    current_setting('design_flow.phase3_item'),
    (select updated_at from public.work_items where id = current_setting('design_flow.phase3_item')::uuid)
  ),
  'an assigned Work Item can transition to To Do'
);

select is(
  (select status_code from public.work_items where id = current_setting('design_flow.phase3_item')::uuid),
  'todo',
  'the authoritative status reflects the transition'
);

select lives_ok(
  format(
    $$ select public.create_blocker('%s', '[SYNTHETIC TEST] Waiting on review', '2026-07-25', 'todo', '90000000-0000-4000-8000-000000000005') $$,
    current_setting('design_flow.phase3_item')
  ),
  'Designer can create a blocker on a visible active Work Item'
);

select is(
  (select count(*)::integer from public.blockers where work_item_id = current_setting('design_flow.phase3_item')::uuid and resolved_at is null),
  1,
  'only one active blocker exists'
);

select throws_ok(
  format(
    $$ select public.transition_work_item_status('%s', 'backlog', 'todo', '%s', false, '90000000-0000-4000-8000-000000000006') $$,
    current_setting('design_flow.phase3_item'),
    (select updated_at from public.work_items where id = current_setting('design_flow.phase3_item')::uuid)
  ),
  'P0001', 'DF_INVALID_STATE',
  'an active blocker prevents an incompatible status transition'
);

select lives_ok(
  format(
    $$ select public.resolve_blocker('%s', '[SYNTHETIC TEST] Review received', true, '90000000-0000-4000-8000-000000000007') $$,
    (select id from public.blockers where work_item_id = current_setting('design_flow.phase3_item')::uuid and resolved_at is null)
  ),
  'Designer can resolve the active blocker'
);

select is(
  (select count(*)::integer from public.blockers where work_item_id = current_setting('design_flow.phase3_item')::uuid and resolved_at is null),
  0,
  'resolution preserves the blocker while closing its active interval'
);

select lives_ok(
  format(
    $$ select public.add_subtask('%s', '[SYNTHETIC TEST] First subtask', null, '%s', '90000000-0000-4000-8000-000000000008') $$,
    current_setting('design_flow.phase3_item'),
    (select last_activity_at from public.work_items where id = current_setting('design_flow.phase3_item')::uuid)
  ),
  'an editor can add a subtask'
);

select set_config(
  'design_flow.phase3_subtask',
  (select id::text from public.subtasks where work_item_id = current_setting('design_flow.phase3_item')::uuid and withdrawn_at is null),
  true
);

select lives_ok(
  format(
    $$ select public.add_subtask('%s', '[SYNTHETIC TEST] Second subtask', null, '%s', '90000000-0000-4000-8000-000000000032') $$,
    current_setting('design_flow.phase3_item'),
    (select last_activity_at from public.work_items where id = current_setting('design_flow.phase3_item')::uuid)
  ),
  'an editor can add a second subtask at the end'
);

select set_config(
  'design_flow.phase3_second_subtask',
  (select id::text from public.subtasks where work_item_id = current_setting('design_flow.phase3_item')::uuid and title = '[SYNTHETIC TEST] Second subtask'),
  true
);

select lives_ok(
  format(
    $$ select public.reorder_subtasks('%s', array['%s','%s']::uuid[], '%s', '90000000-0000-4000-8000-000000000033') $$,
    current_setting('design_flow.phase3_item'),
    current_setting('design_flow.phase3_second_subtask'),
    current_setting('design_flow.phase3_subtask'),
    (select last_activity_at from public.work_items where id = current_setting('design_flow.phase3_item')::uuid)
  ),
  'an editor can reorder the exact active subtask membership'
);

select is(
  (select string_agg(title, '|' order by position) from public.subtasks where work_item_id = current_setting('design_flow.phase3_item')::uuid and withdrawn_at is null),
  '[SYNTHETIC TEST] Second subtask|[SYNTHETIC TEST] First subtask',
  'subtask reorder persists contiguous requested positions'
);

select lives_ok(
  format(
    $$ select public.withdraw_subtask('%s', '%s', '90000000-0000-4000-8000-000000000034') $$,
    current_setting('design_flow.phase3_second_subtask'),
    (select updated_at from public.subtasks where id = current_setting('design_flow.phase3_second_subtask')::uuid)
  ),
  'an editor can softly withdraw a subtask'
);

select is(
  (select count(*)::integer from public.subtasks where work_item_id = current_setting('design_flow.phase3_item')::uuid and withdrawn_at is null),
  1,
  'withdrawal preserves history and compacts the active subtask set'
);

select lives_ok(
  format(
    $$ select public.rename_subtask('%s', '[SYNTHETIC TEST] Renamed subtask', '%s', '90000000-0000-4000-8000-000000000009') $$,
    current_setting('design_flow.phase3_subtask'),
    (select updated_at from public.subtasks where id = current_setting('design_flow.phase3_subtask')::uuid)
  ),
  'an editor can rename a subtask with the current version'
);

select lives_ok(
  format(
    $$ select public.set_subtask_completion('%s', true, false, '90000000-0000-4000-8000-000000000010') $$,
    current_setting('design_flow.phase3_subtask')
  ),
  'an editor can complete a subtask'
);

select is(
  (select is_completed from public.subtasks where id = current_setting('design_flow.phase3_subtask')::uuid),
  true,
  'subtask completion is authoritative'
);

select lives_ok(
  format(
    $$ select public.add_comment('%s', '[SYNTHETIC TEST] Initial comment', '90000000-0000-4000-8000-000000000011') $$,
    current_setting('design_flow.phase3_item')
  ),
  'Designer can add a comment'
);

select set_config(
  'design_flow.phase3_comment',
  (select id::text from public.visible_comments where work_item_id = current_setting('design_flow.phase3_item')::uuid),
  true
);

select lives_ok(
  format(
    $$ select public.edit_comment('%s', '[SYNTHETIC TEST] Edited comment', '%s', '90000000-0000-4000-8000-000000000012') $$,
    current_setting('design_flow.phase3_comment'),
    (select created_at from public.visible_comments where id = current_setting('design_flow.phase3_comment')::uuid)
  ),
  'only the author can edit the comment'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
select throws_ok(
  format(
    $$ select public.edit_comment('%s', '[SYNTHETIC TEST] Non-author edit', '%s', '90000000-0000-4000-8000-000000000035') $$,
    current_setting('design_flow.phase3_comment'),
    (select edited_at from public.visible_comments where id = current_setting('design_flow.phase3_comment')::uuid)
  ),
  'P0001', 'DF_FORBIDDEN',
  'Admin privilege does not bypass author-only comment editing'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select lives_ok(
  format(
    $$ select public.withdraw_comment('%s', '%s', '90000000-0000-4000-8000-000000000013') $$,
    current_setting('design_flow.phase3_comment'),
    (select edited_at from public.visible_comments where id = current_setting('design_flow.phase3_comment')::uuid)
  ),
  'Lead can moderate and withdraw another author comment'
);

select is(
  (select body from public.visible_comments where id = current_setting('design_flow.phase3_comment')::uuid),
  null,
  'withdrawn comment bodies are masked from the browser-facing view'
);

select is(
  has_table_privilege('authenticated', 'public.comment_revisions', 'select'),
  false,
  'browser roles cannot read comment revision bodies'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;

select lives_ok(
  format(
    $$ select public.transition_work_item_status('%s', 'backlog', 'todo', '%s', false, '90000000-0000-4000-8000-000000000014') $$,
    current_setting('design_flow.phase3_item'),
    (select updated_at from public.work_items where id = current_setting('design_flow.phase3_item')::uuid)
  ),
  'the resolved Work Item can return to Backlog'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;

select lives_ok(
  format(
    $$ select public.archive_work_item('%s', '%s', '90000000-0000-4000-8000-000000000015') $$,
    current_setting('design_flow.phase3_item'),
    (select updated_at from public.work_items where id = current_setting('design_flow.phase3_item')::uuid)
  ),
  'Lead can archive an eligible Work Item'
);

select throws_ok(
  format(
    $$ select public.add_comment('%s', '[SYNTHETIC TEST] Denied while archived', '90000000-0000-4000-8000-000000000016') $$,
    current_setting('design_flow.phase3_item')
  ),
  'P0001', 'DF_INVALID_STATE',
  'archived Work Items reject new comments'
);

select lives_ok(
  format(
    $$ select public.restore_work_item('%s', '%s', '90000000-0000-4000-8000-000000000017') $$,
    current_setting('design_flow.phase3_item'),
    (select updated_at from public.work_items where id = current_setting('design_flow.phase3_item')::uuid)
  ),
  'Lead can restore an archived Work Item'
);

select is(
  (select archived_at is null from public.work_items where id = current_setting('design_flow.phase3_item')::uuid),
  true,
  'restore returns the Work Item to an active record state'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
select lives_ok(
  $$ select public.create_work_item(
    '[SYNTHETIC TEST] Designer Admin matrix', null,
    '50000000-0000-4000-8000-000000000001', null,
    null, null, null, array[]::uuid[],
    '90000000-0000-4000-8000-000000000040'
  ) $$,
  'Designer plus Admin can create a Work Item'
);
select set_config(
  'design_flow.phase3_unrelated_item',
  (public.create_work_item(
    '[SYNTHETIC TEST] Designer Admin matrix', null,
    '50000000-0000-4000-8000-000000000001', null,
    null, null, null, array[]::uuid[],
    '90000000-0000-4000-8000-000000000040'
  ) ->> 'id'), true
);
select is(
  (public.get_work_item_detail(
    (select display_id from public.work_items where id = current_setting('design_flow.phase3_unrelated_item')::uuid)
  ) #>> '{capabilities,canEdit}')::boolean,
  true,
  'Designer plus Admin receives whole-team edit capability'
);
select lives_ok(
  $$ select public.list_work_items('{"view":"all"}'::jsonb) $$,
  'Designer plus Admin can list Work Items'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select throws_ok(
  format(
    $$ select public.update_work_item('%s', '[SYNTHETIC TEST] Unrelated denied', null, '50000000-0000-4000-8000-000000000001', null, null, null, array[]::uuid[], '%s', '90000000-0000-4000-8000-000000000045') $$,
    current_setting('design_flow.phase3_unrelated_item'),
    (select updated_at from public.work_items where id = current_setting('design_flow.phase3_unrelated_item')::uuid)
  ),
  'P0001', 'DF_FORBIDDEN',
  'Designer cannot edit an unrelated Work Item'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select lives_ok($$ select public.list_work_items('{"view":"all"}'::jsonb) $$, 'Lead can list Work Items');
select lives_ok(
  $$ select public.create_work_item('[SYNTHETIC TEST] Lead matrix', null, '50000000-0000-4000-8000-000000000001', null, null, null, null, array[]::uuid[], '90000000-0000-4000-8000-000000000041') $$,
  'Lead can create a Work Item'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
set local role authenticated;
select lives_ok($$ select public.list_work_items('{"view":"all"}'::jsonb) $$, 'Lead plus Admin can list Work Items');
select lives_ok(
  $$ select public.create_work_item('[SYNTHETIC TEST] Lead Admin matrix', null, '50000000-0000-4000-8000-000000000001', null, null, null, null, array[]::uuid[], '90000000-0000-4000-8000-000000000042') $$,
  'Lead plus Admin can create a Work Item'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
set local role authenticated;
select lives_ok($$ select public.list_work_items('{"view":"all"}'::jsonb) $$, 'Manager can list Work Items');
select lives_ok(
  $$ select public.create_work_item('[SYNTHETIC TEST] Manager matrix', null, '50000000-0000-4000-8000-000000000001', null, null, null, null, array[]::uuid[], '90000000-0000-4000-8000-000000000043') $$,
  'Manager can create a Work Item'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000007', true);
set local role authenticated;
select lives_ok($$ select public.list_work_items('{"view":"all"}'::jsonb) $$, 'Manager plus Admin can list Work Items');
select lives_ok(
  $$ select public.create_work_item('[SYNTHETIC TEST] Manager Admin matrix', null, '50000000-0000-4000-8000-000000000001', null, null, null, null, array[]::uuid[], '90000000-0000-4000-8000-000000000044') $$,
  'Manager plus Admin can create a Work Item'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000008', true);
set local role authenticated;
select throws_ok(
  $$ select public.list_work_items('{}'::jsonb) $$,
  'P0001', 'DF_ACCOUNT_INACTIVE',
  'inactive accounts cannot read Work Items'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000009', true);
set local role authenticated;
select throws_ok(
  $$ select public.list_work_items('{}'::jsonb) $$,
  'P0001', 'DF_PASSWORD_CHANGE_REQUIRED',
  'password-restricted accounts cannot read Work Items'
);

reset role;
select throws_ok(
  $$ update public.profiles set is_admin = true where id = '10000000-0000-4000-8000-000000000001' $$,
  '23514',
  null,
  'the database rejects Viewer plus Admin account state'
);

select * from finish();
rollback;
