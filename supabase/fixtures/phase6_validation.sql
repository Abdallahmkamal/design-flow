-- Opt-in, deterministic Phase 6 validation data for local or staging only.
--
-- Required invocation variables:
--   psql "$DATABASE_URL" \
--     --set=validation_environment=local \
--     --set=validation_anchor_date=2026-07-26 \
--     --file supabase/fixtures/phase6_validation.sql
--
-- Re-running with the same anchor is idempotent. To use another anchor, reset
-- the non-production database first. The guard deliberately refuses targets
-- containing any profile that is not one of the reserved synthetic personas.

\set ON_ERROR_STOP on

begin;
set constraints all deferred;

-- Deliberately fail closed before domain data is touched. The psql variables
-- are substituted as SQL literals, so no session setting can accidentally
-- carry permission from another command.
select 1 / case when :'validation_environment' in ('local', 'staging') then 1 else 0 end;

select 1 / case when (
  select count(*)
  from public.profiles profile
  where profile.email in (
    'viewer@design-flow.example.invalid',
    'designer@design-flow.example.invalid',
    'designer-admin@design-flow.example.invalid',
    'lead@design-flow.example.invalid',
    'lead-admin@design-flow.example.invalid',
    'manager@design-flow.example.invalid',
    'manager-admin@design-flow.example.invalid',
    'inactive-designer@design-flow.example.invalid',
    'password-restricted-designer@design-flow.example.invalid'
  )
) = 9 then 1 else 0 end;

select 1 / case when not exists (
  select 1
  from public.profiles profile
  where profile.email not like '%@design-flow.example.invalid'
     or profile.display_name not like '[SYNTHETIC]%'
) then 1 else 0 end;

select 1 / case when not exists (
  select 1
  from public.operation_requests request
  where request.id = 'a6100000-0000-4000-8000-000000000001'
    and (
      (request.result ->> 'anchorDate')::date <> :'validation_anchor_date'::date
      or request.result ->> 'environment' <> :'validation_environment'
    )
) then 1 else 0 end;

insert into public.operation_requests (
  id, operation_code, actor_id, request_hash, state, result,
  created_at, updated_at, completed_at
)
select
  ('a6100000-0000-4000-8000-' || lpad(ordinal::text, 12, '0'))::uuid,
  'phase6_validation_' || lpad(ordinal::text, 3, '0'),
  (select id from public.profiles where email = 'manager-admin@design-flow.example.invalid'),
  encode(
    extensions.digest(
      'phase6-validation:' || ordinal || ':' || :'validation_anchor_date'::date,
      'sha256'
    ),
    'hex'
  ),
  'completed',
  jsonb_build_object(
    'synthetic', true,
    'dataset', 'phase6_validation',
    'anchorDate', :'validation_anchor_date'::date,
    'environment', :'validation_environment'
  ),
  :'validation_anchor_date'::date::timestamptz - interval '45 days',
  :'validation_anchor_date'::date::timestamptz - interval '45 days',
  :'validation_anchor_date'::date::timestamptz - interval '45 days'
from generate_series(1, 100) ordinal
on conflict (id) do nothing;

insert into public.work_areas (
  id, name, sort_order, created_by, created_at, updated_by, updated_at
)
select
  case
    when area.ordinal = 1 then '50000000-0000-4000-8000-000000000001'::uuid
    else ('a6010000-0000-4000-8000-' || lpad(area.ordinal::text, 12, '0'))::uuid
  end,
  '[SYNTHETIC] ' || area.name,
  area.ordinal,
  personas.id,
  context.anchor_date::timestamptz - interval '45 days',
  personas.id,
  context.anchor_date::timestamptz - interval '45 days'
