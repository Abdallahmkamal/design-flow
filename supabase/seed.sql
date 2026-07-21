-- Design Flow local development and test seed.
--
-- Every person and datum below is visibly synthetic. These local-only Auth
-- users share one documented synthetic development password so the approved
-- authentication states can be exercised after a reset. Hosted environments
-- are provisioned only through the protected account lifecycle functions.

begin;

set constraints all deferred;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'viewer@design-flow.example.invalid',
    extensions.crypt('LocalSynthetic!Pass2026', extensions.gen_salt('bf')),
    '2026-01-01 09:00:00+00'::timestamptz,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"synthetic": true}'::jsonb,
    '2026-01-01 09:00:00+00'::timestamptz,
    '2026-01-01 09:00:00+00'::timestamptz
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'designer@design-flow.example.invalid',
    extensions.crypt('LocalSynthetic!Pass2026', extensions.gen_salt('bf')),
    '2026-01-01 09:00:00+00'::timestamptz,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"synthetic": true}'::jsonb,
    '2026-01-01 09:00:00+00'::timestamptz,
    '2026-01-01 09:00:00+00'::timestamptz
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'designer-admin@design-flow.example.invalid',
    extensions.crypt('LocalSynthetic!Pass2026', extensions.gen_salt('bf')),
    '2026-01-01 09:00:00+00'::timestamptz,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"synthetic": true}'::jsonb,
    '2026-01-01 09:00:00+00'::timestamptz,
    '2026-01-01 09:00:00+00'::timestamptz
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'lead@design-flow.example.invalid',
    extensions.crypt('LocalSynthetic!Pass2026', extensions.gen_salt('bf')),
    '2026-01-01 09:00:00+00'::timestamptz,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"synthetic": true}'::jsonb,
    '2026-01-01 09:00:00+00'::timestamptz,
    '2026-01-01 09:00:00+00'::timestamptz
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000005',
    'authenticated',
    'authenticated',
    'lead-admin@design-flow.example.invalid',
    extensions.crypt('LocalSynthetic!Pass2026', extensions.gen_salt('bf')),
    '2026-01-01 09:00:00+00'::timestamptz,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"synthetic": true}'::jsonb,
    '2026-01-01 09:00:00+00'::timestamptz,
    '2026-01-01 09:00:00+00'::timestamptz
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000006',
    'authenticated',
    'authenticated',
    'manager@design-flow.example.invalid',
    extensions.crypt('LocalSynthetic!Pass2026', extensions.gen_salt('bf')),
    '2026-01-01 09:00:00+00'::timestamptz,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"synthetic": true}'::jsonb,
    '2026-01-01 09:00:00+00'::timestamptz,
    '2026-01-01 09:00:00+00'::timestamptz
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000007',
    'authenticated',
    'authenticated',
    'manager-admin@design-flow.example.invalid',
    extensions.crypt('LocalSynthetic!Pass2026', extensions.gen_salt('bf')),
    '2026-01-01 09:00:00+00'::timestamptz,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"synthetic": true}'::jsonb,
    '2026-01-01 09:00:00+00'::timestamptz,
    '2026-01-01 09:00:00+00'::timestamptz
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000008',
    'authenticated',
    'authenticated',
    'inactive-designer@design-flow.example.invalid',
    extensions.crypt('LocalSynthetic!Pass2026', extensions.gen_salt('bf')),
    '2026-01-01 09:00:00+00'::timestamptz,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"synthetic": true}'::jsonb,
    '2026-01-01 09:00:00+00'::timestamptz,
    '2026-01-01 09:00:00+00'::timestamptz
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000009',
    'authenticated',
    'authenticated',
    'password-restricted-designer@design-flow.example.invalid',
    extensions.crypt('LocalSynthetic!Pass2026', extensions.gen_salt('bf')),
    '2026-01-01 09:00:00+00'::timestamptz,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"synthetic": true}'::jsonb,
    '2026-01-01 09:00:00+00'::timestamptz,
    '2026-01-01 09:00:00+00'::timestamptz
  )
on conflict (id) do update
set
  instance_id = excluded.instance_id,
  aud = excluded.aud,
  role = excluded.role,
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

