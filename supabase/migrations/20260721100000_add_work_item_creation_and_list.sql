-- Design Flow Phase 3, slice 1: Work Item creation and All Tickets reads.

begin;

create function private.add_working_days(
  start_date date,
  number_of_days integer
)
returns date
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  candidate date := start_date;
  remaining integer := number_of_days;
  configured_days smallint[];
begin
  if start_date is null or number_of_days is null or number_of_days < 0 then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  select policy.working_days into configured_days
  from public.product_policy_versions policy
  where policy.effective_to is null;

  if configured_days is null then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  while remaining > 0 loop
    candidate := candidate + 1;
    if extract(dow from candidate)::smallint = any(configured_days) then
      remaining := remaining - 1;
    end if;
  end loop;

  return candidate;
end;
$$;

create function private.require_application_user_read()
returns public.profiles
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'DF_AUTH_REQUIRED';
  end if;

  select profile.* into actor
  from public.profiles profile
  where profile.id = auth.uid();

  if actor.id is null then
    raise exception using errcode = 'P0001', message = 'DF_AUTH_REQUIRED';
  end if;
  if not actor.is_active then
    raise exception using errcode = 'P0001', message = 'DF_ACCOUNT_INACTIVE';
  end if;
  if actor.must_change_password then
    raise exception using errcode = 'P0001', message = 'DF_PASSWORD_CHANGE_REQUIRED';
  end if;
  if actor.position_code = 'viewer' and actor.is_admin then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_VIEWER_ADMIN';
  end if;

  return actor;
end;
$$;

