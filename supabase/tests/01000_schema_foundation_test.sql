begin;

select plan(35);

select has_extension('pgcrypto', 'pgcrypto is installed');
select has_extension('citext', 'citext is installed');
select has_extension('btree_gist', 'btree_gist is installed');
select has_extension('pg_trgm', 'pg_trgm is installed');

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class relation
    join pg_catalog.pg_namespace namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind = 'r'
  ),
  31,
  'all contracted physical tables exist'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_constraint constraint_definition
    join pg_catalog.pg_namespace namespace
      on namespace.oid = constraint_definition.connamespace
    where namespace.nspname = 'public'
      and constraint_definition.contype = 'p'
  ),
  31,
  'every application table has a primary key'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_constraint constraint_definition
    join pg_catalog.pg_namespace namespace
      on namespace.oid = constraint_definition.connamespace
    where namespace.nspname = 'public'
      and constraint_definition.contype = 'f'
  ),
  89,
  'the complete foreign-key contract is present'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class relation
    join pg_catalog.pg_namespace namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind = 'r'
      and relation.relrowsecurity
      and relation.relforcerowsecurity
  ),
  31,
  'RLS is enabled and forced on every application table'
);

select is(
  (select count(*)::integer from pg_catalog.pg_policies where schemaname = 'public'),
  26,
  'only the approved Phase 1 read and notification policies exist'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class relation
    join pg_catalog.pg_namespace namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind = 'v'
  ),
  10,
  'all approved read and remediation views exist'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'work_log_batches'
      and indexname = 'work_log_batches_person_idx'
      and position('(worked_by, withdrawn_at, created_at)' in indexdef) > 0
  ),
  'cross-ticket work history has the credited-person batch index'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'work_log_entries'
      and indexname = 'work_log_entries_reporting_idx'
      and position('(work_date, work_type_code)' in indexdef) > 0
  ),
  'cross-ticket work history has the reporting-date and type index'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'work_log_entries'
      and indexname = 'work_log_entries_active_date_idx'
      and position('(batch_id, work_date)' in indexdef) > 0
      and position('WHERE (withdrawn_at IS NULL)' in indexdef) > 0
  ),
  'valid work history has the active batch-date join index'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_proc function_definition
    join pg_catalog.pg_namespace namespace
      on namespace.oid = function_definition.pronamespace
    where namespace.nspname = 'public'
      and function_definition.prokind = 'f'
  ),
  56,
  'only the owning application and approved release functions are exposed'
);

select is(
  (select count(*)::integer from public.position_definitions),
  4,
  'the four stable organizational positions are seeded'
);

select is(
  (select count(*)::integer from public.work_item_statuses),
  6,
  'the six stable Work Item statuses are seeded'
);

select is(
  (select count(*)::integer from public.work_item_status_transitions),
  30,
  'the initial all-to-all non-self status transition matrix is seeded'
);

select is(
  (select count(*)::integer from public.work_type_definitions),
  19,
  'all ticket and standalone visual work types are seeded'
);

select is(
  (
    select count(*)::integer
    from public.product_policy_versions
    where effective_to is null
  ),
  1,
  'exactly one product policy version is current'
);

select is(
  (
    select count(*)::integer
    from public.profiles
    where is_active and not must_change_password
  ),
  7,
  'all seven valid active position and Admin personas are seeded'
);

select is(
  (
    select count(*)::integer
    from public.profiles
    where not is_active or must_change_password
  ),
  2,
  'inactive and password-restricted personas are seeded'
);

select throws_ok(
  $$
    update public.profiles
    set is_admin = true
    where id = '10000000-0000-4000-8000-000000000001'
  $$,
  '23514',
  null,
  'Viewer + Admin is rejected by the database'
);

select throws_ok(
  $$update public.team_settings set timezone = 'Synthetic/Not_A_Timezone'$$,
  '23514',
  null,
  'team timezone must be a valid IANA identifier'
);

select is(
  (
    select count(*)::integer
    from information_schema.role_table_grants
    where grantee = 'anon'
      and table_schema = 'public'
  ),
  0,
  'anon has no application table or view privileges'
);

select is(
  (
    select count(*)::integer
    from information_schema.role_table_grants
    where grantee = 'authenticated'
      and table_schema = 'public'
      and privilege_type <> 'SELECT'
  ),
  0,
  'authenticated has no table-level browser mutation privilege'
);

select is(
  (
    select count(*)::integer
    from information_schema.role_column_grants
    where grantee = 'authenticated'
      and table_schema = 'public'
      and privilege_type <> 'SELECT'
  ),
  1,
  'authenticated has exactly one column-level mutation grant'
);

select ok(
  has_column_privilege(
    'authenticated',
    'public.notifications',
    'read_at',
    'UPDATE'
  ),
  'the one browser mutation grant is notifications.read_at'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.profiles',
    'email',
    'SELECT'
  ),
  'profile email is not exposed through direct profile reads'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.operation_requests',
    'SELECT'
  ),
  'operation request payloads are not browser-readable'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.comment_revisions',
    'SELECT'
  ),
  'comment revision bodies are not browser-readable'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.work_log_batch_revisions',
    'SELECT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.work_log_entry_revisions',
    'SELECT'
  ),
  'work-log revisions are not browser-readable'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.comments',
    'SELECT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.work_log_batches',
    'SELECT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.work_log_entries',
    'SELECT'
  ),
  'withdrawn comment and work-log storage is not directly browser-readable'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class relation
    join pg_catalog.pg_namespace namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind = 'v'
      and coalesce(relation.reloptions, array[]::text[])
        @> array['security_barrier=true']
  ),
  9,
  'the nine masked or filtered read views use a security barrier'
);

with inserted_item as (
  insert into public.work_items (
    title,
    area_id,
    created_by
  )
  values (
    '[SYNTHETIC TEST] Generated display identifier',
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000007'
  )
  returning display_id
)
select matches(
  (select display_id from inserted_item),
  '^DF-[0-9]{6,}$',
  'Work Item display IDs are generated from the identity sequence'
);

select is(
  (
    select count(*)::integer
    from public.team_settings
    where timezone = 'Africa/Cairo'
  ),
  1,
  'synthetic local fixtures establish the approved team timezone'
);

select * from finish();

rollback;
