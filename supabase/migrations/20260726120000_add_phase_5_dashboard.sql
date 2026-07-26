-- Design Flow Phase 5, slice 2: position-aware operational Dashboard.

begin;

create function private.resolve_people_scope(
  actor public.profiles,
  requested_scope_key text,
  requested_people_ids uuid[]
)
returns uuid[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  default_key text;
  scope_key text;
  subject_id uuid;
  result uuid[];
begin
  default_key := case actor.position_code
    when 'viewer' then 'all'
    when 'designer' then 'me'
    when 'lead' then 'lead:' || actor.id::text
    else 'manager:' || actor.id::text
  end;
  scope_key := coalesce(nullif(requested_scope_key, ''), default_key);

  if scope_key <> default_key
    and not (actor.is_admin or actor.position_code in ('lead', 'manager')) then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;

  if scope_key = 'people' then
    if requested_people_ids is null then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    if exists (
      select 1
      from unnest(requested_people_ids) requested(id)
      left join public.profiles profile on profile.id = requested.id
      where profile.id is null or not profile.is_active
        or profile.position_code not in ('designer', 'lead', 'manager')
    ) then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    select coalesce(array_agg(distinct requested.id order by requested.id), array[]::uuid[])
    into result from unnest(requested_people_ids) requested(id);
    return result;
  elsif requested_people_ids is not null then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if scope_key = 'all' then
    select coalesce(array_agg(profile.id order by profile.id), array[]::uuid[])
    into result
    from public.profiles profile
    where profile.is_active and profile.position_code in ('designer', 'lead', 'manager');
  elsif scope_key = 'me' then
    if actor.position_code <> 'designer' then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    result := array[actor.id];
  elsif scope_key like 'lead:%' then
    begin subject_id := substring(scope_key from 6)::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end;
    if not exists (
      select 1 from public.profiles profile
      where profile.id = subject_id and profile.is_active and profile.position_code = 'lead'
    ) then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    select coalesce(array_agg(profile.id order by profile.id), array[]::uuid[])
    into result from public.profiles profile
    where profile.is_active and profile.position_code in ('designer', 'lead', 'manager')
      and (profile.id = subject_id or profile.current_reports_to_id = subject_id);
  elsif scope_key like 'manager:%' then
    begin subject_id := substring(scope_key from 9)::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end;
    if not exists (
      select 1 from public.profiles profile
      where profile.id = subject_id and profile.is_active and profile.position_code = 'manager'
    ) then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    select coalesce(array_agg(profile.id order by profile.id), array[]::uuid[])
    into result from public.profiles profile
    where profile.is_active and profile.position_code in ('designer', 'lead', 'manager')
      and (
        profile.id = subject_id
        or profile.current_reports_to_id = subject_id
        or profile.current_reports_to_id in (
          select lead.id from public.profiles lead
          where lead.is_active and lead.position_code = 'lead'
            and lead.current_reports_to_id = subject_id
        )
      );
  else
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  return result;
end;
$$;

create function private.recent_working_window_start(as_of_date date, number_of_days integer)
returns date
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  candidate date := as_of_date;
  remaining integer := number_of_days;
  configured_days smallint[];
begin
  if as_of_date is null or number_of_days is null or number_of_days < 1 then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;
  select policy.working_days into configured_days
  from public.product_policy_versions policy where policy.effective_to is null;
  while true loop
    if extract(dow from candidate)::smallint = any(configured_days) then
      remaining := remaining - 1;
      if remaining = 0 then return candidate; end if;
    end if;
    candidate := candidate - 1;
  end loop;
end;
$$;

do $$
declare
  definition text;
  old_fragment constant text := 'and today > private.add_working_days(stale_basis.basis_date, stale_days)';
  new_fragment constant text := 'and today >= private.add_working_days(stale_basis.basis_date, stale_days)';
begin
  select pg_get_functiondef('public.list_work_items(jsonb)'::regprocedure) into definition;
  if definition is null or strpos(definition, old_fragment) = 0
    or strpos(definition, new_fragment) > 0 then
    raise exception 'Unexpected list_work_items definition; refusing stale-cutoff replacement';
  end if;
  execute replace(definition, old_fragment, new_fragment);
end;
$$;

create function public.get_dashboard(
  requested_scope_key text default null,
  requested_people_ids uuid[] default null,
  requested_area_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  default_scope_key text;
  selected_scope_key text;
  selected_people uuid[];
  today date := private.current_team_date();
  week_start date;
  due_cutoff date;
  recent_cutoff date;
  stale_days integer;
  result jsonb;
begin
  actor := private.require_application_user_read();
  default_scope_key := case actor.position_code
    when 'viewer' then 'all'
    when 'designer' then 'me'
    when 'lead' then 'lead:' || actor.id::text
    else 'manager:' || actor.id::text
  end;
  selected_scope_key := coalesce(nullif(requested_scope_key, ''), default_scope_key);
  selected_people := private.resolve_people_scope(
    actor, selected_scope_key, requested_people_ids
  );
  if requested_area_id is not null and not exists (
    select 1 from public.work_areas area where area.id = requested_area_id
  ) then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  week_start := today - extract(dow from today)::integer;
  select
    private.add_working_days(today, policy.due_soon_working_days),
    private.recent_working_window_start(today, policy.stale_after_working_days),
    policy.stale_after_working_days
  into due_cutoff, recent_cutoff, stale_days
  from public.product_policy_versions policy where policy.effective_to is null;

  with ticket_base as (
    select
      item.id,
      item.display_id,
      item.title,
      item.status_code,
      status.display_label as status_label,
      item.primary_assignee_id,
      assignee.display_name as assignee_name,
      item.due_date,
      item.planned_start_date,
      item.last_worked_on,
      item.area_id,
      blocker.id is not null as is_blocked,
      review_entered.entered_at as review_entered_at,
      (
        status.reporting_bucket = 'active'
        and stale_basis.basis_date is not null
        and stale_basis.basis_date <= today
        and today >= private.add_working_days(stale_basis.basis_date, stale_days)
      ) as is_stale
    from public.work_items item
    join public.work_item_statuses status on status.code = item.status_code
    left join public.profiles assignee on assignee.id = item.primary_assignee_id
    left join public.blockers blocker
      on blocker.work_item_id = item.id and blocker.resolved_at is null
    left join lateral (
      select max(history.changed_at) as entered_at
      from public.work_item_status_history history
      where history.work_item_id = item.id and history.to_status_code = 'in_review'
    ) review_entered on true
    left join lateral (
      select greatest(
        item.last_worked_on,
        item.planned_start_date,
        case when status.reporting_bucket = 'active' then (
          select max(history.changed_on)
          from public.work_item_status_history history
          join public.work_item_statuses entered on entered.code = history.to_status_code
          where history.work_item_id = item.id
            and entered.reporting_bucket = 'active'
            and history.changed_at > coalesce((
              select max(later.changed_at)
              from public.work_item_status_history later
              join public.work_item_statuses exited on exited.code = later.to_status_code
              where later.work_item_id = item.id and exited.reporting_bucket <> 'active'
            ), '-infinity'::timestamptz)
        ) end
      ) as basis_date
    ) stale_basis on true
    where item.archived_at is null
      and (requested_area_id is null or item.area_id = requested_area_id)
      and (
        item.primary_assignee_id = any(selected_people)
        or (item.primary_assignee_id is null and selected_scope_key = 'all')
      )
  ), active_people as (
    select profile.id, profile.display_name
    from public.profiles profile
    where profile.id = any(selected_people) and profile.is_active
      and profile.position_code in ('designer', 'lead', 'manager')
  ), work_by_person as (
    select
      person.id,
      max(entry.work_date) as last_work_date,
      count(distinct entry.work_date) filter (
        where entry.work_date between week_start and today
      )::integer as recorded_week_days,
      count(distinct entry.work_date) filter (
        where batch.context_code = 'standalone_visual'
          and entry.work_date between week_start and today
      )::integer as visual_week_days
    from active_people person
    left join public.valid_work_log_entries entry on entry.worked_by = person.id
    left join public.work_log_batches batch on batch.id = entry.batch_id
    group by person.id
  ), workload as (
    select
      person.id,
      person.display_name,
      coalesce(count(*) filter (where ticket.status_code = 'todo'), 0)::integer as todo_count,
      coalesce(count(*) filter (where ticket.status_code = 'in_progress'), 0)::integer as progress_count,
      coalesce(count(*) filter (where ticket.status_code = 'in_review'), 0)::integer as review_count,
      coalesce(count(*) filter (
        where ticket.status_code in ('todo', 'in_progress', 'in_review') and ticket.is_blocked
      ), 0)::integer as blocked_count,
      coalesce(count(*) filter (
        where ticket.status_code in ('todo', 'in_progress', 'in_review')
          and ticket.due_date < today
      ), 0)::integer as overdue_count,
      max(ticket.due_date) filter (
        where ticket.status_code in ('todo', 'in_progress', 'in_review')
      ) as planned_until,
      coalesce(count(*) filter (
        where ticket.status_code in ('todo', 'in_progress', 'in_review')
          and ticket.due_date is null
      ), 0)::integer as missing_due_count,
      coalesce(count(*) filter (
        where ticket.status_code in ('todo', 'in_progress', 'in_review')
      ), 0)::integer as active_owned_count,
      work.last_work_date,
      coalesce(work.visual_week_days, 0) as visual_week_days,
      coalesce((
        select count(distinct entry.work_item_id)::integer
        from public.valid_work_log_entries entry
        where entry.worked_by = person.id
          and entry.work_item_id is not null
          and entry.work_date between week_start and today
          and not exists (
            select 1 from public.work_item_assignments assignment
            where assignment.work_item_id = entry.work_item_id
              and assignment.assignee_id = person.id
              and assignment.started_on <= entry.work_date
              and (assignment.ended_on is null or assignment.ended_on >= entry.work_date)
          )
      ), 0) as contributed_count
    from active_people person
    left join ticket_base ticket on ticket.primary_assignee_id = person.id
    left join work_by_person work on work.id = person.id
    group by person.id, person.display_name, work.last_work_date, work.visual_week_days
  )
  select jsonb_build_object(
    'asOfDate', today,
    'activityStartDate', week_start,
    'activityEndDate', today,
    'defaultScopeKey', default_scope_key,
    'selectedScopeKey', selected_scope_key,
    'selectedPeople', coalesce((
      select jsonb_agg(jsonb_build_object('id', person.id, 'displayName', person.display_name)
        order by person.display_name, person.id) from active_people person
    ), '[]'::jsonb),
    'scopeOptions', coalesce((
      select jsonb_agg(option.value order by option.sort_order, option.label)
      from (
        select 1 as sort_order, 'All people' as label,
          jsonb_build_object('key', 'all', 'label', 'All people') as value
        where actor.position_code = 'viewer' or actor.is_admin
          or actor.position_code in ('lead', 'manager')
        union all
        select 2, 'Me', jsonb_build_object('key', 'me', 'label', 'Me')
        where actor.position_code = 'designer'
        union all
        select 10 + row_number() over (order by profile.display_name)::integer,
          profile.display_name || '''s reporting group',
          jsonb_build_object('key', 'lead:' || profile.id::text,
            'label', profile.display_name || '''s reporting group')
        from public.profiles profile
        where profile.is_active and profile.position_code = 'lead'
          and (actor.is_admin or actor.position_code in ('lead', 'manager'))
        union all
        select 100 + row_number() over (order by profile.display_name)::integer,
          profile.display_name || '''s Manager group',
          jsonb_build_object('key', 'manager:' || profile.id::text,
            'label', profile.display_name || '''s Manager group')
        from public.profiles profile
        where profile.is_active and profile.position_code = 'manager'
          and (actor.is_admin or actor.position_code in ('lead', 'manager'))
        union all
        select 1000, 'Specific people', jsonb_build_object('key', 'people', 'label', 'Specific people')
        where actor.is_admin or actor.position_code in ('lead', 'manager')
      ) option(sort_order, label, value)
    ), '[]'::jsonb),
    'peopleOptions', coalesce((
      select jsonb_agg(jsonb_build_object('id', profile.id, 'displayName', profile.display_name)
        order by profile.display_name, profile.id)
      from public.profiles profile where profile.is_active
        and profile.position_code in ('designer', 'lead', 'manager')
    ), '[]'::jsonb),
    'areaOptions', coalesce((
      select jsonb_agg(jsonb_build_object('id', area.id, 'name', area.name::text)
        order by area.sort_order, area.name)
      from public.work_areas area
    ), '[]'::jsonb),
    'cards', jsonb_build_object(
      'active', (select count(*) from ticket_base where status_code in ('todo', 'in_progress', 'in_review')),
      'activeBreakdown', jsonb_build_object(
        'todo', (select count(*) from ticket_base where status_code = 'todo'),
        'inProgress', (select count(*) from ticket_base where status_code = 'in_progress'),
        'inReview', (select count(*) from ticket_base where status_code = 'in_review')
      ),
      'blocked', (select count(*) from ticket_base where status_code in ('todo', 'in_progress', 'in_review') and is_blocked),
      'overdue', (select count(*) from ticket_base where status_code in ('todo', 'in_progress', 'in_review') and due_date < today),
      'dueSoon', (select count(*) from ticket_base where status_code in ('todo', 'in_progress', 'in_review') and due_date between today and due_cutoff),
      'stale', (select count(*) from ticket_base where is_stale),
      'unassignedBacklog', (select count(*) from ticket_base where status_code = 'backlog' and primary_assignee_id is null)
    ),
    'cardSources', jsonb_build_object(
      'active', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'displayId', display_id, 'title', title) order by display_id)
        from ticket_base where status_code in ('todo', 'in_progress', 'in_review')), '[]'::jsonb),
      'blocked', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'displayId', display_id, 'title', title) order by display_id)
        from ticket_base where status_code in ('todo', 'in_progress', 'in_review') and is_blocked), '[]'::jsonb),
      'overdue', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'displayId', display_id, 'title', title) order by display_id)
        from ticket_base where status_code in ('todo', 'in_progress', 'in_review') and due_date < today), '[]'::jsonb),
      'dueSoon', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'displayId', display_id, 'title', title) order by display_id)
        from ticket_base where status_code in ('todo', 'in_progress', 'in_review') and due_date between today and due_cutoff), '[]'::jsonb),
      'stale', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'displayId', display_id, 'title', title) order by display_id)
        from ticket_base where is_stale), '[]'::jsonb),
      'unassignedBacklog', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'displayId', display_id, 'title', title) order by display_id)
        from ticket_base where status_code = 'backlog' and primary_assignee_id is null), '[]'::jsonb)
    ),
    'needsAttention', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', attention.id, 'displayId', attention.display_id, 'title', attention.title,
        'status', jsonb_build_object('code', attention.status_code, 'label', attention.status_label),
        'assignee', case when attention.primary_assignee_id is null then null else
          jsonb_build_object('id', attention.primary_assignee_id, 'displayName', attention.assignee_name) end,
        'dueDate', attention.due_date,
        'reasons', to_jsonb(array_remove(array[
          case when attention.is_blocked then 'Blocked' end,
          case when attention.due_date < today and attention.status_code in ('todo', 'in_progress', 'in_review') then 'Overdue' end,
          case when attention.due_date between today and due_cutoff and attention.status_code in ('todo', 'in_progress', 'in_review') then 'Due soon' end,
          case when attention.is_stale then 'Stale' end,
          case when attention.status_code = 'backlog' and attention.primary_assignee_id is null then 'Unassigned backlog' end,
          case when attention.status_code in ('todo', 'in_progress', 'in_review') and attention.due_date is null then 'No due date' end,
          case when attention.status_code = 'in_review' then 'Review waiting' end
        ], null))
      ) order by attention.is_blocked desc, attention.due_date asc nulls last,
        attention.review_entered_at asc nulls last, attention.display_id)
      from (
        select source.* from ticket_base source
        where source.is_blocked or source.is_stale
          or (source.status_code in ('todo', 'in_progress', 'in_review') and (
            source.due_date < today or source.due_date between today and due_cutoff
            or source.due_date is null
          ))
          or (source.status_code = 'backlog' and source.primary_assignee_id is null)
          or source.status_code = 'in_review'
        order by source.is_blocked desc, source.due_date asc nulls last,
          source.review_entered_at asc nulls last, source.display_id
        limit 12
      ) attention
    ), '[]'::jsonb),
    'workload', coalesce((
      select jsonb_agg(jsonb_build_object(
        'person', jsonb_build_object('id', row.id, 'displayName', row.display_name),
        'todo', row.todo_count, 'inProgress', row.progress_count, 'inReview', row.review_count,
        'contributedTickets', row.contributed_count, 'blocked', row.blocked_count,
        'overdue', row.overdue_count, 'lastRecordedWorkDate', row.last_work_date,
        'plannedUntil', row.planned_until, 'missingDueDateCount', row.missing_due_count,
        'activeOwnedTickets', row.active_owned_count,
        'standaloneVisualDays', row.visual_week_days
      ) order by row.display_name, row.id) from workload row
    ), '[]'::jsonb),
    'recentTicketWork', coalesce((
      select jsonb_agg(jsonb_build_object(
        'entryId', recent.id, 'workDate', recent.work_date,
        'workType', jsonb_build_object('code', recent.work_type_code, 'label', recent.work_type_label),
        'person', jsonb_build_object('id', recent.worked_by, 'displayName', recent.worked_by_name),
        'workItem', jsonb_build_object('id', recent.work_item_id, 'displayId', recent.display_id, 'title', recent.title)
      ) order by recent.work_date desc, recent.id desc)
      from (
        select entry.id, entry.work_date, entry.work_type_code, type.display_label as work_type_label,
          entry.worked_by, person.display_name as worked_by_name,
          entry.work_item_id, item.display_id, item.title
        from public.valid_work_log_entries entry
        join public.work_type_definitions type on type.code = entry.work_type_code
        join public.profiles person on person.id = entry.worked_by
        join public.work_items item on item.id = entry.work_item_id
        where entry.worked_by = any(selected_people)
          and entry.work_date between week_start and today
          and (requested_area_id is null or item.area_id = requested_area_id)
        order by entry.work_date desc, entry.id desc limit 10
      ) recent
    ), '[]'::jsonb),
    'recentVisualWork', coalesce((
      select jsonb_agg(jsonb_build_object(
        'entryId', recent.id, 'workDate', recent.work_date,
        'workType', jsonb_build_object('code', recent.work_type_code, 'label', recent.work_type_label),
        'description', recent.description,
        'person', jsonb_build_object('id', recent.worked_by, 'displayName', recent.worked_by_name),
        'area', case when recent.area_id is null then null else jsonb_build_object('id', recent.area_id, 'name', recent.area_name) end
      ) order by recent.work_date desc, recent.id desc)
      from (
        select entry.id, entry.work_date, entry.work_type_code, type.display_label as work_type_label,
          entry.description, entry.worked_by, person.display_name as worked_by_name,
          batch.related_area_id as area_id, area.name::text as area_name
        from public.valid_work_log_entries entry
        join public.work_type_definitions type on type.code = entry.work_type_code
        join public.profiles person on person.id = entry.worked_by
        join public.work_log_batches batch on batch.id = entry.batch_id
        left join public.work_areas area on area.id = batch.related_area_id
        where entry.worked_by = any(selected_people)
          and entry.work_item_id is null
          and entry.work_date between week_start and today
          and (requested_area_id is null or batch.related_area_id = requested_area_id)
        order by entry.work_date desc, entry.id desc limit 10
      ) recent
    ), '[]'::jsonb),
    'managementSignals', case when actor.is_admin or actor.position_code in ('lead', 'manager') then jsonb_build_object(
      'peopleInScope', (select count(*) from active_people),
      'workRecordedThisWeek', (select count(*) from work_by_person where recorded_week_days > 0),
      'noRecentWork', coalesce((select jsonb_agg(jsonb_build_object('id', person.id, 'displayName', person.display_name)
        order by person.display_name) from active_people person left join work_by_person work on work.id = person.id
        where work.last_work_date is null or work.last_work_date < recent_cutoff), '[]'::jsonb),
      'noActiveOwnedTickets', coalesce((select jsonb_agg(jsonb_build_object('id', row.id, 'displayName', row.display_name)
        order by row.display_name) from workload row where row.active_owned_count = 0), '[]'::jsonb),
      'reviewWaiting', coalesce((select jsonb_agg(jsonb_build_object(
        'id', review.id, 'displayId', review.display_id, 'title', review.title,
        'waitingSince', review.review_entered_at
      ) order by review.review_entered_at asc nulls last, review.display_id)
        from ticket_base review where review.status_code = 'in_review'), '[]'::jsonb)
    ) else null end
  ) into result;

  return result;
end;
$$;

revoke execute on function private.resolve_people_scope(public.profiles, text, uuid[]) from public, anon, authenticated;
revoke execute on function private.recent_working_window_start(date, integer) from public, anon, authenticated;
revoke all on function public.get_dashboard(text, uuid[], uuid) from public;
grant execute on function public.get_dashboard(text, uuid[], uuid) to authenticated;

comment on function public.get_dashboard(text, uuid[], uuid) is
  'Returns the Phase 5 position-aware Dashboard with reconciled source records and actual-date signals.';

commit;
