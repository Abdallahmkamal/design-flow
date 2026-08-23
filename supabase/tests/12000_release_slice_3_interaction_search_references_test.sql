begin;

select plan(11);

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000007', true);
set local role authenticated;

select set_config('design_flow.slice3_search_id', (
  public.create_work_item(
    '[SYNTHETIC TEST] Searchable ticket name',
    '[SYNTHETIC TEST] description-only-secret',
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000004',
    null, null, null, array[]::uuid[],
    '93000000-0000-4000-8000-000000000001'
  ) ->> 'id'
), true);

select set_config('design_flow.slice3_search_display_id', (
  select display_id from public.work_items
  where id = current_setting('design_flow.slice3_search_id')::uuid
), true);

select lives_ok(
  $$ select public.submit_work_log(
    'ticket', current_setting('design_flow.slice3_search_id')::uuid,
    null, '10000000-0000-4000-8000-000000000002',
    jsonb_build_array(jsonb_build_object(
      'work_date', current_date,
      'work_type_code', 'ui_visual_design'
    )),
    null,
    '93000000-0000-4000-8000-000000000002'
  ) $$,
  'a current contributor is available to the expanded search'
);

select is(
  (public.list_work_items(jsonb_build_object('search', 'Searchable ticket name')) ->> 'totalCount')::integer,
  1,
  'ticket-name search runs before pagination'
);

select is(
  (public.list_work_items(jsonb_build_object('search', 'Internal Experience')) ->> 'totalCount')::integer,
  1,
  'Area-name search runs before pagination'
);

select is(
  (public.list_work_items(jsonb_build_object('search', '[SYNTHETIC] Lead')) ->> 'totalCount')::integer,
  1,
  'primary-assignee display-name search runs before pagination'
);

select is(
  (public.list_work_items(jsonb_build_object('search', '[SYNTHETIC] Designer')) ->> 'totalCount')::integer,
  1,
  'current-contributor display-name search runs before pagination'
);

select is(
  (public.list_work_items(jsonb_build_object(
    'search', '#' || lpad((substring(current_setting('design_flow.slice3_search_display_id') from 4)::bigint)::text, 3, '0')
  )) ->> 'totalCount')::integer,
  1,
  'a copied # reference normalizes to the persisted DF lookup form'
);

select is(
  (public.list_work_items(jsonb_build_object('search', 'description-only-secret')) ->> 'totalCount')::integer,
  0,
  'description-only text is not part of the documented search set'
);

select is(
  (public.list_work_items(jsonb_build_object(
    'search', '[SYNTHETIC] Designer',
    'statuses', jsonb_build_array('done')
  )) ->> 'totalCount')::integer,
  0,
  'expanded search composes with existing filters before pagination'
);

select set_config('design_flow.slice3_older_id', (
  public.create_work_item(
    '[SYNTHETIC TEST] Default order pair', null,
    '50000000-0000-4000-8000-000000000001', null,
    null, null, null, array[]::uuid[],
    '93000000-0000-4000-8000-000000000003'
  ) ->> 'id'
), true);
select set_config('design_flow.slice3_newer_id', (
  public.create_work_item(
    '[SYNTHETIC TEST] Default order pair', null,
    '50000000-0000-4000-8000-000000000001', null,
    null, null, null, array[]::uuid[],
    '93000000-0000-4000-8000-000000000004'
  ) ->> 'id'
), true);

reset role;
update public.work_items
set last_activity_at = case
  when id = current_setting('design_flow.slice3_older_id')::uuid then created_at + interval '1 minute'
  else created_at + interval '2 minutes'
end
where id in (
  current_setting('design_flow.slice3_older_id')::uuid,
  current_setting('design_flow.slice3_newer_id')::uuid
);
set local role authenticated;

select is(
  (public.list_work_items(jsonb_build_object('search', 'Default order pair')) -> 'rows' -> 0 ->> 'id')::uuid,
  current_setting('design_flow.slice3_newer_id')::uuid,
  'no explicit sort defaults to Last Activity newest first'
);

select is(
  (public.list_work_items(jsonb_build_object(
    'search', 'Default order pair', 'sort', 'ticket', 'direction', 'asc'
  )) -> 'rows' -> 0 ->> 'id')::uuid,
  (select id from public.work_items
   where id in (
     current_setting('design_flow.slice3_older_id')::uuid,
     current_setting('design_flow.slice3_newer_id')::uuid
   ) order by display_id limit 1),
  'an explicit sort continues to override the default'
);

select is(
  (public.list_work_items(jsonb_build_object('search', '10000000-0000-4000-8000-000000000002')) ->> 'totalCount')::integer,
  0,
  'internal UUID values are not a search target'
);

select * from finish();
rollback;
