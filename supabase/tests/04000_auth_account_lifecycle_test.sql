begin;

select plan(43);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '81000000-0000-4000-8000-000000000001',
    'new-designer@design-flow.example.invalid',
    '{"synthetic": true}'::jsonb
  ),
  (
    '81000000-0000-4000-8000-000000000002',
    'invalid-viewer-admin@design-flow.example.invalid',
    '{"synthetic": true}'::jsonb
  );

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000009',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select is(
  (
    select format('%s|%s', is_active, must_change_password)
    from public.get_own_account_state()
  ),
  't|t',
  'a password-restricted user can read only the minimum own account state'
);

reset role;

select lives_ok(
  $$
    select public.complete_own_password_change(
      '10000000-0000-4000-8000-000000000009',
      '82000000-0000-4000-8000-000000000001'
    )
  $$,
  'a password-restricted active user can complete the own-password database step'
);

set local role authenticated;

select is(
  (
    select must_change_password
    from public.get_own_account_state()
  ),
  false,
  'password completion clears the profile restriction'
);

reset role;

select lives_ok(
  $$
    select public.complete_own_password_change(
      '10000000-0000-4000-8000-000000000009',
      '82000000-0000-4000-8000-000000000001'
    )
  $$,
  'repeating the same own-password operation is idempotent'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000008',
  true
);
set local role authenticated;

select is(
  (
    select format('%s|%s', is_active, must_change_password)
    from public.get_own_account_state()
  ),
  'f|f',
  'an inactive session can resolve only its minimum account state'
);

reset role;

select throws_ok(
  $$
    select public.complete_own_password_change(
      '10000000-0000-4000-8000-000000000008',
      '82000000-0000-4000-8000-000000000002'
    )
  $$,
  'P0001',
  'DF_ACCOUNT_INACTIVE',
  'an inactive account cannot complete a password change'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);

select throws_ok(
  $$
    select public.finalize_member_account_creation(
      '10000000-0000-4000-8000-000000000002',
      '81000000-0000-4000-8000-000000000001',
      '[SYNTHETIC TEST] New Designer',
      'new-designer@design-flow.example.invalid',
      'designer',
      false,
      '10000000-0000-4000-8000-000000000004',
      '82000000-0000-4000-8000-000000000003'
    )
  $$,
  'P0001',
  'DF_FORBIDDEN',
  'a non-Admin Designer cannot finalize account creation'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000007',
  true
);

select lives_ok(
  $$
    select public.finalize_member_account_creation(
      '10000000-0000-4000-8000-000000000007',
      '81000000-0000-4000-8000-000000000001',
      '[SYNTHETIC TEST] New Designer',
      'new-designer@design-flow.example.invalid',
      'designer',
      false,
      '10000000-0000-4000-8000-000000000004',
      '82000000-0000-4000-8000-000000000003'
    )
  $$,
  'an Admin can finalize an eligible account creation'
);

select is(
  (
    select format(
      '%s|%s|%s|%s',
      position_code,
      is_admin,
      must_change_password,
      current_reports_to_id
    )
    from public.profiles
    where id = '81000000-0000-4000-8000-000000000001'
  ),
  'designer|f|t|10000000-0000-4000-8000-000000000004',
  'account creation writes the approved current access snapshot'
);

select is(
  (
    select count(*)::integer
    from public.profile_access_periods
    where profile_id = '81000000-0000-4000-8000-000000000001'
      and ended_at is null
  ),
  1,
  'account creation opens exactly one access period'
);

select is(
  (
    select count(*)::integer
    from public.reporting_line_assignments
    where person_id = '81000000-0000-4000-8000-000000000001'
      and ended_on is null
  ),
  1,
  'account creation opens the required reporting line'
);

select lives_ok(
  $$
    select public.finalize_member_account_creation(
      '10000000-0000-4000-8000-000000000007',
      '81000000-0000-4000-8000-000000000001',
      '[SYNTHETIC TEST] New Designer',
      'new-designer@design-flow.example.invalid',
      'designer',
      false,
      '10000000-0000-4000-8000-000000000004',
      '82000000-0000-4000-8000-000000000003'
    )
  $$,
  'the same account-creation operation returns without duplicate effects'
);

select is(
  (
    select count(*)::integer
    from public.admin_audit_events
    where operation_id = '82000000-0000-4000-8000-000000000003'
      and event_type_code = 'account_created'
  ),
  1,
  'account creation audit is exactly once'
);

select throws_ok(
  $$
    select public.finalize_member_account_creation(
      '10000000-0000-4000-8000-000000000007',
      '81000000-0000-4000-8000-000000000001',
      '[SYNTHETIC TEST] Changed Intent',
      'new-designer@design-flow.example.invalid',
      'designer',
      false,
      '10000000-0000-4000-8000-000000000004',
      '82000000-0000-4000-8000-000000000003'
    )
  $$,
  'P0001',
  'DF_IDEMPOTENCY_MISMATCH',
  'an operation ID cannot be reused with different account intent'
);

