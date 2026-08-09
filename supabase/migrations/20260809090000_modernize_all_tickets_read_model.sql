-- Slice 3: team-ready All Tickets server read model.

begin;

create or replace function private.count_working_days(
  start_date date,
  end_date date
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when start_date is null then null
    when end_date is null or end_date <= start_date then 0
    else coalesce((
      select count(*)::integer
      from generate_series(start_date + 1, end_date, interval '1 day') day
      where extract(dow from day)::smallint in (
        select unnest(policy.working_days)
        from public.product_policy_versions policy
        where policy.effective_to is null
      )
    ), 0)
  end;
$$;

create or replace function public.list_work_items(filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  archived_only boolean := false;
  blocked_filter text := coalesce(nullif(filters ->> 'blocked', ''), 'any');
  due_filter text := coalesce(nullif(filters ->> 'due', ''), 'any');
  stale_filter text := coalesce(nullif(filters ->> 'stale', ''), 'any');
  sort_field text := coalesce(nullif(filters ->> 'sort', ''), 'default');
  sort_direction text := coalesce(nullif(filters ->> 'direction', ''), 'asc');
  search_text text := btrim(coalesce(filters ->> 'search', ''));
  requested_page integer := 1;
  requested_page_size integer := 25;
  days_open_min integer;
  days_open_max integer;
  days_active_min integer;
  days_active_max integer;
  people_ids uuid[];
  status_codes text[];
  area_ids uuid[];
  label_ids uuid[];
  today date := private.current_team_date();
  due_cutoff date;
  stale_days integer;
  result jsonb;
begin
  actor := private.require_application_user_read();

  if jsonb_typeof(coalesce(filters, '{}'::jsonb)) <> 'object'
    or blocked_filter not in ('any', 'blocked', 'not_blocked')
    or due_filter not in ('any', 'overdue', 'due_soon', 'no_due_date')
    or stale_filter not in ('any', 'stale', 'not_stale')
    or sort_field not in (
      'default', 'ticket', 'area', 'status', 'last_activity', 'planned_start_date',
      'due_date', 'days_open', 'days_active'
    )
    or sort_direction not in ('asc', 'desc')
    or length(search_text) > 200
  then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if filters ? 'archivedOnly' then
    if jsonb_typeof(filters -> 'archivedOnly') <> 'boolean' then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    archived_only := (filters ->> 'archivedOnly')::boolean;
  end if;

  begin
  if filters ? 'page' then requested_page := (filters ->> 'page')::integer; end if;
  if filters ? 'pageSize' then requested_page_size := (filters ->> 'pageSize')::integer; end if;
  if filters ? 'daysOpenMin' then days_open_min := (filters ->> 'daysOpenMin')::integer; end if;
  if filters ? 'daysOpenMax' then days_open_max := (filters ->> 'daysOpenMax')::integer; end if;
  if filters ? 'daysActiveMin' then days_active_min := (filters ->> 'daysActiveMin')::integer; end if;
  if filters ? 'daysActiveMax' then days_active_max := (filters ->> 'daysActiveMax')::integer; end if;

  if requested_page < 1 or requested_page_size not in (25, 50, 100)
    or coalesce(days_open_min, 0) < 0 or coalesce(days_open_max, 0) < 0
    or coalesce(days_active_min, 0) < 0 or coalesce(days_active_max, 0) < 0
    or (days_open_min is not null and days_open_max is not null and days_open_min > days_open_max)
    or (days_active_min is not null and days_active_max is not null and days_active_min > days_active_max)
  then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if filters ? 'peopleIds' then
    if jsonb_typeof(filters -> 'peopleIds') <> 'array' then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
    select coalesce(array_agg(distinct value::uuid order by value::uuid), array[]::uuid[])
    into people_ids from jsonb_array_elements_text(filters -> 'peopleIds') value;
  end if;
  if filters ? 'statuses' then
    if jsonb_typeof(filters -> 'statuses') <> 'array' then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
    select coalesce(array_agg(distinct value order by value), array[]::text[])
    into status_codes from jsonb_array_elements_text(filters -> 'statuses') value;
  end if;
  if filters ? 'areaIds' then
    if jsonb_typeof(filters -> 'areaIds') <> 'array' then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
    select coalesce(array_agg(distinct value::uuid order by value::uuid), array[]::uuid[])
    into area_ids from jsonb_array_elements_text(filters -> 'areaIds') value;
  end if;
  if filters ? 'labelIds' then
    if jsonb_typeof(filters -> 'labelIds') <> 'array' then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
    select coalesce(array_agg(distinct value::uuid order by value::uuid), array[]::uuid[])
    into label_ids from jsonb_array_elements_text(filters -> 'labelIds') value;
  end if;
  exception
    when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end;

  if status_codes is not null and exists (
    select 1 from unnest(status_codes) code
    where not exists (select 1 from public.work_item_statuses status where status.code = code)
  ) then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  select private.add_working_days(today, policy.due_soon_working_days), policy.stale_after_working_days
  into due_cutoff, stale_days
  from public.product_policy_versions policy where policy.effective_to is null;

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
      coalesce(active_days.active_work_days, 0)::integer as days_active,
      case
        when item.planned_start_date is null then null
        when item.planned_start_date >= coalesce(done_state.done_on, today) then 0
        else private.count_working_days(item.planned_start_date, coalesce(done_state.done_on, today))
      end as days_open,
      (
        status.reporting_bucket = 'active'
        and stale_basis.basis_date is not null
        and stale_basis.basis_date <= today
        and today >= private.add_working_days(stale_basis.basis_date, stale_days)
      ) as is_stale,
      coalesce(label_data.labels, '[]'::jsonb) as labels,
      coalesce(contributor_data.contributors, '[]'::jsonb) as contributors,
      latest_event.event_type_code as last_activity_type
    from public.work_items item
    join public.work_areas area on area.id = item.area_id
    join public.work_item_statuses status on status.code = item.status_code
    left join public.profiles assignee on assignee.id = item.primary_assignee_id
    left join public.blockers blocker on blocker.work_item_id = item.id and blocker.resolved_at is null
    left join public.work_item_active_work_days active_days on active_days.work_item_id = item.id
    left join lateral (
      select count(*) filter (where subtask.is_completed)::integer as completed_count,
        count(*)::integer as total_count
      from public.subtasks subtask
      where subtask.work_item_id = item.id and subtask.withdrawn_at is null
    ) subtask_counts on true
    left join lateral (
      select jsonb_agg(jsonb_build_object('id', label.id, 'name', label.name::text)
        order by label.sort_order, label.name) as labels
      from public.work_item_labels relation join public.labels label on label.id = relation.label_id
      where relation.work_item_id = item.id and relation.removed_at is null
    ) label_data on true
    left join lateral (
      select jsonb_agg(jsonb_build_object('id', profile.id, 'displayName', profile.display_name)
        order by profile.display_name, profile.id) as contributors
      from public.current_work_item_contributors contributor
      join public.profiles profile on profile.id = contributor.profile_id
      where contributor.work_item_id = item.id
    ) contributor_data on true
    left join lateral (
      select history.changed_on as done_on
      from public.work_item_status_history history
      where history.work_item_id = item.id and history.to_status_code = 'done' and item.status_code = 'done'
      order by history.changed_at desc, history.id desc limit 1
    ) done_state on true
    left join lateral (
      select event.event_type_code
      from public.work_item_events event where event.work_item_id = item.id
      order by event.occurred_at desc, event.id desc limit 1
    ) latest_event on true
    left join lateral (
      select greatest(item.last_worked_on, item.planned_start_date,
        case when status.reporting_bucket = 'active' then (
          select max(history.changed_on) from public.work_item_status_history history
          join public.work_item_statuses entered on entered.code = history.to_status_code
          where history.work_item_id = item.id and entered.reporting_bucket = 'active'
        ) end) as basis_date
    ) stale_basis on true
  ), filtered as (
    select enriched.* from enriched
    where (case when archived_only then archived_at is not null else archived_at is null end)
      and (search_text = '' or display_id ilike '%' || search_text || '%'
        or title ilike '%' || search_text || '%' or coalesce(description, '') ilike '%' || search_text || '%')
      and (status_codes is null or cardinality(status_codes) = 0 or status_code = any(status_codes))
      and (area_ids is null or cardinality(area_ids) = 0 or area_id = any(area_ids))
      and (label_ids is null or cardinality(label_ids) = 0 or exists (
        select 1 from public.work_item_labels relation where relation.work_item_id = id
          and relation.removed_at is null and relation.label_id = any(label_ids)))
      and (people_ids is null or cardinality(people_ids) = 0
        or primary_assignee_id = any(people_ids) or exists (
          select 1 from public.current_work_item_contributors contributor
          where contributor.work_item_id = id and contributor.profile_id = any(people_ids)))
      and (blocked_filter = 'any' or (blocked_filter = 'blocked') = (active_blocker_id is not null))
      and (due_filter = 'any' or (due_filter = 'overdue' and due_date is not null and due_date < today)
        or (due_filter = 'due_soon' and due_date between today and due_cutoff)
        or (due_filter = 'no_due_date' and due_date is null))
      and (stale_filter = 'any' or (stale_filter = 'stale') = is_stale)
      and (days_open_min is null or days_open >= days_open_min)
      and (days_open_max is null or days_open <= days_open_max)
      and (days_active_min is null or days_active >= days_active_min)
      and (days_active_max is null or days_active <= days_active_max)
  ), stats as (
    select count(*)::integer as total_count,
      greatest(1, least(requested_page, greatest(1, ceil(count(*)::numeric / requested_page_size)::integer))) as effective_page
    from filtered
  ), paged as (
    select filtered.* from filtered
    order by
      case when sort_field = 'ticket' and sort_direction = 'asc' then lower(title) end asc,
      case when sort_field = 'ticket' and sort_direction = 'desc' then lower(title) end desc,
      case when sort_field = 'area' and sort_direction = 'asc' then lower(area_name) end asc,
      case when sort_field = 'area' and sort_direction = 'desc' then lower(area_name) end desc,
      case when sort_field = 'status' and sort_direction = 'asc' then status_sort_order end asc,
      case when sort_field = 'status' and sort_direction = 'desc' then status_sort_order end desc,
      case when sort_field = 'last_activity' and sort_direction = 'asc' then last_activity_at end asc nulls last,
      case when sort_field = 'last_activity' and sort_direction = 'desc' then last_activity_at end desc nulls last,
      case when sort_field = 'planned_start_date' and sort_direction = 'asc' then planned_start_date end asc nulls last,
      case when sort_field = 'planned_start_date' and sort_direction = 'desc' then planned_start_date end desc nulls last,
      case when sort_field = 'due_date' and sort_direction = 'asc' then due_date end asc nulls last,
      case when sort_field = 'due_date' and sort_direction = 'desc' then due_date end desc nulls last,
      case when sort_field = 'days_open' and sort_direction = 'asc' then days_open end asc nulls last,
      case when sort_field = 'days_open' and sort_direction = 'desc' then days_open end desc nulls last,
      case when sort_field = 'days_active' and sort_direction = 'asc' then days_active end asc,
      case when sort_field = 'days_active' and sort_direction = 'desc' then days_active end desc,
      display_id asc
    limit requested_page_size offset (((select effective_page from stats) - 1) * requested_page_size)
  )
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(jsonb_build_object(
      'id', page.id, 'displayId', page.display_id, 'title', page.title,
      'area', jsonb_build_object('id', page.area_id, 'name', page.area_name),
      'status', jsonb_build_object('code', page.status_code, 'label', page.status_label),
      'assignee', case when page.primary_assignee_id is null then null else jsonb_build_object('id', page.primary_assignee_id, 'displayName', page.assignee_name) end,
      'contributors', page.contributors, 'labels', page.labels,
      'plannedStartDate', page.planned_start_date, 'dueDate', page.due_date,
      'lastActivityAt', page.last_activity_at, 'lastActivityType', coalesce(page.last_activity_type, 'created'),
      'daysOpen', page.days_open, 'daysActive', page.days_active,
      'completedSubtasks', page.completed_subtasks, 'totalSubtasks', page.total_subtasks,
      'figmaUrl', page.figma_url, 'isBlocked', page.active_blocker_id is not null,
      'isStale', page.is_stale, 'isArchived', page.archived_at is not null,
      'createdAt', page.created_at, 'updatedAt', page.updated_at
    ) order by
      case when sort_field = 'ticket' and sort_direction = 'asc' then lower(page.title) end asc,
      case when sort_field = 'ticket' and sort_direction = 'desc' then lower(page.title) end desc,
      case when sort_field = 'area' and sort_direction = 'asc' then lower(page.area_name) end asc,
      case when sort_field = 'area' and sort_direction = 'desc' then lower(page.area_name) end desc,
      case when sort_field = 'status' and sort_direction = 'asc' then page.status_sort_order end asc,
      case when sort_field = 'status' and sort_direction = 'desc' then page.status_sort_order end desc,
      case when sort_field = 'last_activity' and sort_direction = 'asc' then page.last_activity_at end asc nulls last,
      case when sort_field = 'last_activity' and sort_direction = 'desc' then page.last_activity_at end desc nulls last,
      case when sort_field = 'planned_start_date' and sort_direction = 'asc' then page.planned_start_date end asc nulls last,
      case when sort_field = 'planned_start_date' and sort_direction = 'desc' then page.planned_start_date end desc nulls last,
      case when sort_field = 'due_date' and sort_direction = 'asc' then page.due_date end asc nulls last,
      case when sort_field = 'due_date' and sort_direction = 'desc' then page.due_date end desc nulls last,
      case when sort_field = 'days_open' and sort_direction = 'asc' then page.days_open end asc nulls last,
      case when sort_field = 'days_open' and sort_direction = 'desc' then page.days_open end desc nulls last,
      case when sort_field = 'days_active' and sort_direction = 'asc' then page.days_active end asc,
      case when sort_field = 'days_active' and sort_direction = 'desc' then page.days_active end desc,
      page.display_id asc) from paged page), '[]'::jsonb),
    'totalCount', (select total_count from stats), 'page', (select effective_page from stats),
    'pageSize', requested_page_size
  ) into result;
  return result;
end;
$$;

revoke execute on function private.count_working_days(date, date) from public, anon, authenticated;
revoke execute on function public.list_work_items(jsonb) from public, anon;
grant execute on function public.list_work_items(jsonb) to authenticated;

commit;