from (
  values
    (1, 'Internal Experience'),
    (2, 'Consumer App'),
    (3, 'Retail Journeys'),
    (4, 'Self Service'),
    (5, 'Care Tools'),
    (6, 'Growth Experiments'),
    (7, 'Design Systems'),
    (8, 'Research Operations'),
    (9, 'Partner Experience')
) as area(ordinal, name)
cross join lateral (
  select (result ->> 'anchorDate')::date as anchor_date
  from public.operation_requests
  where id = 'a6100000-0000-4000-8000-000000000001'
) context
cross join lateral (
  select id from public.profiles where email = 'manager-admin@design-flow.example.invalid'
) personas
on conflict (id) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    archived_by = null,
    archived_at = null,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

insert into public.labels (
  id, name, sort_order, created_by, created_at, updated_by, updated_at
)
select
  ('60000000-0000-4000-8000-' || lpad(label.ordinal::text, 12, '0'))::uuid,
  '[SYNTHETIC] ' || label.name,
  label.ordinal,
  personas.id,
  context.anchor_date::timestamptz - interval '45 days',
  personas.id,
  context.anchor_date::timestamptz - interval '45 days'
from (values (1, 'Foundation'), (2, 'Mobile'), (3, 'Accessibility')) as label(ordinal, name)
cross join lateral (
  select (result ->> 'anchorDate')::date as anchor_date
  from public.operation_requests
  where id = 'a6100000-0000-4000-8000-000000000001'
) context
cross join lateral (
  select id from public.profiles where email = 'manager-admin@design-flow.example.invalid'
) personas
on conflict (id) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    archived_by = null,
    archived_at = null,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

with fixtures as (
  select * from (values
    (1, 'Draft empty-state guidance', 'backlog', null::text, -30, null::integer, null::text, false),
    (2, 'Validate due-today dashboard card', 'todo', 'designer', -12, 0, 'due-today', false),
    (3, 'Refine responsive reporting tables', 'in_progress', 'designer', -20, 3, 'many-logs', false),
    (4, 'Review export field labels', 'in_review', 'designer', -16, -5, null, false),
    (5, 'Resolve chart accessibility blocker', 'todo', 'designer_admin', -10, 2, 'blocked', false),
    (6, 'Build report filter combinations', 'in_progress', 'designer', -14, null, 'filters', false),
    (7, 'Verify source drill-down', 'in_review', 'designer_admin', -9, 5, 'drill-down', false),
    (8, 'Plan no-results messaging', 'backlog', 'designer_admin', -3, 10, null, false),
    (9, 'Explore PDF cover hierarchy', 'backlog', 'designer', -6, null, 'pdf', false),
    (10, 'Complete CSV reconciliation', 'done', 'designer', -25, -8, 'complete', false),
    (11, 'Complete Work Item PDF review', 'done', 'designer_admin', -22, -4, null, false),
    (12, 'Pause alternate chart exploration', 'paused', 'designer', -18, 8, 'paused', false),
    (13, 'Pause legacy export wording', 'paused', 'designer_admin', -28, null, null, false),
    (14, 'Archive superseded report concept', 'paused', 'designer', -35, -15, 'archived', true)
  ) value(ordinal, title, status_code, assignee_key, planned_offset, due_offset, figma_slug, archived)
)
insert into public.work_items (
  id, title, description, area_id, status_code, primary_assignee_id,
  planned_start_date, due_date, figma_url, created_by, created_at,
  updated_at, last_activity_at, completed_at, archived_by, archived_at
)
select
  ('a6200000-0000-4000-8000-' || lpad(item.ordinal::text, 12, '0'))::uuid,
  '[SYNTHETIC VALIDATION] ' || item.title,
  '[SYNTHETIC VALIDATION] Controlled Phase 6 source record ' || item.ordinal || '.',
  case
    when 1 + mod(item.ordinal - 1, 9) = 1 then '50000000-0000-4000-8000-000000000001'::uuid
    else ('a6010000-0000-4000-8000-' || lpad((1 + mod(item.ordinal - 1, 9))::text, 12, '0'))::uuid
  end,
  item.status_code,
  assignee.id,
  context.anchor_date + item.planned_offset,
  case when item.due_offset is null then null else context.anchor_date + item.due_offset end,
  case when item.figma_slug is null then null else 'https://www.figma.com/design/synthetic-' || item.figma_slug end,
  creator.id,
  context.anchor_date::timestamptz - interval '40 days' + item.ordinal * interval '1 hour',
  context.anchor_date::timestamptz - interval '1 day' + item.ordinal * interval '1 minute',
  context.anchor_date::timestamptz - interval '1 day' + item.ordinal * interval '1 minute',
  case when item.status_code = 'done' then context.anchor_date::timestamptz - interval '2 days' else null end,
  case when item.archived then creator.id else null end,
  case when item.archived then context.anchor_date::timestamptz - interval '1 day' else null end
