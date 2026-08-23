begin;

select plan(28);

select has_column('public', 'profiles', 'avatar_path', 'profiles stores a nullable avatar path');
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'avatar_path', 'SELECT'),
  'authenticated application users can resolve the stored avatar path'
);
select ok(
  exists (
    select 1 from storage.buckets
    where id = 'profile-avatars'
      and not public
      and file_size_limit = 2097152
      and allowed_mime_types @> array['image/jpeg', 'image/png', 'image/webp']
  ),
  'the private avatar bucket enforces the approved size and MIME types'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like '%profile avatars%'),
  4,
  'avatar objects have one authenticated read and three Admin mutation policies'
);

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000007', true);
select set_config('design_flow.slice2_member_version', (
  select updated_at::text from public.profiles where id = '10000000-0000-4000-8000-000000000002'
), true);
set local role authenticated;

select lives_ok(
  $$ select public.update_member_profile(
    '10000000-0000-4000-8000-000000000002',
    '[SYNTHETIC] Renamed Designer',
    '10000000-0000-4000-8000-000000000002/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp',
    current_setting('design_flow.slice2_member_version')::timestamptz,
    '92000000-0000-4000-8000-000000000001'
  ) $$,
  'Admin can update display name and avatar path atomically'
);
reset role;
select is(
  (select display_name::text from public.profiles where id = '10000000-0000-4000-8000-000000000002'),
  '[SYNTHETIC] Renamed Designer',
  'the current profile name is authoritative'
);
select is(
  (select count(*)::integer from public.admin_audit_events where operation_id = '92000000-0000-4000-8000-000000000001'),
  2,
  'name and avatar changes each produce an Admin audit event'
);
select is(
  (select email::text from public.profiles where id = '10000000-0000-4000-8000-000000000002'),
  'designer@design-flow.example.invalid',
  'profile editing does not alter the login email'
);

