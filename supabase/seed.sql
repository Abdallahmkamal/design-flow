-- Design Flow Phase 1 local/staging seed.
--
-- Every person and datum below is visibly synthetic. The auth rows are
-- placeholder principals for foreign keys and RLS tests; they intentionally
-- have no password and cannot sign in. Phase 2 owns login-capable account
-- creation through the approved Auth-admin boundary.

begin;

set constraints all deferred;

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'viewer@design-flow.example.invalid',
    '{"synthetic": true}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'designer@design-flow.example.invalid',
    '{"synthetic": true}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'designer-admin@design-flow.example.invalid',
    '{"synthetic": true}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'lead@design-flow.example.invalid',
    '{"synthetic": true}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'lead-admin@design-flow.example.invalid',
    '{"synthetic": true}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    'manager@design-flow.example.invalid',
    '{"synthetic": true}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000007',
    'manager-admin@design-flow.example.invalid',
    '{"synthetic": true}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000008',
    'inactive-designer@design-flow.example.invalid',
    '{"synthetic": true}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000009',
    'password-restricted-designer@design-flow.example.invalid',
    '{"synthetic": true}'::jsonb
  )
on conflict (id) do update
set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data;

insert into public.profiles (
  id,
  email,
  display_name,
  position_code,
  is_admin,
  is_active,
  must_change_password,
  current_reports_to_id,
  created_by
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'viewer@design-flow.example.invalid',
    '[SYNTHETIC] Viewer',
    'viewer',
    false,
    true,
    false,
    null,
    '10000000-0000-4000-8000-000000000007'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'designer@design-flow.example.invalid',
    '[SYNTHETIC] Designer',
    'designer',
    false,
    true,
    false,
    '10000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000007'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'designer-admin@design-flow.example.invalid',
    '[SYNTHETIC] Designer + Admin',
    'designer',
    true,
    true,
    false,
    '10000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000007'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'lead@design-flow.example.invalid',
    '[SYNTHETIC] Lead',
    'lead',
    false,
    true,
    false,
    '10000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000007'
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'lead-admin@design-flow.example.invalid',
    '[SYNTHETIC] Lead + Admin',
    'lead',
    true,
    true,
    false,
    '10000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000007'
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    'manager@design-flow.example.invalid',
    '[SYNTHETIC] Manager',
    'manager',
    false,
    true,
    false,
    null,
    '10000000-0000-4000-8000-000000000007'
  ),
  (
    '10000000-0000-4000-8000-000000000007',
    'manager-admin@design-flow.example.invalid',
    '[SYNTHETIC] Manager + Admin',
    'manager',
    true,
    true,
    false,
    null,
    null
  ),
  (
    '10000000-0000-4000-8000-000000000008',
    'inactive-designer@design-flow.example.invalid',
    '[SYNTHETIC] Inactive Designer',
    'designer',
    false,
    false,
    false,
    null,
    '10000000-0000-4000-8000-000000000007'
  ),
  (
    '10000000-0000-4000-8000-000000000009',
    'password-restricted-designer@design-flow.example.invalid',
    '[SYNTHETIC] Password-restricted Designer',
    'designer',
    false,
    true,
    true,
    '10000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000007'
  )
on conflict (id) do update
set
  email = excluded.email,
  display_name = excluded.display_name,
  position_code = excluded.position_code,
  is_admin = excluded.is_admin,
  is_active = excluded.is_active,
  must_change_password = excluded.must_change_password,
  current_reports_to_id = excluded.current_reports_to_id,
  created_by = excluded.created_by;

insert into public.operation_requests (
  id,
  operation_code,
  actor_id,
  request_hash,
  state,
  result,
  created_at,
  updated_at,
  completed_at
)
select
  operation.id,
  operation.operation_code,
  '10000000-0000-4000-8000-000000000007'::uuid,
  encode(extensions.digest(operation.id::text, 'sha256'), 'hex'),
  'completed',
  jsonb_build_object('synthetic', true),
  '2026-01-01 09:00:00+00'::timestamptz,
  '2026-01-01 09:00:00+00'::timestamptz,
  '2026-01-01 09:00:00+00'::timestamptz
from (
  values
    ('30000000-0000-4000-8000-000000000001'::uuid, 'seed_viewer'),
    ('30000000-0000-4000-8000-000000000002'::uuid, 'seed_designer'),
    ('30000000-0000-4000-8000-000000000003'::uuid, 'seed_designer_admin'),
    ('30000000-0000-4000-8000-000000000004'::uuid, 'seed_lead'),
    ('30000000-0000-4000-8000-000000000005'::uuid, 'seed_lead_admin'),
    ('30000000-0000-4000-8000-000000000006'::uuid, 'seed_manager'),
    ('30000000-0000-4000-8000-000000000007'::uuid, 'seed_manager_admin'),
    ('30000000-0000-4000-8000-000000000008'::uuid, 'seed_inactive_designer'),
    ('30000000-0000-4000-8000-000000000009'::uuid, 'seed_password_restricted_designer'),
    ('30000000-0000-4000-8000-000000000010'::uuid, 'seed_bootstrap')
) as operation(id, operation_code)
on conflict (id) do update
set
  operation_code = excluded.operation_code,
  actor_id = excluded.actor_id,
  request_hash = excluded.request_hash,
  state = excluded.state,
  result = excluded.result,
  updated_at = excluded.updated_at,
  completed_at = excluded.completed_at;