from fixtures item
cross join lateral (
  select (result ->> 'anchorDate')::date as anchor_date
  from public.operation_requests
  where id = 'a6100000-0000-4000-8000-000000000001'
) context
cross join lateral (
  select id from public.profiles where email = 'manager-admin@design-flow.example.invalid'
) creator
left join public.profiles assignee on assignee.email = case item.assignee_key
  when 'designer' then 'designer@design-flow.example.invalid'
  when 'designer_admin' then 'designer-admin@design-flow.example.invalid'
end
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    area_id = excluded.area_id,
    status_code = excluded.status_code,
    primary_assignee_id = excluded.primary_assignee_id,
    planned_start_date = excluded.planned_start_date,
    due_date = excluded.due_date,
    figma_url = excluded.figma_url,
    updated_at = excluded.updated_at,
    last_activity_at = excluded.last_activity_at,
    completed_at = excluded.completed_at,
    archived_by = excluded.archived_by,
    archived_at = excluded.archived_at;

insert into public.work_item_assignments (
  id, work_item_id, assignee_id, started_at, started_on,
  assigned_by, start_operation_id
)
select
  ('a6300000-0000-4000-8000-' || lpad(ordinal.ordinal::text, 12, '0'))::uuid,
  item.id,
  item.primary_assignee_id,
  item.created_at,
  item.created_at::date,
  actor.id,
  ('a6100000-0000-4000-8000-' || lpad((10 + ordinal.ordinal)::text, 12, '0'))::uuid
from public.work_items item
join generate_series(1, 14) ordinal
  on item.id = ('a6200000-0000-4000-8000-' || lpad(ordinal.ordinal::text, 12, '0'))::uuid
cross join lateral (
  select id from public.profiles where email = 'manager-admin@design-flow.example.invalid'
) actor
where item.id::text like 'a6200000-0000-4000-8000-%'
  and item.primary_assignee_id is not null
on conflict (id) do nothing;

insert into public.work_item_status_history (
  id, work_item_id, from_status_code, to_status_code,
  changed_by, changed_at, changed_on, operation_id
)
select
  ('a6400000-0000-4000-8000-' || lpad(ordinal.ordinal::text, 12, '0'))::uuid,
  item.id,
  null,
  item.status_code,
  actor.id,
  item.created_at,
  item.created_at::date,
  ('a6100000-0000-4000-8000-' || lpad((10 + ordinal.ordinal)::text, 12, '0'))::uuid
from generate_series(1, 14) ordinal
join public.work_items item
  on item.id = ('a6200000-0000-4000-8000-' || lpad(ordinal.ordinal::text, 12, '0'))::uuid
cross join lateral (
  select id from public.profiles where email = 'manager-admin@design-flow.example.invalid'
) actor
on conflict (id) do nothing;

insert into public.work_item_events (
  id, work_item_id, event_type_code, actor_id, subject_type,
  subject_id, previous_values, new_values, operation_id, occurred_at
)
select
  ('a6500000-0000-4000-8000-' || lpad(ordinal.ordinal::text, 12, '0'))::uuid,
  item.id,
  'created',
  actor.id,
  'work_item',
  item.id,
  null,
  jsonb_build_object('synthetic', true, 'dataset', 'phase6_validation'),
  ('a6100000-0000-4000-8000-' || lpad((10 + ordinal.ordinal)::text, 12, '0'))::uuid,
  item.created_at