create function public.list_work_items(filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  selected_view text := coalesce(nullif(filters ->> 'view', ''), 'current');
  relationship_filter text := coalesce(nullif(filters ->> 'relationship', ''), 'owned');
  blocked_filter text := coalesce(nullif(filters ->> 'blocked', ''), 'any');
  due_filter text := coalesce(nullif(filters ->> 'due', ''), 'any');
  stale_filter text := coalesce(nullif(filters ->> 'stale', ''), 'any');
  sort_field text := coalesce(nullif(filters ->> 'sort', ''), 'due_date');
  sort_direction text := coalesce(nullif(filters ->> 'direction', ''), 'asc');
  search_text text := btrim(coalesce(filters ->> 'search', ''));
  requested_page integer := 1;
  people_ids uuid[];
  status_codes text[];
  area_ids uuid[];
  label_ids uuid[];
  use_default_people boolean := not (filters ? 'peopleIds');
  today date := private.current_team_date();
  due_cutoff date;
  stale_days integer;
  result jsonb;
begin
  actor := private.require_application_user_read();

  if jsonb_typeof(coalesce(filters, '{}'::jsonb)) <> 'object'
    or selected_view not in ('current', 'done', 'archived', 'all')
    or relationship_filter not in ('owned', 'contributed', 'owned_or_contributed')
    or blocked_filter not in ('any', 'blocked', 'not_blocked')
    or due_filter not in ('any', 'overdue', 'due_soon', 'no_due_date')
    or stale_filter not in ('any', 'stale', 'not_stale')
    or sort_field not in ('due_date', 'last_worked_on', 'created_at', 'status', 'title', 'display_id')
    or sort_direction not in ('asc', 'desc')
  then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  begin
    if filters ? 'page' then
      requested_page := (filters ->> 'page')::integer;
    end if;
    if requested_page < 1 then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;

    if filters ? 'peopleIds' then
      if jsonb_typeof(filters -> 'peopleIds') <> 'array' then
        raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
      end if;
      select coalesce(array_agg(value::uuid order by value::uuid), array[]::uuid[])
      into people_ids
      from jsonb_array_elements_text(filters -> 'peopleIds') value;
    end if;

    if filters ? 'statuses' then
      if jsonb_typeof(filters -> 'statuses') <> 'array' then
        raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
      end if;
      select coalesce(array_agg(value order by value), array[]::text[])
      into status_codes
      from jsonb_array_elements_text(filters -> 'statuses') value;
    end if;

    if filters ? 'areaIds' then
      if jsonb_typeof(filters -> 'areaIds') <> 'array' then
        raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
      end if;
      select coalesce(array_agg(value::uuid order by value::uuid), array[]::uuid[])
      into area_ids
      from jsonb_array_elements_text(filters -> 'areaIds') value;
    end if;

    if filters ? 'labelIds' then
      if jsonb_typeof(filters -> 'labelIds') <> 'array' then
        raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
      end if;
      select coalesce(array_agg(value::uuid order by value::uuid), array[]::uuid[])
      into label_ids
      from jsonb_array_elements_text(filters -> 'labelIds') value;
    end if;
  exception
    when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end;

  if use_default_people then
    if actor.position_code = 'viewer' then
      people_ids := array[]::uuid[];
    elsif actor.position_code = 'designer' then
      people_ids := array[actor.id];
    elsif actor.position_code = 'lead' then
      select array_agg(profile.id order by profile.id) into people_ids
      from public.profiles profile
      where profile.is_active
        and (profile.id = actor.id or profile.current_reports_to_id = actor.id);
    else
      select array_agg(profile.id order by profile.id) into people_ids
      from public.profiles profile
      where profile.is_active
        and (
          profile.id = actor.id
          or profile.current_reports_to_id = actor.id
          or profile.current_reports_to_id in (
            select lead.id
            from public.profiles lead
            where lead.is_active and lead.current_reports_to_id = actor.id
          )
        );
    end if;
  end if;
  people_ids := coalesce(people_ids, array[]::uuid[]);

  if status_codes is not null and exists (
    select 1 from unnest(status_codes) code
    where not exists (
      select 1 from public.work_item_statuses status where status.code = code
    )
  ) then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  select
    private.add_working_days(today, policy.due_soon_working_days),
    policy.stale_after_working_days
  into due_cutoff, stale_days
  from public.product_policy_versions policy
  where policy.effective_to is null;

  with enriched as (
    select
      item.*,
      area.name::text as area_name,
      status.display_label as status_label,
      status.sort_order as status_sort_order,
      status.reporting_bucket,
      assignee.display_name as assignee_name,
      blocker.id as active_blocker_id,
      coalesce(subtask_counts.completed_count, 0)::integer as completed_subtasks,
      coalesce(subtask_counts.total_count, 0)::integer as total_subtasks,
      coalesce(active_days.active_work_days, 0)::integer as active_work_days,
      stale_basis.basis_date,
      (
        status.reporting_bucket = 'active'
        and stale_basis.basis_date is not null
        and stale_basis.basis_date <= today
        and today > private.add_working_days(stale_basis.basis_date, stale_days)
      ) as is_stale,
      coalesce(label_data.labels, '[]'::jsonb) as labels,
      coalesce(contributor_data.contributors, '[]'::jsonb) as contributors
    from public.work_items item
    join public.work_areas area on area.id = item.area_id
    join public.work_item_statuses status on status.code = item.status_code
    left join public.profiles assignee on assignee.id = item.primary_assignee_id
    left join public.blockers blocker
      on blocker.work_item_id = item.id and blocker.resolved_at is null
    left join public.work_item_active_work_days active_days
      on active_days.work_item_id = item.id
    left join lateral (
      select
        count(*) filter (where subtask.is_completed)::integer as completed_count,
        count(*)::integer as total_count
      from public.subtasks subtask
      where subtask.work_item_id = item.id and subtask.withdrawn_at is null
    ) subtask_counts on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('id', label.id, 'name', label.name::text)
        order by label.sort_order, label.name
      ) as labels
      from public.work_item_labels relation
      join public.labels label on label.id = relation.label_id
      where relation.work_item_id = item.id and relation.removed_at is null
    ) label_data on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('id', profile.id, 'displayName', profile.display_name)
        order by profile.display_name, profile.id
      ) as contributors
      from public.current_work_item_contributors contributor
      join public.profiles profile on profile.id = contributor.profile_id
      where contributor.work_item_id = item.id
    ) contributor_data on true
    left join lateral (
      select greatest(
        item.last_worked_on,
        item.planned_start_date,
        case when status.reporting_bucket = 'active' then (
          select max(history.changed_on)
          from public.work_item_status_history history
          join public.work_item_statuses entered
            on entered.code = history.to_status_code
          where history.work_item_id = item.id
            and entered.reporting_bucket = 'active'
            and history.changed_at > coalesce((
              select max(later.changed_at)
              from public.work_item_status_history later
              join public.work_item_statuses exited
                on exited.code = later.to_status_code
              where later.work_item_id = item.id
                and exited.reporting_bucket <> 'active'
            ), '-infinity'::timestamptz)
        ) end
      ) as basis_date
    ) stale_basis on true
  ), filtered as (
    select enriched.*
    from enriched
    where
      case selected_view
        when 'current' then archived_at is null and status_code in ('backlog', 'todo', 'in_progress', 'in_review', 'paused')
        when 'done' then archived_at is null and status_code = 'done'
        when 'archived' then archived_at is not null
        else true
      end
      and (
        search_text = ''
        or display_id ilike '%' || search_text || '%'
        or title ilike '%' || search_text || '%'
        or coalesce(description, '') ilike '%' || search_text || '%'
      )
      and (status_codes is null or cardinality(status_codes) = 0 or status_code = any(status_codes))
      and (area_ids is null or cardinality(area_ids) = 0 or area_id = any(area_ids))
      and (
        label_ids is null or cardinality(label_ids) = 0 or exists (
          select 1 from public.work_item_labels relation
          where relation.work_item_id = id
            and relation.removed_at is null
            and relation.label_id = any(label_ids)
        )
      )
      and (
        cardinality(people_ids) = 0
        or (relationship_filter = 'owned' and primary_assignee_id = any(people_ids))
        or (relationship_filter = 'contributed' and exists (
          select 1 from public.current_work_item_contributors contributor
          where contributor.work_item_id = id and contributor.profile_id = any(people_ids)
        ))
        or (relationship_filter = 'owned_or_contributed' and (
          primary_assignee_id = any(people_ids)
          or exists (
            select 1 from public.current_work_item_contributors contributor
            where contributor.work_item_id = id and contributor.profile_id = any(people_ids)
          )
        ))
      )
      and (
        blocked_filter = 'any'
        or (blocked_filter = 'blocked' and active_blocker_id is not null)
        or (blocked_filter = 'not_blocked' and active_blocker_id is null)
      )
      and (
        due_filter = 'any'
        or (due_filter = 'overdue' and due_date is not null and due_date < today)
        or (due_filter = 'due_soon' and due_date between today and due_cutoff)
        or (due_filter = 'no_due_date' and due_date is null)
      )
      and (
        stale_filter = 'any'
        or (stale_filter = 'stale' and is_stale)
        or (stale_filter = 'not_stale' and not is_stale)
      )
  ), paged as (
    select filtered.*
    from filtered
    order by
      case when sort_field = 'due_date' and sort_direction = 'asc' then due_date end asc nulls last,
      case when sort_field = 'due_date' and sort_direction = 'desc' then due_date end desc nulls last,
      case when sort_field = 'last_worked_on' and sort_direction = 'asc' then last_worked_on end asc nulls last,
      case when sort_field = 'last_worked_on' and sort_direction = 'desc' then last_worked_on end desc nulls last,
      case when sort_field = 'created_at' and sort_direction = 'asc' then created_at end asc,
      case when sort_field = 'created_at' and sort_direction = 'desc' then created_at end desc,
      case when sort_field = 'status' and sort_direction = 'asc' then status_sort_order end asc,
      case when sort_field = 'status' and sort_direction = 'desc' then status_sort_order end desc,
      case when sort_field = 'title' and sort_direction = 'asc' then lower(title) end asc,
      case when sort_field = 'title' and sort_direction = 'desc' then lower(title) end desc,
      case when sort_field = 'display_id' and sort_direction = 'asc' then display_id end asc,
      case when sort_field = 'display_id' and sort_direction = 'desc' then display_id end desc,
      display_id asc
    limit 25 offset ((requested_page - 1) * 25)
  )
  select jsonb_build_object(
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', page.id,
        'displayId', page.display_id,
        'title', page.title,
        'area', jsonb_build_object('id', page.area_id, 'name', page.area_name),
        'status', jsonb_build_object('code', page.status_code, 'label', page.status_label),
        'assignee', case when page.primary_assignee_id is null then null else jsonb_build_object('id', page.primary_assignee_id, 'displayName', page.assignee_name) end,
        'contributors', page.contributors,
        'labels', page.labels,
        'plannedStartDate', page.planned_start_date,
        'dueDate', page.due_date,
        'lastWorkedOn', page.last_worked_on,
        'activeWorkDays', page.active_work_days,
        'completedSubtasks', page.completed_subtasks,
        'totalSubtasks', page.total_subtasks,
        'figmaUrl', page.figma_url,
        'isBlocked', page.active_blocker_id is not null,
        'isStale', page.is_stale,
        'isArchived', page.archived_at is not null,
        'createdAt', page.created_at,
        'updatedAt', page.updated_at
      ) order by
        case when sort_field = 'due_date' and sort_direction = 'asc' then page.due_date end asc nulls last,
        case when sort_field = 'due_date' and sort_direction = 'desc' then page.due_date end desc nulls last,
        case when sort_field = 'last_worked_on' and sort_direction = 'asc' then page.last_worked_on end asc nulls last,
        case when sort_field = 'last_worked_on' and sort_direction = 'desc' then page.last_worked_on end desc nulls last,
        case when sort_field = 'created_at' and sort_direction = 'asc' then page.created_at end asc,
        case when sort_field = 'created_at' and sort_direction = 'desc' then page.created_at end desc,
        case when sort_field = 'status' and sort_direction = 'asc' then page.status_sort_order end asc,
        case when sort_field = 'status' and sort_direction = 'desc' then page.status_sort_order end desc,
        case when sort_field = 'title' and sort_direction = 'asc' then lower(page.title) end asc,
        case when sort_field = 'title' and sort_direction = 'desc' then lower(page.title) end desc,
        case when sort_field = 'display_id' and sort_direction = 'asc' then page.display_id end asc,
        case when sort_field = 'display_id' and sort_direction = 'desc' then page.display_id end desc,
        page.display_id asc
      ) from paged page
    ), '[]'::jsonb),
    'totalCount', (select count(*) from filtered),
    'page', requested_page,
    'pageSize', 25
  ) into result;

  return result;