insert into public.profile_access_periods (
  id,
  profile_id,
  position_code,
  is_admin,
  is_active,
  started_at,
  changed_by,
  start_operation_id
)
select
  ('20000000-0000-4000-8000-' || lpad(person.ordinal::text, 12, '0'))::uuid,
  person.profile_id,
  person.position_code,
  person.is_admin,
  person.is_active,
  '2026-01-01 09:00:00+00'::timestamptz,
  '10000000-0000-4000-8000-000000000007'::uuid,
  ('30000000-0000-4000-8000-' || lpad(person.ordinal::text, 12, '0'))::uuid
from (
  values
    (1, '10000000-0000-4000-8000-000000000001'::uuid, 'viewer', false, true),
    (2, '10000000-0000-4000-8000-000000000002'::uuid, 'designer', false, true),
    (3, '10000000-0000-4000-8000-000000000003'::uuid, 'designer', true, true),
    (4, '10000000-0000-4000-8000-000000000004'::uuid, 'lead', false, true),
    (5, '10000000-0000-4000-8000-000000000005'::uuid, 'lead', true, true),
    (6, '10000000-0000-4000-8000-000000000006'::uuid, 'manager', false, true),
    (7, '10000000-0000-4000-8000-000000000007'::uuid, 'manager', true, true),
    (8, '10000000-0000-4000-8000-000000000008'::uuid, 'designer', false, false),
    (9, '10000000-0000-4000-8000-000000000009'::uuid, 'designer', false, true)
) as person(ordinal, profile_id, position_code, is_admin, is_active)
on conflict (id) do update
set
  position_code = excluded.position_code,
  is_admin = excluded.is_admin,
  is_active = excluded.is_active,
  changed_by = excluded.changed_by,
  start_operation_id = excluded.start_operation_id;

insert into public.reporting_line_assignments (
  id,
  person_id,
  supervisor_id,
  started_on,
  assigned_by,
  start_operation_id
)
values
  (
    '40000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000004',
    '2026-01-01',
    '10000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000002'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000004',
    '2026-01-01',
    '10000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000003'
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000006',
    '2026-01-01',
    '10000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000004'
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000006',
    '2026-01-01',
    '10000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000005'
  ),
  (
    '40000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000004',
    '2026-01-01',
    '10000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000009'
  )
on conflict (id) do update
set
  supervisor_id = excluded.supervisor_id,
  started_on = excluded.started_on,
  assigned_by = excluded.assigned_by,
  start_operation_id = excluded.start_operation_id;

update public.team_settings
set
  timezone = 'Africa/Cairo',
  updated_by = '10000000-0000-4000-8000-000000000007',
  updated_at = '2026-01-01 09:00:00+00'
where singleton_key;

update public.bootstrap_state
set
  consumed_at = '2026-01-01 09:00:00+00',
  first_admin_profile_id = '10000000-0000-4000-8000-000000000007',
  operation_id = '30000000-0000-4000-8000-000000000010'
where singleton_key;

insert into public.work_areas (
  id,
  name,
  sort_order,
  created_by,
  created_at,
  updated_by,
  updated_at
)
values (
  '50000000-0000-4000-8000-000000000001',
  '[SYNTHETIC] Internal Experience',
  1,
  '10000000-0000-4000-8000-000000000007',
  '2026-01-01 09:00:00+00',
  '10000000-0000-4000-8000-000000000007',
  '2026-01-01 09:00:00+00'
)
on conflict (id) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = true,
  archived_by = null,
  archived_at = null,
  updated_by = excluded.updated_by,
  updated_at = excluded.updated_at;

insert into public.labels (
  id,
  name,
  sort_order,
  created_by,
  created_at,
  updated_by,
  updated_at
)
values (
  '60000000-0000-4000-8000-000000000001',
  '[SYNTHETIC] Foundation',
  1,
  '10000000-0000-4000-8000-000000000007',
  '2026-01-01 09:00:00+00',
  '10000000-0000-4000-8000-000000000007',
  '2026-01-01 09:00:00+00'
)
on conflict (id) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = true,
  archived_by = null,
  archived_at = null,
  updated_by = excluded.updated_by,
  updated_at = excluded.updated_at;

commit;