from generate_series(1, 14) ordinal
join public.work_items item
  on item.id = ('a6200000-0000-4000-8000-' || lpad(ordinal.ordinal::text, 12, '0'))::uuid
cross join lateral (
  select id from public.profiles where email = 'manager-admin@design-flow.example.invalid'
) actor
on conflict (id) do nothing;

insert into public.work_item_events (
  id, work_item_id, event_type_code, actor_id, subject_type,
  subject_id, previous_values, new_values, operation_id, occurred_at
)
select
  'a6500000-0000-4000-8000-000000000099',
  item.id,
  'archived',
  actor.id,
  'work_item',
  item.id,
  null,
  jsonb_build_object('archived', true, 'synthetic', true),
  'a6100000-0000-4000-8000-000000000099',
  item.archived_at
from public.work_items item
cross join lateral (
  select id from public.profiles where email = 'manager-admin@design-flow.example.invalid'
) actor
where item.id = 'a6200000-0000-4000-8000-000000000014'
on conflict (id) do nothing;

insert into public.work_item_labels (
  id, work_item_id, label_id, applied_by, applied_at, apply_operation_id
)
select
  ('a6550000-0000-4000-8000-' || lpad(ordinal.ordinal::text, 12, '0'))::uuid,
  item.id,
  ('60000000-0000-4000-8000-' || lpad((1 + mod(ordinal.ordinal - 1, 3))::text, 12, '0'))::uuid,
  actor.id,
  item.created_at,
  ('a6100000-0000-4000-8000-' || lpad((10 + ordinal.ordinal)::text, 12, '0'))::uuid
from generate_series(1, 14) ordinal
join public.work_items item
  on item.id = ('a6200000-0000-4000-8000-' || lpad(ordinal.ordinal::text, 12, '0'))::uuid
cross join lateral (
  select id from public.profiles where email = 'manager-admin@design-flow.example.invalid'
) actor
on conflict (id) do nothing;

insert into public.blockers (
  id, work_item_id, reason, blocked_by, blocked_at,
  expected_resolution_date, create_operation_id
)
select
  'a6600000-0000-4000-8000-000000000001',
  item.id,
  '[SYNTHETIC VALIDATION] Awaiting accessible chart review.',
  actor.id,
  context.anchor_date::timestamptz - interval '2 days',
  context.anchor_date + 2,
  'a6100000-0000-4000-8000-000000000050'
from public.work_items item
cross join lateral (
  select (result ->> 'anchorDate')::date as anchor_date
  from public.operation_requests
  where id = 'a6100000-0000-4000-8000-000000000001'
) context
cross join lateral (
  select id from public.profiles where email = 'designer-admin@design-flow.example.invalid'
) actor
where item.id = 'a6200000-0000-4000-8000-000000000005'
on conflict (id) do nothing;