-- GoTrue's password-login query expects these token placeholders to be empty
-- strings, matching Auth Admin-created users, rather than SQL nulls.
update auth.users
set
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change = ''
where raw_user_meta_data @> '{"synthetic": true}'::jsonb;

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  fixture.id::text,
  fixture.id,
  jsonb_build_object(
    'sub', fixture.id::text,
    'email', fixture.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  '2026-01-01 09:00:00+00'::timestamptz,
  '2026-01-01 09:00:00+00'::timestamptz,
  '2026-01-01 09:00:00+00'::timestamptz
from (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'viewer@design-flow.example.invalid'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'designer@design-flow.example.invalid'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'designer-admin@design-flow.example.invalid'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'lead@design-flow.example.invalid'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'lead-admin@design-flow.example.invalid'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'manager@design-flow.example.invalid'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'manager-admin@design-flow.example.invalid'),
    ('10000000-0000-4000-8000-000000000008'::uuid, 'inactive-designer@design-flow.example.invalid'),
    ('10000000-0000-4000-8000-000000000009'::uuid, 'password-restricted-designer@design-flow.example.invalid')
) as fixture(id, email)
on conflict (provider_id, provider) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = excluded.updated_at;

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

-- Phase 3 work-item fixtures are opt-in so the established pgTAP suites retain
-- their empty-work-item precondition. Load supabase/fixtures/phase3_work_items.sql
-- after a reset for browser and manual acceptance work.
do $phase3_fixtures$
begin
if current_setting('design_flow.phase3_fixtures', true) = 'on' then

-- Titles and bodies deliberately retain the [SYNTHETIC] marker so local
-- screenshots cannot be mistaken for real data.
insert into public.operation_requests (
  id, operation_code, actor_id, request_hash, state, result,
  created_at, updated_at, completed_at
)
select
  fixture.id,
  fixture.operation_code,
  fixture.actor_id,
  encode(extensions.digest(fixture.id::text, 'sha256'), 'hex'),
  'completed',
  jsonb_build_object('synthetic', true),
  fixture.occurred_at,
  fixture.occurred_at,
  fixture.occurred_at
from (
  values
    ('30000000-0000-4000-8000-000000000101'::uuid, 'seed_work_item_backlog', '10000000-0000-4000-8000-000000000002'::uuid, '2026-07-14 08:00:00+00'::timestamptz),
    ('30000000-0000-4000-8000-000000000102'::uuid, 'seed_work_item_blocked', '10000000-0000-4000-8000-000000000004'::uuid, '2026-07-15 09:00:00+00'::timestamptz),
    ('30000000-0000-4000-8000-000000000103'::uuid, 'seed_work_item_progress', '10000000-0000-4000-8000-000000000003'::uuid, '2026-07-16 10:00:00+00'::timestamptz),
    ('30000000-0000-4000-8000-000000000104'::uuid, 'seed_work_item_done', '10000000-0000-4000-8000-000000000004'::uuid, '2026-07-10 11:00:00+00'::timestamptz),
    ('30000000-0000-4000-8000-000000000105'::uuid, 'seed_work_item_archived', '10000000-0000-4000-8000-000000000006'::uuid, '2026-07-08 12:00:00+00'::timestamptz),
    ('30000000-0000-4000-8000-000000000106'::uuid, 'seed_work_item_long_content', '10000000-0000-4000-8000-000000000007'::uuid, '2026-07-17 13:00:00+00'::timestamptz)
) fixture(id, operation_code, actor_id, occurred_at);

