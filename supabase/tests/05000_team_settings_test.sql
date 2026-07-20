begin;

select plan(55);

select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.team_directory),
  8,
  'Viewer can read the active Team directory'
);
select is(
  (select count(*)::integer from public.admin_member_directory),
  0,
  'Viewer receives no Admin member data'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.team_directory),
  8,
  'Designer can read the active Team directory'
);
select is(
  (select count(*)::integer from public.admin_member_directory),
  0,
  'Designer receives no Admin member data'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000003',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.team_directory),
  8,
  'Designer plus Admin can read the active Team directory'
);
select is(
  (select count(*)::integer from public.admin_member_directory),
  9,
  'Designer plus Admin can read account-support member data'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000004',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.team_directory),
  8,
  'Lead can read the active Team directory'
);
select is(
  (select count(*)::integer from public.admin_member_directory),
  0,
  'Lead receives no Admin member data'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000005',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.team_directory),
  8,
  'Lead plus Admin can read the active Team directory'
);
select is(
  (select count(*)::integer from public.admin_member_directory),
  9,
  'Lead plus Admin can read account-support member data'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000006',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.team_directory),
  8,
  'Manager can read the active Team directory'
);
select is(
  (select count(*)::integer from public.admin_member_directory),
  0,
  'Manager without Admin receives no Settings data'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000007',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.team_directory),
  8,
  'Manager plus Admin can read the active Team directory'
);
select is(
  (select count(*)::integer from public.admin_member_directory),
  9,
  'Manager plus Admin can read account-support member data'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000008',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.team_directory),
  0,
  'inactive accounts receive no Team directory rows'
);
select is(
  (select count(*)::integer from public.admin_member_directory),
  0,
  'inactive accounts receive no Settings rows'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000009',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.team_directory),
  0,
  'password-restricted accounts receive no Team directory rows'
);
select is(
  (select count(*)::integer from public.admin_member_directory),
  0,
  'password-restricted accounts receive no Settings rows'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
set local role authenticated;
select throws_ok(
  $$
    select public.set_team_timezone(
      'Africa/Abidjan',
      (select updated_at from public.team_settings where singleton_key),
      '83000000-0000-4000-8000-000000000001'
    )
  $$,
  'P0001',
  'DF_FORBIDDEN',
  'Viewer cannot mutate Settings'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);
set local role authenticated;
select throws_ok(
  $$
    select public.set_team_timezone(
      'Africa/Abidjan',
      (select updated_at from public.team_settings where singleton_key),
      '83000000-0000-4000-8000-000000000002'
    )
  $$,
  'P0001',
  'DF_FORBIDDEN',
  'Designer cannot mutate Settings'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000004',
  true
);
set local role authenticated;
select throws_ok(
  $$
    select public.set_team_timezone(
      'Africa/Abidjan',
      (select updated_at from public.team_settings where singleton_key),
      '83000000-0000-4000-8000-000000000003'
    )
  $$,
  'P0001',
  'DF_FORBIDDEN',
  'Lead cannot mutate Settings'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000006',
  true
);
set local role authenticated;
select throws_ok(
  $$
    select public.set_team_timezone(
      'Africa/Abidjan',
      (select updated_at from public.team_settings where singleton_key),
      '83000000-0000-4000-8000-000000000004'
    )
  $$,
  'P0001',
  'DF_FORBIDDEN',
  'Manager without Admin cannot mutate Settings'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000003',
  true
);
set local role authenticated;
select lives_ok(
  $$
    select public.create_label(
      '84000000-0000-4000-8000-000000000001',
      '[SYNTHETIC TEST] Research',
      null,
      '83000000-0000-4000-8000-000000000005'
    )
  $$,
  'Designer plus Admin can create a Label'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000005',
  true
);
set local role authenticated;
select lives_ok(
  $$
    select public.create_work_area(
      '84000000-0000-4000-8000-000000000002',
      '[SYNTHETIC TEST] Growth',
      null,
      '83000000-0000-4000-8000-000000000006'
    )
  $$,
  'Lead plus Admin can create an Area'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000007',
  true
);
set local role authenticated;
select lives_ok(
  $$
    select public.set_team_timezone(
      'Africa/Abidjan',
      (select updated_at from public.team_settings where singleton_key),
      '83000000-0000-4000-8000-000000000007'
    )
  $$,
  'Manager plus Admin can change team timezone'
);
select is(
  (
    select count(*)::integer
    from public.administration_audit_log
    where operation_id = '83000000-0000-4000-8000-000000000007'
      and event_type_code = 'team_timezone_changed'
  ),
  1,
  'team timezone change is audited exactly once'
);
select lives_ok(
  $$
    select public.set_team_timezone(
      'Africa/Abidjan',
      '2026-01-01 09:00:00+00',
      '83000000-0000-4000-8000-000000000007'
    )
  $$,
  'team timezone retry returns its completed result'
);
select is(
  (
    select count(*)::integer
    from public.administration_audit_log
    where operation_id = '83000000-0000-4000-8000-000000000007'
  ),
  1,
  'team timezone retry does not duplicate audit'
);
select throws_ok(
  $$
    select public.set_team_timezone(
      'Africa/Cairo',
      '2026-01-01 09:00:00+00',
      '83000000-0000-4000-8000-000000000007'
    )
  $$,
  'P0001',
  'DF_IDEMPOTENCY_MISMATCH',
  'operation ID reuse with different timezone intent is rejected'
);

select throws_ok(
  $$
    select public.set_member_access(
      '10000000-0000-4000-8000-000000000002',
      'viewer',
      true,
      null,
      (select updated_at from public.profiles
       where id = '10000000-0000-4000-8000-000000000002'),
      '[]'::jsonb,
      '83000000-0000-4000-8000-000000000008'
    )
  $$,
  'P0001',
  'DF_INVALID_VIEWER_ADMIN',
  'set_member_access rejects Viewer plus Admin'
);
select throws_ok(
  $$
    select public.set_member_access(
      '10000000-0000-4000-8000-000000000002',
      'designer',
      false,
      '10000000-0000-4000-8000-000000000006',
      (select updated_at from public.profiles
       where id = '10000000-0000-4000-8000-000000000002'),
      '[]'::jsonb,
      '83000000-0000-4000-8000-000000000009'
    )
  $$,
  'P0001',
  'DF_VALIDATION',
  'set_member_access rejects an invalid hierarchy pairing'
);
select throws_ok(
  $$
    select public.set_member_access(
      '10000000-0000-4000-8000-000000000002',
      'designer',
      false,
      '10000000-0000-4000-8000-000000000004',
      '2000-01-01 00:00:00+00',
      '[]'::jsonb,
      '83000000-0000-4000-8000-000000000010'
    )
  $$,
  'P0001',
  'DF_CONFLICT',
  'set_member_access rejects a stale profile version'
);

reset role;
insert into public.work_items (
  id,
  title,
  area_id,
  status_code,
  primary_assignee_id,
  created_by
) values (
  '85000000-0000-4000-8000-000000000001',
  '[SYNTHETIC TEST] Reassignment safety',
  '50000000-0000-4000-8000-000000000001',
  'todo',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000007'
);
insert into public.work_item_assignments (
  id,
  work_item_id,
  assignee_id,
  started_at,
  started_on,
  assigned_by,
  start_operation_id
) values (
  '86000000-0000-4000-8000-000000000001',
  '85000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000003',
  '2026-01-02 09:00:00+00',
  '2026-01-02',
  '10000000-0000-4000-8000-000000000007',
  '30000000-0000-4000-8000-000000000003'
);
insert into public.work_item_status_history (
  work_item_id,
  from_status_code,
  to_status_code,
  changed_by,
  changed_at,
  changed_on,
  operation_id
) values (
  '85000000-0000-4000-8000-000000000001',
  null,
  'todo',
  '10000000-0000-4000-8000-000000000007',
  '2026-01-02 09:00:00+00',
  '2026-01-02',
  '30000000-0000-4000-8000-000000000003'
);
select set_config(
  'design_flow.test_member_version',
  (
    select updated_at::text
    from public.profiles
    where id = '10000000-0000-4000-8000-000000000003'
  ),
  true
);
set local role authenticated;
select lives_ok(
  $$
    select public.set_member_access(
      '10000000-0000-4000-8000-000000000003',
      'viewer',
      false,
      null,
      current_setting('design_flow.test_member_version')::timestamptz,
      jsonb_build_array(jsonb_build_object(
        'work_item_id', '85000000-0000-4000-8000-000000000001',
        'new_assignee_id', '10000000-0000-4000-8000-000000000006'
      )),
      '83000000-0000-4000-8000-000000000011'
    )
  $$,
  'an Admin can atomically change position, Admin, and reporting state'
);
select lives_ok(
  $$
    select public.set_member_access(
      '10000000-0000-4000-8000-000000000003',
      'viewer',
      false,
      null,
      current_setting('design_flow.test_member_version')::timestamptz,
      jsonb_build_array(jsonb_build_object(
        'work_item_id', '85000000-0000-4000-8000-000000000001',
        'new_assignee_id', '10000000-0000-4000-8000-000000000006'
      )),
      '83000000-0000-4000-8000-000000000011'
    )
  $$,
  'member-access retry returns the completed reassignment result'
);
select is(
  (
    select format('%s|%s|%s', position_code, is_admin, current_reports_to_id)
    from public.admin_member_directory
    where id = '10000000-0000-4000-8000-000000000003'
  ),
  'viewer|f|',
  'member snapshot reflects the complete desired access state'
);
select is(
  (
    select count(*)::integer
    from public.profile_access_periods
    where profile_id = '10000000-0000-4000-8000-000000000003'
      and ended_at is null
  ),
  1,
  'member access change leaves exactly one open access period'
);
select is(
  (
    select count(*)::integer
    from public.reporting_line_assignments
    where person_id = '10000000-0000-4000-8000-000000000003'
      and ended_on is null
  ),
  0,
  'member access change closes the obsolete reporting line'
);
select is(
  (
    select count(*)::integer
    from public.administration_audit_log
    where operation_id = '83000000-0000-4000-8000-000000000011'
  ),
  3,
  'combined access change writes separate semantic audit events'
);

reset role;
select is(
  (
    select primary_assignee_id
    from public.work_items
    where id = '85000000-0000-4000-8000-000000000001'
  ),
  '10000000-0000-4000-8000-000000000006'::uuid,
  'moving an assigned member to Viewer installs the confirmed replacement'
);
select is(
  (
    select format(
      '%s|%s',
      count(*) filter (where ended_at is null),
      count(*) filter (where ended_at is not null)
    )
    from public.work_item_assignments
    where work_item_id = '85000000-0000-4000-8000-000000000001'
  ),
  '1|1',
  'assignment replacement leaves one open interval and closes the prior interval'
);
select is(
  (
    select count(*)::integer
    from public.work_item_events
    where operation_id = '83000000-0000-4000-8000-000000000011'
      and event_type_code = 'assignment_changed'
  ),
  1,
  'member-access retry does not duplicate the assignment timeline event'
);
select is(
  (
    select count(*)::integer
    from public.notifications
    where source_event_id = (
      select id
      from public.work_item_events
      where operation_id = '83000000-0000-4000-8000-000000000011'
        and event_type_code = 'assignment_changed'
    )
  ),
  2,
  'assignment replacement notifies the previous and new assignees exactly once'
);
set local role authenticated;
select lives_ok(
  $$
    select public.set_member_access(
      '10000000-0000-4000-8000-000000000005',
      'lead',
      false,
      '10000000-0000-4000-8000-000000000006',
      (select updated_at from public.profiles
       where id = '10000000-0000-4000-8000-000000000005'),
      '[]'::jsonb,
      '83000000-0000-4000-8000-000000000012'
    )
  $$,
  'Admin privilege can change without changing position or reporting line'
);
select throws_ok(
  $$
    select public.set_member_access(
      '10000000-0000-4000-8000-000000000007',
      'manager',
      false,
      null,
      (select updated_at from public.profiles
       where id = '10000000-0000-4000-8000-000000000007'),
      '[]'::jsonb,
      '83000000-0000-4000-8000-000000000013'
    )
  $$,
  'P0001',
  'DF_FINAL_ADMIN',
  'set_member_access protects the final active Admin'
);

select lives_ok(
  $$
    select public.rename_label(
      '84000000-0000-4000-8000-000000000001',
      '[SYNTHETIC TEST] Customer research',
      (select updated_at from public.labels
       where id = '84000000-0000-4000-8000-000000000001'),
      '83000000-0000-4000-8000-000000000014'
    )
  $$,
  'an Admin can rename a Label without replacing its UUID'
);
select lives_ok(
  $$
    select public.reorder_labels(
      array[
        '84000000-0000-4000-8000-000000000001',
        '60000000-0000-4000-8000-000000000001'
      ]::uuid[],
      '83000000-0000-4000-8000-000000000015'
    )
  $$,
  'an Admin can reorder the complete active Label list'
);
select throws_ok(
  $$
    select public.archive_label(
      '84000000-0000-4000-8000-000000000001',
      1,
      (select updated_at from public.labels
       where id = '84000000-0000-4000-8000-000000000001'),
      '83000000-0000-4000-8000-000000000016'
    )
  $$,
  'P0001',
  'DF_CONFLICT',
  'archive rejects a stale confirmed usage count'
);
select lives_ok(
  $$
    select public.archive_label(
      '84000000-0000-4000-8000-000000000001',
      0,
      (select updated_at from public.labels
       where id = '84000000-0000-4000-8000-000000000001'),
      '83000000-0000-4000-8000-000000000017'
    )
  $$,
  'an Admin can archive after confirming current usage'
);
select is(
  (
    select format('%s|%s|%s', is_active, current_usage_count, historical_usage_count)
    from public.label_settings
    where id = '84000000-0000-4000-8000-000000000001'
  ),
  'f|0|0',
  'archived Label stays readable with current and historical usage'
);
select is(
  (
    select is_active
    from public.labels
    where id = '84000000-0000-4000-8000-000000000001'
  ),
  false,
  'archive removes the Label from active selection'
);
select lives_ok(
  $$
    select public.reactivate_label(
      '84000000-0000-4000-8000-000000000001',
      null,
      (select updated_at from public.labels
       where id = '84000000-0000-4000-8000-000000000001'),
      '83000000-0000-4000-8000-000000000018'
    )
  $$,
  'an Admin can reactivate an archived Label'
);
select is(
  (
    select count(*)::integer
    from public.administration_audit_log
    where subject_id = '84000000-0000-4000-8000-000000000001'
      and event_type_code in (
        'label_created',
        'label_renamed',
        'label_archived',
        'label_reactivated'
      )
  ),
  4,
  'Label lifecycle produces one audit event per semantic change'
);
select throws_ok(
  $$
    update public.labels
    set name = '[SYNTHETIC TEST] Direct write denied'
    where id = '84000000-0000-4000-8000-000000000001'
  $$,
  '42501',
  'permission denied for table labels',
  'browser clients cannot bypass controlled-list RPCs'
);
select throws_ok(
  $$
    update public.admin_audit_events
    set new_values = '{"tampered": true}'::jsonb
    where operation_id = '83000000-0000-4000-8000-000000000007'
  $$,
  '42501',
  'permission denied for table admin_audit_events',
  'administration audit is append-only to browser clients'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.set_member_access(uuid,text,boolean,uuid,timestamptz,jsonb,uuid)',
    'EXECUTE'
  ),
  'anonymous clients cannot execute member-access administration'
);

select * from finish();

rollback;