with batch_fixture as (
  select * from (values
    (1, 'ticket', 3, null::integer, 'designer', 'designer', 3),
    (2, 'ticket', 3, null, 'designer', 'designer', 3),
    (3, 'ticket', 3, null, 'designer', 'designer', 3),
    (4, 'ticket', 3, null, 'designer', 'designer', 3),
    (5, 'ticket', 3, null, 'designer', 'designer', 3),
    (6, 'ticket', 2, null, 'designer', 'designer', 3),
    (7, 'ticket', 4, null, 'designer', 'designer', 3),
    (8, 'ticket', 5, null, 'designer', 'designer', 3),
    (9, 'ticket', 6, null, 'designer', 'designer', 3),
    (10, 'ticket', 7, null, 'designer', 'designer', 3),
    (11, 'ticket', 8, null, 'designer_admin', 'designer_admin', 1),
    (12, 'ticket', 9, null, 'designer_admin', 'designer_admin', 1),
    (13, 'ticket', 3, null, 'lead_admin', 'lead_admin', 2),
    (14, 'ticket', 4, null, 'lead_admin', 'lead_admin', 2),
    (15, 'ticket', 5, null, 'manager', 'manager', 2),
    (16, 'ticket', 6, null, 'manager', 'manager', 2),
    (17, 'ticket', 10, null, 'lead', 'lead', 2),
    (18, 'ticket', 11, null, 'manager', 'manager', 2),
    (19, 'standalone_visual', null, 7, 'designer_admin', 'designer_admin', 3),
    (20, 'standalone_visual', null, 7, 'designer_admin', 'manager_admin', 3)
  ) value(ordinal, context_code, item_ordinal, area_ordinal, worked_by_key, logged_by_key, entry_count)
)
insert into public.work_log_batches (
  id, context_code, work_item_id, related_area_id, worked_by, logged_by,
  created_at, create_operation_id
)
select
  ('a6700000-0000-4000-8000-' || lpad(batch.ordinal::text, 12, '0'))::uuid,
  batch.context_code,
  case when batch.item_ordinal is null then null else
    ('a6200000-0000-4000-8000-' || lpad(batch.item_ordinal::text, 12, '0'))::uuid end,
  case when batch.area_ordinal is null then null else
    ('a6010000-0000-4000-8000-' || lpad(batch.area_ordinal::text, 12, '0'))::uuid end,
  worked_by.id,
  logged_by.id,
  context.anchor_date::timestamptz - (21 - batch.ordinal) * interval '1 day' + interval '10 hours',
  ('a6100000-0000-4000-8000-' || lpad((60 + batch.ordinal)::text, 12, '0'))::uuid
from batch_fixture batch
join public.profiles worked_by on worked_by.email = case batch.worked_by_key
  when 'designer' then 'designer@design-flow.example.invalid'
  when 'designer_admin' then 'designer-admin@design-flow.example.invalid'
  when 'lead' then 'lead@design-flow.example.invalid'
  when 'lead_admin' then 'lead-admin@design-flow.example.invalid'
  when 'manager' then 'manager@design-flow.example.invalid'
end
join public.profiles logged_by on logged_by.email = case batch.logged_by_key
  when 'designer' then 'designer@design-flow.example.invalid'
  when 'designer_admin' then 'designer-admin@design-flow.example.invalid'
  when 'lead' then 'lead@design-flow.example.invalid'
  when 'lead_admin' then 'lead-admin@design-flow.example.invalid'
  when 'manager' then 'manager@design-flow.example.invalid'
  when 'manager_admin' then 'manager-admin@design-flow.example.invalid'
end
cross join lateral (
  select (result ->> 'anchorDate')::date as anchor_date
  from public.operation_requests
  where id = 'a6100000-0000-4000-8000-000000000001'
) context
on conflict (id) do update
set context_code = excluded.context_code,
    work_item_id = excluded.work_item_id,
    related_area_id = excluded.related_area_id,
    worked_by = excluded.worked_by,
    logged_by = excluded.logged_by,
    created_at = excluded.created_at,
    edited_at = null,
    withdrawn_by = null,
    withdrawn_at = null,
    create_operation_id = excluded.create_operation_id;