insert into public.work_items (
  id, title, description, area_id, status_code, primary_assignee_id,
  planned_start_date, due_date, figma_url, created_by, created_at,
  updated_at, last_activity_at, completed_at, archived_by, archived_at
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    '[SYNTHETIC] Prepare empty-state content',
    '[SYNTHETIC] Draft concise guidance for the local development fixture.',
    '50000000-0000-4000-8000-000000000001', 'backlog', null,
    '2026-07-22', '2026-07-28', 'https://www.figma.com/design/synthetic-empty-state',
    '10000000-0000-4000-8000-000000000002', '2026-07-14 08:00:00+00',
    '2026-07-14 08:00:00+00', '2026-07-14 08:00:00+00', null, null, null
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    '[SYNTHETIC] Validate responsive ticket cards',
    '[SYNTHETIC] Exercise the active-blocker and mobile-card states.',
    '50000000-0000-4000-8000-000000000001', 'todo',
    '10000000-0000-4000-8000-000000000002',
    '2026-07-15', '2026-07-23', 'https://www.figma.com/design/synthetic-ticket-cards',
    '10000000-0000-4000-8000-000000000004', '2026-07-15 09:00:00+00',
    '2026-07-15 09:00:00+00', '2026-07-18 09:30:00+00', null, null, null
  ),
  (
    '70000000-0000-4000-8000-000000000003',
    '[SYNTHETIC] Review lifecycle controls',
    '[SYNTHETIC] Confirm expected-version conflicts and permission-aware actions.',
    '50000000-0000-4000-8000-000000000001', 'in_progress',
    '10000000-0000-4000-8000-000000000003',
    '2026-07-16', '2026-07-25', null,
    '10000000-0000-4000-8000-000000000003', '2026-07-16 10:00:00+00',
    '2026-07-16 10:00:00+00', '2026-07-20 10:15:00+00', null, null, null
  ),
  (
    '70000000-0000-4000-8000-000000000004',
    '[SYNTHETIC] Complete accessibility review',
    '[SYNTHETIC] Completed local fixture for Done and All list views.',
    '50000000-0000-4000-8000-000000000001', 'done',
    '10000000-0000-4000-8000-000000000002',
    '2026-07-07', '2026-07-14', null,
    '10000000-0000-4000-8000-000000000004', '2026-07-10 11:00:00+00',
    '2026-07-18 11:00:00+00', '2026-07-18 11:00:00+00',
    '2026-07-18 11:00:00+00', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000005',
    '[SYNTHETIC] Retired navigation exploration',
    '[SYNTHETIC] Archived local fixture. All write controls must be absent.',
    '50000000-0000-4000-8000-000000000001', 'paused', null,
    null, null, null,
    '10000000-0000-4000-8000-000000000006', '2026-07-08 12:00:00+00',
    '2026-07-19 12:00:00+00', '2026-07-19 12:00:00+00', null,
    '10000000-0000-4000-8000-000000000006', '2026-07-19 12:00:00+00'
  ),
  (
    '70000000-0000-4000-8000-000000000006',
    '[SYNTHETIC] A deliberately long ticket title that verifies wrapping without truncating the meaning or obscuring the stable ticket identifier on narrow screens',
    '[SYNTHETIC] This deliberately long description verifies that the Work Item page preserves readable line length, ordered mobile flow, and unbroken access to actions while content expands naturally.',
    '50000000-0000-4000-8000-000000000001', 'backlog', null,
    null, '2026-08-15', null,
    '10000000-0000-4000-8000-000000000007', '2026-07-17 13:00:00+00',
    '2026-07-17 13:00:00+00', '2026-07-17 13:00:00+00', null, null, null
  );