end;
$$;

create function public.create_work_item(
  title text,
  description text,
  area_id uuid,
  primary_assignee_id uuid default null,
  planned_start_date date default null,
  due_date date default null,
  figma_url text default null,
  label_ids uuid[] default array[]::uuid[],
  operation_id uuid default gen_random_uuid()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  assignee public.profiles;
  operation public.operation_requests;
  item public.work_items;
  event_id uuid;
  normalized_description text := nullif(btrim(description), '');
  normalized_figma_url text := nullif(btrim(figma_url), '');
  normalized_labels uuid[];
  now_at timestamptz := statement_timestamp();
  team_date date;
  result jsonb;
begin
  select coalesce(array_agg(value order by value), array[]::uuid[])
  into normalized_labels
  from unnest(coalesce(label_ids, array[]::uuid[])) value;

  operation := private.lock_or_create_operation(
    operation_id,
    'create_work_item',
    auth.uid(),
    jsonb_build_object(
      'title', btrim(title),
      'description', normalized_description,
      'area_id', area_id,
      'primary_assignee_id', primary_assignee_id,
      'planned_start_date', planned_start_date,
      'due_date', due_date,
      'figma_url', normalized_figma_url,
      'label_ids', to_jsonb(normalized_labels)
    ),
    'started'
  );
  if operation.state = 'completed' then
    return operation.result;
  end if;

  actor := private.require_profile(auth.uid(), false, false);
  if actor.position_code = 'viewer' then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;

  if operation_id is null or btrim(title) = '' or area_id is null
    or (planned_start_date is not null and due_date is not null and due_date < planned_start_date)
    or cardinality(normalized_labels) <> cardinality(array(select distinct unnest(normalized_labels)))
  then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if normalized_figma_url is not null and normalized_figma_url !~* '^https://([a-z0-9-]+\.)*figma\.com(/|$)' then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if primary_assignee_id is not null then
    select profile.* into assignee
    from public.profiles profile
    where profile.id = primary_assignee_id
    for update;
    if assignee.id is null or not assignee.is_active
      or assignee.must_change_password
      or assignee.position_code not in ('designer', 'lead', 'manager')
    then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
  end if;

  perform 1 from public.work_areas area
  where area.id = area_id and area.is_active
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if cardinality(normalized_labels) > 0 and (
    select count(*) from public.labels label
    where label.id = any(normalized_labels) and label.is_active
  ) <> cardinality(normalized_labels) then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  team_date := private.current_team_date();
  insert into public.work_items (
    title,
    description,
    area_id,
    status_code,
    primary_assignee_id,
    planned_start_date,
    due_date,
    figma_url,
    created_by,
    created_at,
    updated_at,
    last_activity_at
  ) values (
    btrim(title),
    normalized_description,
    area_id,
    'backlog',
    primary_assignee_id,
    planned_start_date,
    due_date,
    normalized_figma_url,
    actor.id,
    now_at,
    now_at,
    now_at
  ) returning * into item;

  insert into public.work_item_status_history (
    work_item_id, from_status_code, to_status_code, changed_by,
    changed_at, changed_on, operation_id
  ) values (
    item.id, null, 'backlog', actor.id, now_at, team_date, operation_id
  );

  if primary_assignee_id is not null then
    insert into public.work_item_assignments (
      work_item_id, assignee_id, started_at, started_on,
      assigned_by, start_operation_id
    ) values (
      item.id, primary_assignee_id, now_at, team_date,
      actor.id, operation_id
    );
  end if;

  if cardinality(normalized_labels) > 0 then
    insert into public.work_item_labels (
      work_item_id, label_id, applied_by, applied_at, apply_operation_id
    )
    select item.id, label_id, actor.id, now_at, operation_id
    from unnest(normalized_labels) label_id;
  end if;

  insert into public.work_item_events (
    work_item_id, event_type_code, actor_id, subject_type, subject_id,
    new_values, operation_id, occurred_at
  ) values (
    item.id,
    'created',
    actor.id,
    'work_item',
    item.id,
    jsonb_build_object(
      'display_id', item.display_id,
      'status_code', 'backlog',
      'area_id', area_id,
      'primary_assignee_id', primary_assignee_id,
      'label_ids', to_jsonb(normalized_labels)
    ),
    operation_id,
    now_at
  ) returning id into event_id;

  if primary_assignee_id is not null and primary_assignee_id <> actor.id then
    insert into public.notifications (
      recipient_id, actor_id, work_item_id, source_event_id,
      notification_type_code, created_at
    ) values (
      primary_assignee_id, actor.id, item.id, event_id,
      'assigned_to_you', now_at
    );
  end if;

  result := jsonb_build_object(
    'id', item.id,
    'display_id', item.display_id,
    'status_code', item.status_code,
    'updated_at', item.updated_at
  );
  return private.complete_operation(operation_id, result);
end;
$$;

revoke execute on function private.add_working_days(date, integer) from public, anon, authenticated;
revoke execute on function private.require_application_user_read() from public, anon, authenticated;
revoke execute on function public.list_work_items(jsonb) from public, anon;
revoke execute on function public.create_work_item(
  text, text, uuid, uuid, date, date, text, uuid[], uuid
) from public, anon;

grant execute on function public.list_work_items(jsonb) to authenticated;
grant execute on function public.create_work_item(
  text, text, uuid, uuid, date, date, text, uuid[], uuid
) to authenticated;

commit;