with batch_fixture as (
  select * from (values
    (1, 'ticket', 3), (2, 'ticket', 3), (3, 'ticket', 3), (4, 'ticket', 3),
    (5, 'ticket', 3), (6, 'ticket', 3), (7, 'ticket', 3), (8, 'ticket', 3),
    (9, 'ticket', 3), (10, 'ticket', 3), (11, 'ticket', 1), (12, 'ticket', 1),
    (13, 'ticket', 2), (14, 'ticket', 2), (15, 'ticket', 2), (16, 'ticket', 2),
    (17, 'ticket', 2), (18, 'ticket', 2),
    (19, 'standalone_visual', 3), (20, 'standalone_visual', 3)
  ) value(ordinal, context_code, entry_count)
), expanded as (
  select
    batch.*,
    position,
    coalesce(
      sum(batch.entry_count) over (
        order by batch.ordinal rows between unbounded preceding and 1 preceding
      ),
      0
    ) + position as entry_ordinal
  from batch_fixture batch
  cross join lateral generate_series(1, batch.entry_count) position
)
insert into public.work_log_entries (
  id, batch_id, work_date, work_type_code, description, position,
  created_at, updated_at
)
select
  ('a6800000-0000-4000-8000-' || lpad(entry.entry_ordinal::text, 12, '0'))::uuid,
  ('a6700000-0000-4000-8000-' || lpad(entry.ordinal::text, 12, '0'))::uuid,
  context.anchor_date - (2 + mod(entry.entry_ordinal * 3, 25))::integer,
  case
    when entry.context_code = 'standalone_visual' then
      (array['new_visual_asset','resizing_adaptation','presentation_support'])[1 + mod(entry.entry_ordinal - 1, 3)]
    else
      (array['planning_alignment','discovery_research','ui_visual_design','prototyping_interaction','testing_validation','review_iteration','documentation_handoff','design_qa_implementation_support','team_support_collaboration'])[1 + mod(entry.entry_ordinal - 1, 9)]
  end,
  case
    when entry.context_code = 'standalone_visual'
      then '[SYNTHETIC VALIDATION — STANDALONE VISUAL WORK] Controlled export source.'
    else '[SYNTHETIC VALIDATION] Controlled ticket activity source ' || entry.entry_ordinal || '.'
  end,
  entry.position,
  context.anchor_date::timestamptz - interval '1 day' + entry.entry_ordinal * interval '1 minute',
  context.anchor_date::timestamptz - interval '1 day' + entry.entry_ordinal * interval '1 minute'
from expanded entry
cross join lateral (
  select (result ->> 'anchorDate')::date as anchor_date
  from public.operation_requests
  where id = 'a6100000-0000-4000-8000-000000000001'
) context
on conflict (id) do update
set batch_id = excluded.batch_id,
    work_date = excluded.work_date,
    work_type_code = excluded.work_type_code,
    description = excluded.description,
    position = excluded.position,
    withdrawn_by = null,
    withdrawn_at = null,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

insert into public.comments (id, work_item_id, author_id, body, created_at)
select
  ('a6900000-0000-4000-8000-' || lpad(comment.ordinal::text, 12, '0'))::uuid,
  ('a6200000-0000-4000-8000-' || lpad(comment.item_ordinal::text, 12, '0'))::uuid,
  author.id,
  '[SYNTHETIC VALIDATION] ' || comment.body,
  context.anchor_date::timestamptz - comment.days_ago * interval '1 day'
from (values
  (1, 3, 'designer', 3, 'Report source is ready for controlled review.'),
  (2, 3, 'lead', 2, 'CSV and PDF values must reconcile to this fixture.')
) comment(ordinal, item_ordinal, author_key, days_ago, body)
join public.profiles author on author.email = case comment.author_key
  when 'designer' then 'designer@design-flow.example.invalid'
  when 'lead' then 'lead@design-flow.example.invalid'
end
cross join lateral (
  select (result ->> 'anchorDate')::date as anchor_date
  from public.operation_requests
  where id = 'a6100000-0000-4000-8000-000000000001'
) context
on conflict (id) do update
set body = excluded.body;

select private.recalculate_work_items(
  array_agg(item.id order by item.id)
)
from public.work_items item
where item.id::text like 'a6200000-0000-4000-8000-%';

do $verify$
begin
  if (select count(*) from public.work_areas where id::text like 'a6010000-0000-4000-8000-%' or id = '50000000-0000-4000-8000-000000000001') <> 9
    or (select count(*) from public.work_items where id::text like 'a6200000-0000-4000-8000-%') <> 14
    or (select count(*) from public.work_log_batches where id::text like 'a6700000-0000-4000-8000-%') <> 20
    or (select count(*) from public.work_log_entries where id::text like 'a6800000-0000-4000-8000-%') <> 50
    or (select count(distinct status_code) from public.work_items where id::text like 'a6200000-0000-4000-8000-%') <> 6
  then
    raise exception 'Phase 6 validation dataset count verification failed';
  end if;
end
$verify$;

commit;