select set_config('design_flow.slice2_member_version', (
  select updated_at::text from public.profiles where id = '10000000-0000-4000-8000-000000000002'
), true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
set local role authenticated;
select throws_ok(
  $$ select public.update_member_profile(
    '10000000-0000-4000-8000-000000000002', 'Unauthorized', null,
    current_setting('design_flow.slice2_member_version')::timestamptz,
    '92000000-0000-4000-8000-000000000002'
  ) $$,
  'P0001', 'DF_FORBIDDEN', 'non-Admin cannot update member profiles'
);
select throws_ok(
  $$ update public.profiles set avatar_path = null where id = '10000000-0000-4000-8000-000000000002' $$,
  '42501', null, 'direct profile writes remain denied'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000007', true);
set local role authenticated;
select set_config('design_flow.slice2_item', (
  public.create_work_item(
    '[SYNTHETIC TEST] Password-pending assignee', null,
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000009', null, null, null,
    array[]::uuid[], '92000000-0000-4000-8000-000000000003'
  ) ->> 'id'
), true);
select ok(
  current_setting('design_flow.slice2_item')::uuid is not null,
  'an active eligible password-pending member can be assigned'
);
select lives_ok(
  $$ select public.submit_work_log(
    'ticket', current_setting('design_flow.slice2_item')::uuid, null,
    '10000000-0000-4000-8000-000000000009',
    '[{"work_date":"2026-08-20","work_type_code":"ui_visual_design"}]'::jsonb,
    null, '92000000-0000-4000-8000-000000000004'
  ) $$,
  'authorized staff can log work for an active password-pending member'
);
reset role;
select is(
  (select worked_by from public.work_log_batches where create_operation_id = '92000000-0000-4000-8000-000000000004'),
  '10000000-0000-4000-8000-000000000009'::uuid,
  'the password-pending member receives work attribution'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000009', true);
set local role authenticated;
select throws_ok(
  $$ select public.submit_work_log(
    'standalone_visual', null, null, null,
    '[{"work_date":"2026-08-20","work_type_code":"resizing_adaptation"}]'::jsonb,
    null, '92000000-0000-4000-8000-000000000005'
  ) $$,
  'P0001', 'DF_PASSWORD_CHANGE_REQUIRED',
  'password-pending members remain gated from entering normal application operations themselves'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select lives_ok(
  $$ select public.submit_work_log(
    'ticket', current_setting('design_flow.slice2_item')::uuid, null, null,
    '[
      {"work_date":"2026-08-18","work_type_code":"ui_visual_design","description":"first"},
      {"work_date":"2026-08-17","work_type_code":"review_iteration","description":"sibling"}
    ]'::jsonb,
    null, '92000000-0000-4000-8000-000000000006'
  ) $$,
  'a multi-date batch is available for entry-isolation testing'
);
reset role;
select set_config('design_flow.slice2_batch', (
  select id::text from public.work_log_batches where create_operation_id = '92000000-0000-4000-8000-000000000006'
), true);
select set_config('design_flow.slice2_entry', (
  select id::text from public.work_log_entries
  where batch_id = current_setting('design_flow.slice2_batch')::uuid and position = 1
), true);
select set_config('design_flow.slice2_sibling', (
  select id::text from public.work_log_entries
  where batch_id = current_setting('design_flow.slice2_batch')::uuid and position = 2
), true);
select set_config('design_flow.slice2_version', (
  select updated_at::text from public.work_log_entries where id = current_setting('design_flow.slice2_entry')::uuid
), true);
set local role authenticated;
select lives_ok(
  $$ select public.correct_work_log_entry(
    current_setting('design_flow.slice2_entry')::uuid,
    current_setting('design_flow.slice2_version')::timestamptz,
    '2026-08-19', 'testing_validation', 'corrected entry only',
    '92000000-0000-4000-8000-000000000007'
  ) $$,
  'a Designer can correct one own-attributed entry'
);
reset role;
select is(
  (select work_date from public.work_log_entries where id = current_setting('design_flow.slice2_entry')::uuid),
  date '2026-08-19',
  'the target entry changes'
);
select is(
  (select work_date from public.work_log_entries where id = current_setting('design_flow.slice2_sibling')::uuid),
  date '2026-08-17',
  'the sibling entry date is untouched'
);
select is(
  (select description from public.work_log_entries where id = current_setting('design_flow.slice2_sibling')::uuid),
  'sibling',
  'the sibling entry body is untouched'
);
select is(
  (select count(*)::integer from public.work_log_entry_revisions where entry_id = current_setting('design_flow.slice2_entry')::uuid),
  1,
  'the correction appends exactly one entry revision'
);
select is(
  (select count(*)::integer from public.work_log_entry_revisions where entry_id = current_setting('design_flow.slice2_sibling')::uuid),
  0,
  'the correction creates no sibling revision'
);
select is(
  (select count(*)::integer from public.work_item_events where operation_id = '92000000-0000-4000-8000-000000000007'),
  1,
  'the correction emits exactly one ticket event'
);
select is(
  (select worked_by from public.work_log_batches where id = current_setting('design_flow.slice2_batch')::uuid),
  '10000000-0000-4000-8000-000000000002'::uuid,
  'entry correction cannot alter attribution'
);
set local role authenticated;
select throws_ok(
  $$ select public.correct_work_log_entry(
    current_setting('design_flow.slice2_entry')::uuid,
    current_setting('design_flow.slice2_version')::timestamptz,
    '2026-08-16', 'ui_visual_design', 'stale overwrite',
    '92000000-0000-4000-8000-000000000008'
  ) $$,
  'P0001', 'DF_CONFLICT', 'stale entry versions fail explicitly'
);
select ok(
  (public.get_work_log_entry(current_setting('design_flow.slice2_entry')::uuid) ->> 'canCorrect')::boolean,
  'entry read contract exposes current correction authority'
);
select is(
  public.get_work_log_entry(current_setting('design_flow.slice2_entry')::uuid) ->> 'workTypeCode',
  'testing_validation',
  'entry read contract returns current allowed values only'
);

reset role;
select set_config('design_flow.slice2_current_entry_version', (
  select updated_at::text from public.work_log_entries where id = current_setting('design_flow.slice2_entry')::uuid
), true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select is(
  public.get_work_log_entry(current_setting('design_flow.slice2_entry')::uuid) ->> 'canCorrect',
  'false',
  'Viewer can read allowed current entry data but cannot correct it'
);
select throws_ok(
  $$ select public.correct_work_log_entry(
    current_setting('design_flow.slice2_entry')::uuid,
    current_setting('design_flow.slice2_current_entry_version')::timestamptz,
    '2026-08-16', 'ui_visual_design', 'forbidden',
    '92000000-0000-4000-8000-000000000009'
  ) $$,
  'P0001', 'DF_FORBIDDEN', 'Viewer cannot correct a work entry'
);

select * from finish();
rollback;