insert into public.work_item_assignments (
  id, work_item_id, assignee_id, started_at, started_on,
  assigned_by, start_operation_id
)
values
  ('71000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '2026-07-15 09:00:00+00', '2026-07-15', '10000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000102'),
  ('71000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '2026-07-16 10:00:00+00', '2026-07-16', '10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000103'),
  ('71000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', '2026-07-10 11:00:00+00', '2026-07-10', '10000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000104');

insert into public.work_item_status_history (
  id, work_item_id, from_status_code, to_status_code,
  changed_by, changed_at, changed_on, operation_id
)
select
  ('72000000-0000-4000-8000-' || lpad(fixture.ordinal::text, 12, '0'))::uuid,
  fixture.work_item_id,
  null,
  fixture.status_code,
  fixture.actor_id,
  fixture.changed_at,
  fixture.changed_at::date,
  ('30000000-0000-4000-8000-' || lpad((100 + fixture.ordinal)::text, 12, '0'))::uuid
from (
  values
    (1, '70000000-0000-4000-8000-000000000001'::uuid, 'backlog', '10000000-0000-4000-8000-000000000002'::uuid, '2026-07-14 08:00:00+00'::timestamptz),
    (2, '70000000-0000-4000-8000-000000000002'::uuid, 'todo', '10000000-0000-4000-8000-000000000004'::uuid, '2026-07-15 09:00:00+00'::timestamptz),
    (3, '70000000-0000-4000-8000-000000000003'::uuid, 'in_progress', '10000000-0000-4000-8000-000000000003'::uuid, '2026-07-16 10:00:00+00'::timestamptz),
    (4, '70000000-0000-4000-8000-000000000004'::uuid, 'done', '10000000-0000-4000-8000-000000000004'::uuid, '2026-07-10 11:00:00+00'::timestamptz),
    (5, '70000000-0000-4000-8000-000000000005'::uuid, 'paused', '10000000-0000-4000-8000-000000000006'::uuid, '2026-07-08 12:00:00+00'::timestamptz),
    (6, '70000000-0000-4000-8000-000000000006'::uuid, 'backlog', '10000000-0000-4000-8000-000000000007'::uuid, '2026-07-17 13:00:00+00'::timestamptz)
) fixture(ordinal, work_item_id, status_code, actor_id, changed_at);

insert into public.work_item_labels (
  id, work_item_id, label_id, applied_by, applied_at, apply_operation_id
)
select
  ('73000000-0000-4000-8000-' || lpad(fixture.ordinal::text, 12, '0'))::uuid,
  fixture.work_item_id,
  '60000000-0000-4000-8000-000000000001',
  fixture.actor_id,
  fixture.applied_at,
  ('30000000-0000-4000-8000-' || lpad((100 + fixture.ordinal)::text, 12, '0'))::uuid
from (
  values
    (1, '70000000-0000-4000-8000-000000000001'::uuid, '10000000-0000-4000-8000-000000000002'::uuid, '2026-07-14 08:00:00+00'::timestamptz),
    (2, '70000000-0000-4000-8000-000000000002'::uuid, '10000000-0000-4000-8000-000000000004'::uuid, '2026-07-15 09:00:00+00'::timestamptz),
    (3, '70000000-0000-4000-8000-000000000003'::uuid, '10000000-0000-4000-8000-000000000003'::uuid, '2026-07-16 10:00:00+00'::timestamptz),
    (4, '70000000-0000-4000-8000-000000000004'::uuid, '10000000-0000-4000-8000-000000000004'::uuid, '2026-07-10 11:00:00+00'::timestamptz)
) fixture(ordinal, work_item_id, actor_id, applied_at);

insert into public.subtasks (
  id, work_item_id, title, position, is_completed, created_by,
  created_at, completed_by, completed_at, updated_at
)
values
  ('74000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002', '[SYNTHETIC] Check 320px card flow', 1, true, '10000000-0000-4000-8000-000000000002', '2026-07-16 09:00:00+00', '10000000-0000-4000-8000-000000000002', '2026-07-17 09:00:00+00', '2026-07-17 09:00:00+00'),
  ('74000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000002', '[SYNTHETIC] Verify keyboard actions', 2, false, '10000000-0000-4000-8000-000000000002', '2026-07-16 09:05:00+00', null, null, '2026-07-16 09:05:00+00'),
  ('74000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000003', '[SYNTHETIC] Exercise stale version', 1, false, '10000000-0000-4000-8000-000000000003', '2026-07-18 10:00:00+00', null, null, '2026-07-18 10:00:00+00');

insert into public.blockers (
  id, work_item_id, reason, blocked_by, blocked_at,
  expected_resolution_date, create_operation_id
)
values (
  '75000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000002',
  '[SYNTHETIC] Awaiting an accessibility review fixture response.',
  '10000000-0000-4000-8000-000000000002',
  '2026-07-18 09:30:00+00',
  '2026-07-24',
  '30000000-0000-4000-8000-000000000102'
);

insert into public.comments (
  id, work_item_id, author_id, body, created_at, edited_at,
  withdrawn_by, withdrawn_at
)
values
  ('76000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '[SYNTHETIC] Mobile verification is ready for review.', '2026-07-17 10:00:00+00', null, null, null),
  ('76000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', '[SYNTHETIC] This body is masked by the visible-comments view.', '2026-07-18 10:00:00+00', null, '10000000-0000-4000-8000-000000000004', '2026-07-18 11:00:00+00');

insert into public.work_item_events (
  id, work_item_id, event_type_code, actor_id, subject_type,
  subject_id, previous_values, new_values, operation_id, occurred_at
)
select
  ('77000000-0000-4000-8000-' || lpad(fixture.ordinal::text, 12, '0'))::uuid,
  fixture.work_item_id,
  'created',
  fixture.actor_id,
  'work_item',
  fixture.work_item_id,
  null,
  jsonb_build_object('synthetic', true),
  ('30000000-0000-4000-8000-' || lpad((100 + fixture.ordinal)::text, 12, '0'))::uuid,
  fixture.occurred_at
from (
  values
    (1, '70000000-0000-4000-8000-000000000001'::uuid, '10000000-0000-4000-8000-000000000002'::uuid, '2026-07-14 08:00:00+00'::timestamptz),
    (2, '70000000-0000-4000-8000-000000000002'::uuid, '10000000-0000-4000-8000-000000000004'::uuid, '2026-07-15 09:00:00+00'::timestamptz),
    (3, '70000000-0000-4000-8000-000000000003'::uuid, '10000000-0000-4000-8000-000000000003'::uuid, '2026-07-16 10:00:00+00'::timestamptz),
    (4, '70000000-0000-4000-8000-000000000004'::uuid, '10000000-0000-4000-8000-000000000004'::uuid, '2026-07-10 11:00:00+00'::timestamptz),
    (5, '70000000-0000-4000-8000-000000000005'::uuid, '10000000-0000-4000-8000-000000000006'::uuid, '2026-07-08 12:00:00+00'::timestamptz),
    (6, '70000000-0000-4000-8000-000000000006'::uuid, '10000000-0000-4000-8000-000000000007'::uuid, '2026-07-17 13:00:00+00'::timestamptz)
) fixture(ordinal, work_item_id, actor_id, occurred_at);

end if;
end
$phase3_fixtures$;

commit;