select throws_ok(
  $$
    select public.finalize_member_account_creation(
      '10000000-0000-4000-8000-000000000007',
      '81000000-0000-4000-8000-000000000002',
      '[SYNTHETIC TEST] Invalid Viewer Admin',
      'invalid-viewer-admin@design-flow.example.invalid',
      'viewer',
      true,
      null,
      '82000000-0000-4000-8000-000000000004'
    )
  $$,
  'P0001',
  'DF_INVALID_VIEWER_ADMIN',
  'Viewer plus Admin is rejected by account creation'
);

select is(
  (
    public.prepare_temporary_password_reset(
      '10000000-0000-4000-8000-000000000007',
      '81000000-0000-4000-8000-000000000001',
      '82000000-0000-4000-8000-000000000005'
    ) ->> 'operation_state'
  ),
  'pending_external',
  'temporary password reset prepares a fail-closed pending operation'
);

select lives_ok(
  $$
    select public.finalize_temporary_password_reset(
      '10000000-0000-4000-8000-000000000007',
      '82000000-0000-4000-8000-000000000005'
    )
  $$,
  'temporary password reset finalizes after the external Auth update'
);

select is(
  (
    select count(*)::integer
    from public.admin_audit_events
    where operation_id = '82000000-0000-4000-8000-000000000005'
      and event_type_code = 'password_reset_issued'
  ),
  1,
  'temporary password reset audit is exactly once and credential-free'
);

select lives_ok(
  $$
    select public.finalize_member_reactivation(
      '10000000-0000-4000-8000-000000000007',
      '10000000-0000-4000-8000-000000000008',
      'designer',
      false,
      '10000000-0000-4000-8000-000000000004',
      true,
      '82000000-0000-4000-8000-000000000006'
    )
  $$,
  'an Admin can reactivate an inactive member with a valid supervisor'
);

select is(
  (
    select format('%s|%s|%s', is_active, must_change_password, current_reports_to_id)
    from public.profiles
    where id = '10000000-0000-4000-8000-000000000008'
  ),
  't|t|10000000-0000-4000-8000-000000000004',
  'reactivation restores access state without recreating the profile'
);

select is(
  (
    public.prepare_member_deactivation(
      '10000000-0000-4000-8000-000000000007',
      '10000000-0000-4000-8000-000000000003',
      '[]'::jsonb,
      '[]'::jsonb,
      '82000000-0000-4000-8000-000000000007'
    ) ->> 'operation_state'
  ),
  'pending_external',
  'deactivation prepares database denial before the Auth disable step'
);

select is(
  (
    public.prepare_member_deactivation(
      '10000000-0000-4000-8000-000000000007',
      '10000000-0000-4000-8000-000000000003',
      '[]'::jsonb,
      '[]'::jsonb,
      '82000000-0000-4000-8000-000000000007'
    ) ->> 'operation_state'
  ),
  'pending_external',
  'deactivation retry resumes the pending Auth disable without repeating database effects'
);

select is(
  (
    public.prepare_member_deactivation(
      '10000000-0000-4000-8000-000000000007',
      '10000000-0000-4000-8000-000000000005',
      '[]'::jsonb,
      '[]'::jsonb,
      '82000000-0000-4000-8000-000000000008'
    ) ->> 'operation_state'
  ),
  'pending_external',
  'another Admin can be deactivated while one active Admin remains'
);

select throws_ok(
  $$
    select public.prepare_member_deactivation(
      '10000000-0000-4000-8000-000000000007',
      '10000000-0000-4000-8000-000000000007',
      '[]'::jsonb,
      '[]'::jsonb,
      '82000000-0000-4000-8000-000000000009'
    )
  $$,
  'P0001',
  'DF_FINAL_ADMIN',
  'the final active Admin cannot be deactivated'
);

select is(
  (
    select count(*)::integer
    from public.admin_audit_events
    where operation_id in (
      '82000000-0000-4000-8000-000000000007',
      '82000000-0000-4000-8000-000000000008'
    )
      and event_type_code = 'account_deactivated'
  ),
  2,
  'each prepared deactivation records one account audit event'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.finalize_first_admin_bootstrap(uuid,text,text,text,uuid)',
    'EXECUTE'
  ),
  'the browser role cannot execute first-Admin bootstrap finalization'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.get_edge_operation_result(uuid,text,jsonb)',
    'EXECUTE'
  ),
  'the browser role cannot inspect service-only Edge operation state'
);

select is(
  (
    select count(*)::integer
    from unnest(array[
      'public.finalize_member_account_creation(uuid,uuid,text,text,text,boolean,uuid,uuid)',
      'public.prepare_temporary_password_reset(uuid,uuid,uuid)',
      'public.finalize_temporary_password_reset(uuid,uuid)',
      'public.prepare_member_deactivation(uuid,uuid,jsonb,jsonb,uuid)',
      'public.finalize_member_deactivation(uuid,uuid)',
      'public.finalize_member_reactivation(uuid,uuid,text,boolean,uuid,boolean,uuid)',
      'public.complete_own_password_change(uuid,uuid)'
    ]) function_signature
    where has_function_privilege(
      'authenticated',
      function_signature,
      'EXECUTE'
    )
  ),
  0,
  'authenticated browser clients cannot execute any account-lifecycle finalizer or prepare RPC'
);

