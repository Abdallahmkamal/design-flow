-- Activate the approved Slice 7 Reports scope and the three contextual CSV models.
begin;

create or replace function private.can_export_reports()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_application_user()
    and private.current_position_code() <> 'viewer';
$$;

do $$
declare
  definition text;
  legacy_scope constant text := $fragment$coalesce(scope_key, case actor.position_code
      when 'viewer' then 'all'
      when 'designer' then 'me'
      when 'lead' then 'lead:' || actor.id::text
      else 'manager:' || actor.id::text
    end)$fragment$;
begin
  select pg_get_functiondef('public.get_reports(jsonb)'::regprocedure) into definition;
  if strpos(definition, legacy_scope) = 0 then
    raise exception 'Unexpected get_reports definition; refusing Slice 7 scope activation';
  end if;
  definition := replace(definition, legacy_scope, 'scope_key');
  definition := replace(
    definition,
    '''defaultScopeKey'', scope_key',
    '''defaultScopeKey'', dashboard ->> ''defaultScopeKey'''
  );
  definition := replace(
    definition,
    '''defaultScopeKey'',scope_key',
    '''defaultScopeKey'',dashboard->>''defaultScopeKey'''
  );
  execute definition;
end;
$$;

create or replace function public.export_report_rows(report_type text, filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  today date := private.current_team_date();
  period_start date;
  period_end date;
  scope_key text := nullif(filters ->> 'scopeKey', '');
  requested_people uuid[];
  selected_people uuid[];
  area_ids uuid[];
  area_unassigned boolean := coalesce((filters ->> 'areaUnassigned')::boolean, false);
  label_ids uuid[];
  status_codes text[];
  work_type_codes text[];
  visual_type_codes text[];
  relationship_filter text := coalesce(nullif(filters ->> 'relationship', ''), 'owned_or_contributed');
  blocked_filter text := coalesce(nullif(filters ->> 'blocked', ''), 'any');
  due_filter text := coalesce(nullif(filters ->> 'due', ''), 'any');
  archived_filter text := coalesce(nullif(filters ->> 'archived', ''), 'all');
  stale_filter text := coalesce(nullif(filters ->> 'stale', ''), 'any');
  edited_filter text := coalesce(nullif(filters ->> 'edited', ''), 'any');
  logged_by_filter uuid;
  dashboard jsonb;
  rows jsonb := '[]'::jsonb;
begin
  actor := private.require_application_user_read();
  if not private.can_export_reports() then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;
  if report_type not in ('designers', 'tickets', 'visual_work') then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;
  begin
    period_start := coalesce((filters ->> 'periodStart')::date, date_trunc('month', today)::date);
    period_end := coalesce((filters ->> 'periodEnd')::date, today);
    if filters ? 'peopleIds' then select array_agg(value::uuid) into requested_people from jsonb_array_elements_text(filters -> 'peopleIds') value; end if;
    if filters ? 'areaIds' then select array_agg(value::uuid) into area_ids from jsonb_array_elements_text(filters -> 'areaIds') value; end if;
    if filters ? 'labelIds' then select array_agg(value::uuid) into label_ids from jsonb_array_elements_text(filters -> 'labelIds') value; end if;
    if filters ? 'statuses' then select array_agg(value) into status_codes from jsonb_array_elements_text(filters -> 'statuses') value; end if;
    if filters ? 'workTypes' then select array_agg(value) into work_type_codes from jsonb_array_elements_text(filters -> 'workTypes') value; end if;
    if filters ? 'visualTypes' then select array_agg(value) into visual_type_codes from jsonb_array_elements_text(filters -> 'visualTypes') value; end if;
    if nullif(filters ->> 'loggedBy', '') is not null then logged_by_filter := (filters ->> 'loggedBy')::uuid; end if;
  exception when invalid_text_representation or datetime_field_overflow then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end;
  if period_start is null or period_end is null or period_start > period_end or period_end > today then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  dashboard := public.get_dashboard(scope_key, requested_people, null);
  select coalesce(array_agg((person ->> 'id')::uuid), array[]::uuid[])
    into selected_people from jsonb_array_elements(dashboard -> 'selectedPeople') person;

  if report_type = 'designers' then
    with filtered_ticket_entries as (
      select entry.*
      from public.valid_work_log_entries entry
      join public.work_items item on item.id = entry.work_item_id
      where entry.context_code = 'ticket'
        and entry.work_date between period_start and period_end
        and (area_ids is null or item.area_id = any(area_ids))
        and (work_type_codes is null or entry.work_type_code = any(work_type_codes))
    ), filtered_visual_entries as (
      select entry.*
      from public.valid_work_log_entries entry
      where entry.context_code = 'standalone_visual'
        and entry.work_date between period_start and period_end
        and (area_ids is null or entry.related_area_id = any(area_ids))
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'designer', profile.display_name,
      'reportingGroup', concat_ws(' / ',
        private.reporting_hierarchy_on(profile.id, period_end)->'lead'->>'displayName',
        private.reporting_hierarchy_on(profile.id, period_end)->'manager'->>'displayName'),
      'periodStart', period_start, 'periodEnd', period_end,
      'ticketsAssigned', (select count(distinct item.id) from public.work_items item where private.work_item_assignee_on(item.id, period_end)=profile.id and (area_ids is null or item.area_id=any(area_ids))),
      'ticketsContributedTo', (select count(distinct entry.work_item_id) from filtered_ticket_entries entry where entry.worked_by=profile.id and entry.worked_by is distinct from private.work_item_assignee_on(entry.work_item_id,entry.work_date)),
      'openTickets', (select count(*) from public.work_items item where private.work_item_assignee_on(item.id,period_end)=profile.id and private.work_item_status_on(item.id,period_end) in ('todo','in_progress','in_review') and (area_ids is null or item.area_id=any(area_ids))),
      'completedTickets', (select count(*) from public.work_item_status_history history join public.work_items item on item.id=history.work_item_id where history.to_status_code='done' and history.changed_on between period_start and period_end and private.work_item_assignee_on(history.work_item_id,history.changed_on)=profile.id and (area_ids is null or item.area_id=any(area_ids))),
      'workLogEntries', (select count(*) from filtered_ticket_entries entry where entry.worked_by=profile.id),
      'activeWorkdays', (select count(distinct activity.work_date) from (select entry.work_date from filtered_ticket_entries entry where entry.worked_by=profile.id union all select entry.work_date from filtered_visual_entries entry where entry.worked_by=profile.id) activity),
      'standaloneVisualEntries', (select count(*) from filtered_visual_entries entry where entry.worked_by=profile.id),
      'lastRecordedWorkDate', (select max(activity.work_date) from (
        select entry.work_date from public.valid_work_log_entries entry join public.work_items item on item.id=entry.work_item_id
          where entry.context_code='ticket' and entry.worked_by=profile.id and entry.work_date<=period_end
            and (area_ids is null or item.area_id=any(area_ids)) and (work_type_codes is null or entry.work_type_code=any(work_type_codes))
        union all
        select entry.work_date from public.valid_work_log_entries entry
          where entry.context_code='standalone_visual' and entry.worked_by=profile.id and entry.work_date<=period_end
            and (area_ids is null or entry.related_area_id=any(area_ids))
      ) activity)
    ) order by profile.display_name), '[]'::jsonb) into rows
    from public.profiles profile where profile.id=any(selected_people);
  elsif report_type = 'tickets' then
    with candidates as (
      select distinct item.id
      from public.work_items item
      where private.work_item_assignee_on(item.id,period_end)=any(selected_people)
        or exists(select 1 from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.worked_by=any(selected_people) and entry.work_date between period_start and period_end)
    ), filtered as (
      select item.*,
        private.work_item_status_on(item.id,period_end) status_at_end,
        private.work_item_archived_on(item.id,period_end) archived_at_end,
        private.work_item_assignee_on(item.id,period_end) assignee_at_end,
        (select max(entry.work_date) from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date<=period_end) last_work_date
      from candidates candidate join public.work_items item on item.id=candidate.id
      where (area_ids is null or item.area_id=any(area_ids))
        and (label_ids is null or exists(select 1 from public.work_item_labels relation where relation.work_item_id=item.id and relation.label_id=any(label_ids) and relation.removed_at is null))
        and (work_type_codes is null or exists(select 1 from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_type_code=any(work_type_codes) and entry.work_date between period_start and period_end))
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'ticket', item.display_id || ' — ' || item.title, 'area', area.name::text,
      'status', status.display_label, 'primaryAssignee', assignee.display_name,
      'contributors', coalesce((select string_agg(distinct profile.display_name,'; ' order by profile.display_name) from public.valid_work_log_entries entry join public.profiles profile on profile.id=entry.worked_by where entry.work_item_id=item.id and entry.work_date between period_start and period_end and entry.worked_by is distinct from private.work_item_assignee_on(item.id,entry.work_date)),''),
      'labels', coalesce((select string_agg(label.name::text,'; ' order by label.name) from public.work_item_labels relation join public.labels label on label.id=relation.label_id where relation.work_item_id=item.id and relation.removed_at is null),''),
      'plannedStartDate', item.planned_start_date, 'dueDate', item.due_date,
      'firstWorkedDate', (select min(entry.work_date) from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date between period_start and period_end),
      'lastWorkedDate', (select max(entry.work_date) from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date between period_start and period_end),
      'daysOpen', greatest(0, period_end-item.created_at::date),
      'daysActive', (select count(distinct entry.work_date) from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date between period_start and period_end),
      'workLogEntries', (select count(*) from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date between period_start and period_end),
      'lastActivity', item.last_activity_at, 'figmaUrl', item.figma_url, 'archived', item.archived_at_end
    ) order by item.display_id), '[]'::jsonb) into rows
    from filtered item join public.work_areas area on area.id=item.area_id
    join public.work_item_statuses status on status.code=item.status_at_end
    left join public.profiles assignee on assignee.id=item.assignee_at_end
    where (status_codes is null or item.status_at_end=any(status_codes))
      and (archived_filter='all' or (archived_filter='archived')=item.archived_at_end)
      and (relationship_filter='owned_or_contributed' or (relationship_filter='owned' and item.assignee_at_end=any(selected_people)) or (relationship_filter='contributed' and exists(select 1 from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.worked_by=any(selected_people) and entry.work_date between period_start and period_end and entry.worked_by is distinct from private.work_item_assignee_on(item.id,entry.work_date))))
      and (blocked_filter='any' or (blocked_filter='blocked')=exists(select 1 from public.blockers blocker where blocker.work_item_id=item.id and blocker.blocked_at::date<=period_end and (blocker.resolved_at is null or blocker.resolved_at::date>period_end)))
      and (due_filter='any' or (due_filter='no_due_date' and item.due_date is null) or (due_filter='overdue' and item.due_date<period_end and item.status_at_end in('todo','in_progress','in_review')) or (due_filter='not_overdue' and not(item.due_date<period_end and item.status_at_end in('todo','in_progress','in_review'))))
      and (stale_filter='any' or (stale_filter='stale')=(item.status_at_end in('todo','in_progress','in_review') and item.last_work_date is not null and period_end>=private.add_working_days(item.last_work_date,5)));
  else
    select coalesce(jsonb_agg(jsonb_build_object(
      'workDate', entry.work_date, 'designer', worked.display_name,
      'reportingGroup', concat_ws(' / ', private.reporting_hierarchy_on(entry.worked_by,entry.work_date)->'lead'->>'displayName', private.reporting_hierarchy_on(entry.worked_by,entry.work_date)->'manager'->>'displayName'),
      'workType', type.display_label, 'description', entry.description, 'recordedAt', entry.logged_at
    ) order by entry.work_date desc,entry.logged_at desc,entry.id), '[]'::jsonb) into rows
    from public.valid_work_log_entries entry join public.profiles worked on worked.id=entry.worked_by
    join public.work_type_definitions type on type.code=entry.work_type_code
    where entry.context_code='standalone_visual' and entry.worked_by=any(selected_people)
      and entry.work_date between period_start and period_end
      and ((area_unassigned and entry.related_area_id is null) or (not area_unassigned and (area_ids is null or entry.related_area_id=any(area_ids))))
      and (visual_type_codes is null or entry.work_type_code=any(visual_type_codes))
      and (logged_by_filter is null or entry.logged_by=logged_by_filter)
      and (edited_filter='any' or (edited_filter='edited')=(entry.last_edited_at is not null));
  end if;
  return jsonb_build_object('reportType', report_type, 'periodStart',period_start,'periodEnd',period_end,'rows',rows);
end;
$$;

revoke all on function public.export_report_rows(text,jsonb) from public;
grant execute on function public.export_report_rows(text,jsonb) to authenticated;
comment on function public.get_reports(jsonb) is 'Returns the team-ready Reports view with D-110 people-scope authorization.';
comment on function public.export_report_rows(text,jsonb) is 'Returns all matching authorized rows for one of the three team-ready contextual CSV schemas.';
commit;