select is(
  (
    select count(*)::integer
    from unnest(array[
      'public.finalize_member_account_creation(uuid,uuid,text,text,text,boolean,uuid,uuid)',
      'public.prepare_temporary_password_reset(uuid,uuid,uuid)',
      'public.finalize_temporary_password_reset(uuid,uuid)',
      'public.prepare_member_deactivation(uuid,uuid,jsonb,jsonb,uuid)',
      'public.finalize_member_deactivation(uuid,uuid)',
      'public.finalize_member_reactivation(uuid,uuid,text,boolean,uuid,boolean,uuid)',
      'public.complete_own_password_change(uuid,uuid)'
    ]) function_signature
    where has_function_privilege(
      'service_role',
      function_signature,
      'EXECUTE'
    )
  ),
  7,
  'the service-role Edge boundary can execute every account-lifecycle RPC'
);

select is(
  (
    select count(*)::integer
    from unnest(array[
      'id',
      'email',
      'position_code',
      'is_admin',
      'is_active',
      'must_change_password'
    ]) column_name
    where has_column_privilege(
      'service_role',
      'public.profiles',
      column_name,
      'SELECT'
    )
  ),
  6,
  'the service-role Edge boundary can read its minimum profile authorization projection'
);

select ok(
  not has_column_privilege(
    'service_role',
    'public.profiles',
    'display_name',
    'SELECT'
  ),
  'the service-role Edge boundary receives no unrelated profile-column grant'
);

reset role;

update public.profiles
set must_change_password = true
where id = '10000000-0000-4000-8000-000000000007';

select is(
  (
    public.prepare_first_admin_credential_recovery(
      'manager-admin@design-flow.example.invalid',
      '82000000-0000-4000-8000-000000000010'
    ) ->> 'operation_state'
  ),
  'pending_external',
  'the protected bootstrap recovery prepares exactly one external rotation'
);

select lives_ok(
  $$select public.finalize_first_admin_credential_recovery('82000000-0000-4000-8000-000000000010')$$,
  'the bootstrap recovery finalizes after the Auth password rotation'
);

select is(
  (
    select result ->> 'email'
    from public.operation_requests
    where id = '82000000-0000-4000-8000-000000000010'
  ),
  'manager-admin@design-flow.example.invalid',
  'bootstrap recovery stores only the non-secret account result'
);

select is(
  (
    select count(*)::integer
    from public.admin_audit_events
    where operation_id = '82000000-0000-4000-8000-000000000010'
      and event_type_code = 'bootstrap_completed'
      and new_values ->> 'credential_recovery' = 'true'
  ),
  1,
  'bootstrap credential recovery is audited without credential content'
);

select throws_ok(
  $$
    select public.prepare_first_admin_credential_recovery(
      'manager-admin@design-flow.example.invalid',
      '82000000-0000-4000-8000-000000000011'
    )
  $$,
  'P0001',
  'DF_INVALID_STATE',
  'bootstrap credential recovery cannot be consumed a second time'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.prepare_first_admin_credential_recovery(text,uuid)',
    'EXECUTE'
  ),
  'the browser role cannot execute protected bootstrap recovery'
);

select ok(
  position(
    'current_date date := private.current_team_date();' in pg_get_functiondef(
    'public.set_member_access(uuid,text,boolean,uuid,timestamptz,jsonb,uuid)'::regprocedure
    )
  ) = 0,
  'member access changes do not shadow the PostgreSQL current_date special value'
);

select ok(
  position(
    'team_date date := private.current_team_date();' in pg_get_functiondef(
    'public.set_member_access(uuid,text,boolean,uuid,timestamptz,jsonb,uuid)'::regprocedure
    )
  ) > 0,
  'member access changes retain the authoritative team-local date helper'
);

select ok(
  position(
    'current_date date := private.current_team_date();' in pg_get_functiondef(
    'public.prepare_member_deactivation(uuid,uuid,jsonb,jsonb,uuid)'::regprocedure
    )
  ) = 0,
  'member deactivation does not shadow the PostgreSQL current_date special value'
);

select ok(
  position(
    'team_date date := private.current_team_date();' in pg_get_functiondef(
    'public.prepare_member_deactivation(uuid,uuid,jsonb,jsonb,uuid)'::regprocedure
    )
  ) > 0,
  'member deactivation retains the authoritative team-local date helper'
);

select ok(
  position(
    'current_date date := private.current_team_date();' in pg_get_functiondef(
    'public.finalize_member_reactivation(uuid,uuid,text,boolean,uuid,boolean,uuid)'::regprocedure
    )
  ) = 0,
  'member reactivation does not shadow the PostgreSQL current_date special value'
);

select ok(
  position(
    'team_date date := private.current_team_date();' in pg_get_functiondef(
    'public.finalize_member_reactivation(uuid,uuid,text,boolean,uuid,boolean,uuid)'::regprocedure
    )
  ) > 0,
  'member reactivation retains the authoritative team-local date helper'
);

select * from finish();

rollback;
