-- Design Flow Phase 6: explainable Reports read models and authorized exports.

begin;

create or replace view public.valid_work_log_entries
with (security_barrier = true)
as
select
  entry.id,
  entry.batch_id,
  batch.context_code,
  batch.work_item_id,
  batch.related_area_id,
  batch.worked_by,
  batch.logged_by,
  entry.work_date,
  entry.work_type_code,
  entry.description,
  entry.position,
  batch.created_at as logged_at,
  case
    when batch.edited_at is not null or entry.updated_at > entry.created_at
      then greatest(coalesce(batch.edited_at, entry.updated_at), entry.updated_at)
    else null
  end as last_edited_at
from public.work_log_entries entry
join public.work_log_batches batch on batch.id = entry.batch_id
where private.is_application_user()
  and entry.withdrawn_at is null
  and batch.withdrawn_at is null;

comment on view public.valid_work_log_entries is
  'Current non-withdrawn work entries. last_edited_at is null until an actual correction occurs.';

create function private.work_item_assignee_on(target_work_item_id uuid, target_date date)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select assignment.assignee_id
  from public.work_item_assignments assignment
  where assignment.work_item_id = target_work_item_id
    and assignment.started_on <= target_date
    and (assignment.ended_on is null or target_date < assignment.ended_on)
  order by assignment.started_on desc, assignment.started_at desc, assignment.id desc
  limit 1;
$$;

create function private.work_item_status_on(target_work_item_id uuid, target_date date)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select history.to_status_code
      from public.work_item_status_history history
      where history.work_item_id = target_work_item_id
        and history.changed_on <= target_date
      order by history.changed_on desc, history.changed_at desc, history.id desc
      limit 1
    ),
    (select item.status_code from public.work_items item where item.id = target_work_item_id)
  );
$$;

create function private.work_item_archived_on(target_work_item_id uuid, target_date date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select event.event_type_code = 'archived'
      from public.work_item_events event
      where event.work_item_id = target_work_item_id
        and event.event_type_code in ('archived', 'restored')
        and (event.occurred_at at time zone coalesce(
          (select timezone from public.team_settings where singleton_key), 'UTC'
        ))::date <= target_date
      order by event.occurred_at desc, event.id desc
      limit 1
    ),
    false
  );
$$;

create function private.reporting_hierarchy_on(target_profile_id uuid, target_date date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with subject as (
    select coalesce(
      (
        select access.position_code
        from public.profile_access_periods access
        where access.profile_id = target_profile_id
          and access.started_at < (target_date + 1)::timestamp
          and (access.ended_at is null or access.ended_at >= target_date::timestamp)
        order by access.started_at desc
        limit 1
      ),
      profile.position_code
    ) as position_code
    from public.profiles profile where profile.id = target_profile_id
  ), direct_line as (
    select line.supervisor_id
    from public.reporting_line_assignments line
    where line.person_id = target_profile_id
      and line.started_on <= target_date
      and (line.ended_on is null or target_date < line.ended_on)
    order by line.started_on desc, line.created_at desc
    limit 1
  ), manager_line as (
    select line.supervisor_id
    from public.reporting_line_assignments line
    join direct_line direct on line.person_id = direct.supervisor_id
    where line.started_on <= target_date
      and (line.ended_on is null or target_date < line.ended_on)
    order by line.started_on desc, line.created_at desc
    limit 1
  )
  select jsonb_build_object(
    'lead', case
      when subject.position_code = 'designer' and direct_profile.id is not null
        then jsonb_build_object('id', direct_profile.id, 'displayName', direct_profile.display_name)
      else null
    end,
    'manager', case
      when subject.position_code = 'lead' and direct_profile.id is not null
        then jsonb_build_object('id', direct_profile.id, 'displayName', direct_profile.display_name)
      when subject.position_code = 'designer' and manager_profile.id is not null
        then jsonb_build_object('id', manager_profile.id, 'displayName', manager_profile.display_name)
      else null
    end
  )
  from subject
  left join direct_line direct on true
  left join public.profiles direct_profile on direct_profile.id = direct.supervisor_id
  left join manager_line manager on true
  left join public.profiles manager_profile on manager_profile.id = manager.supervisor_id;
$$;

create function public.get_export_capabilities()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_application_user_read();
  return jsonb_build_object(
    'canExportReports', private.can_export_reports(),
    'canExportWorkItem', private.can_export_work_item()
  );
end;
$$;

create function public.get_reports(filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  selected_tab text := coalesce(nullif(filters ->> 'tab', ''), 'tickets');
  today date := private.current_team_date();
  period_start date;
  period_end date;
  requested_page integer := 1;
  scope_key text := nullif(filters ->> 'scopeKey', '');
  requested_people uuid[];
  selected_people uuid[];
  area_ids uuid[];
  area_unassigned boolean := false;
  label_ids uuid[];
  status_codes text[];
  work_type_codes text[];
  visual_type_codes text[];
  relationship_filter text := coalesce(nullif(filters ->> 'relationship', ''), 'owned_or_contributed');
  blocked_filter text := coalesce(nullif(filters ->> 'blocked', ''), 'any');
  due_filter text := coalesce(nullif(filters ->> 'due', ''), 'any');
  archived_filter text := coalesce(nullif(filters ->> 'archived', ''), 'all');
  edited_filter text := coalesce(nullif(filters ->> 'edited', ''), 'any');
  stale_filter text := coalesce(nullif(filters ->> 'stale', ''), 'any');
  logged_by_filter uuid;
  dashboard jsonb;
  result jsonb;
begin
  actor := private.require_application_user_read();
  if jsonb_typeof(coalesce(filters, '{}'::jsonb)) <> 'object'
    or selected_tab not in ('tickets', 'designers', 'visual_work')
    or relationship_filter not in ('owned', 'contributed', 'owned_or_contributed')
    or blocked_filter not in ('any', 'blocked', 'not_blocked')
    or due_filter not in ('any', 'overdue', 'not_overdue', 'no_due_date')
    or archived_filter not in ('all', 'archived', 'not_archived')
    or edited_filter not in ('any', 'edited', 'not_edited')
    or stale_filter not in ('any', 'stale', 'not_stale')
  then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  begin
    period_start := coalesce((filters ->> 'periodStart')::date, date_trunc('month', today)::date);
    period_end := coalesce((filters ->> 'periodEnd')::date, today);
    requested_page := coalesce((filters ->> 'page')::integer, 1);
    area_unassigned := coalesce((filters ->> 'areaUnassigned')::boolean, false);
    if filters ? 'loggedBy' and nullif(filters ->> 'loggedBy', '') is not null then
      logged_by_filter := (filters ->> 'loggedBy')::uuid;
    end if;
    if filters ? 'peopleIds' then
      select coalesce(array_agg(value::uuid order by value::uuid), array[]::uuid[])
      into requested_people from jsonb_array_elements_text(filters -> 'peopleIds') value;
    end if;
    if filters ? 'areaIds' then
      select coalesce(array_agg(value::uuid order by value::uuid), array[]::uuid[])
      into area_ids from jsonb_array_elements_text(filters -> 'areaIds') value;
    end if;
    if filters ? 'labelIds' then
      select coalesce(array_agg(value::uuid order by value::uuid), array[]::uuid[])
      into label_ids from jsonb_array_elements_text(filters -> 'labelIds') value;
    end if;
    if filters ? 'statuses' then
      select coalesce(array_agg(value order by value), array[]::text[])
      into status_codes from jsonb_array_elements_text(filters -> 'statuses') value;
    end if;
    if filters ? 'workTypes' then
      select coalesce(array_agg(value order by value), array[]::text[])
      into work_type_codes from jsonb_array_elements_text(filters -> 'workTypes') value;
    end if;
    if filters ? 'visualTypes' then
      select coalesce(array_agg(value order by value), array[]::text[])
      into visual_type_codes from jsonb_array_elements_text(filters -> 'visualTypes') value;
    end if;
  exception when invalid_text_representation or datetime_field_overflow then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end;

  if period_start is null or period_end is null or period_start > period_end
    or period_end > today or requested_page < 1
  then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;
  if area_ids is not null and exists (
    select 1 from unnest(area_ids) requested(id)
    left join public.work_areas area on area.id = requested.id where area.id is null
  ) then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if status_codes is not null and exists (
    select 1 from unnest(status_codes) requested(code)
    left join public.work_item_statuses status on status.code = requested.code where status.code is null
  ) then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;

  dashboard := public.get_dashboard(scope_key, requested_people, null);
  select coalesce(array_agg((person ->> 'id')::uuid), array[]::uuid[])
  into selected_people from jsonb_array_elements(dashboard -> 'selectedPeople') person;

  if selected_tab = 'tickets' then
    with valid_entries as (
      select entry.*, item.area_id,
        private.work_item_assignee_on(entry.work_item_id, entry.work_date) as assignee_on_date
      from public.valid_work_log_entries entry
      join public.work_items item on item.id = entry.work_item_id
      where entry.context_code = 'ticket'
        and entry.work_date between period_start and period_end
        and entry.worked_by = any(selected_people)
        and (area_ids is null or item.area_id = any(area_ids))
        and (work_type_codes is null or entry.work_type_code = any(work_type_codes))
    ), ticket_ids as (
      select distinct entry.work_item_id as id from valid_entries entry
      union
      select distinct history.work_item_id
      from public.work_item_status_history history
      where history.changed_on between period_start and period_end
        and history.to_status_code = 'done'
        and private.work_item_assignee_on(history.work_item_id, history.changed_on) = any(selected_people)
      union
      select item.id from public.work_items item
      where private.work_item_assignee_on(item.id, period_end) = any(selected_people)
    ), ticket_rows as (
      select
        item.id, item.display_id, item.title, area.name::text as area_name,
        private.work_item_status_on(item.id, period_end) as status_code,
        status.display_label as status_label,
        snapshot_assignee.id as assignee_id,
        snapshot_assignee.display_name as assignee_name,
        item.planned_start_date, item.due_date,
        private.work_item_archived_on(item.id, period_end) as is_archived,
        coalesce((select jsonb_agg(label.name::text order by label.sort_order, label.name)
          from public.work_item_labels relation join public.labels label on label.id = relation.label_id
          where relation.work_item_id = item.id and relation.applied_at::date <= period_end
            and (relation.removed_at is null or relation.removed_at::date > period_end)), '[]'::jsonb) as labels,
        coalesce((select jsonb_agg(distinct profile.display_name order by profile.display_name)
          from valid_entries entry join public.profiles profile on profile.id = entry.worked_by
          where entry.work_item_id = item.id and entry.worked_by is distinct from entry.assignee_on_date), '[]'::jsonb) as contributors,
        (select min(entry.work_date) from valid_entries entry where entry.work_item_id = item.id) as first_work_date,
        (select max(entry.work_date) from valid_entries entry where entry.work_item_id = item.id) as last_work_date,
        (select count(distinct entry.work_date)::integer from valid_entries entry where entry.work_item_id = item.id) as active_work_days,
        (select count(*)::integer from valid_entries entry where entry.work_item_id = item.id) as work_entries,
        (select count(*)::integer from public.work_item_status_history history
          where history.work_item_id = item.id and history.to_status_code = 'done'
            and history.changed_on between period_start and period_end) as completed_count,
        (select count(*)::integer from public.work_item_status_history history
          where history.work_item_id = item.id and history.from_status_code = 'done'
            and history.changed_on between period_start and period_end) as reopen_count,
        exists (select 1 from public.blockers blocker where blocker.work_item_id = item.id
          and blocker.blocked_at::date <= period_end
          and (blocker.resolved_at is null or blocker.resolved_at::date > period_end)) as is_blocked,
        coalesce((select sum(
          greatest(0, least(period_end, coalesce(blocker.resolved_at::date, period_end))
            - greatest(period_start, blocker.blocked_at::date) + 1))::integer
          from public.blockers blocker where blocker.work_item_id = item.id
            and blocker.blocked_at::date <= period_end
            and coalesce(blocker.resolved_at::date, period_end) >= period_start), 0) as blocked_days,
        (select count(*) filter (where subtask.is_completed)::integer from public.subtasks subtask
          where subtask.work_item_id = item.id and subtask.withdrawn_at is null
            and subtask.created_at::date <= period_end) as completed_subtasks,
        (select count(*)::integer from public.subtasks subtask
          where subtask.work_item_id = item.id and subtask.withdrawn_at is null
            and subtask.created_at::date <= period_end) as total_subtasks
      from ticket_ids selected
      join public.work_items item on item.id = selected.id
      join public.work_areas area on area.id = item.area_id
      join public.work_item_statuses status on status.code = private.work_item_status_on(item.id, period_end)
      left join public.profiles snapshot_assignee
        on snapshot_assignee.id = private.work_item_assignee_on(item.id, period_end)
      where (area_ids is null or item.area_id = any(area_ids))
        and (label_ids is null or exists(select 1 from public.work_item_labels relation where relation.work_item_id=item.id and relation.label_id=any(label_ids) and relation.removed_at is null))
    ), filtered as (
      select *,
        case
          when due_date is null then 'no_due_date'
          when status_code in ('todo','in_progress','in_review') and due_date < period_end then 'overdue'
          else 'not_overdue'
        end as due_state
      from ticket_rows row
      where (status_codes is null or row.status_code = any(status_codes))
        and (blocked_filter = 'any' or (blocked_filter = 'blocked') = row.is_blocked)
        and (archived_filter = 'all' or (archived_filter = 'archived') = row.is_archived)
        and (
          relationship_filter = 'owned_or_contributed'
          or (relationship_filter = 'owned' and row.assignee_id = any(selected_people))
          or (relationship_filter = 'contributed' and jsonb_array_length(row.contributors) > 0)
        )
    ), final_rows as (
      select * from filtered row
      where due_filter = 'any' or row.due_state = due_filter
    ), stale_rows as (
      select * from final_rows row
      where stale_filter='any'
        or (stale_filter='stale')=(row.status_code in ('todo','in_progress','in_review') and row.last_work_date is not null and period_end >= private.add_working_days(row.last_work_date,5))
    ), paged as (
      select * from stale_rows order by due_date asc nulls last, display_id
      limit 25 offset (requested_page - 1) * 25
    )
    select jsonb_build_object(
      'tab', selected_tab,
      'periodStart', period_start, 'periodEnd', period_end, 'snapshotAt', period_end,
      'defaultScopeKey', dashboard ->> 'defaultScopeKey',
      'selectedScopeKey', dashboard ->> 'selectedScopeKey',
      'selectedPeople', dashboard -> 'selectedPeople',
      'scopeOptions', dashboard -> 'scopeOptions', 'peopleOptions', dashboard -> 'peopleOptions',
      'areaOptions', dashboard -> 'areaOptions', 'canExport', private.can_export_reports(),
      'page', requested_page, 'pageSize', 25, 'totalCount', (select count(*) from stale_rows),
      'cards', jsonb_build_object(
        'ticketsWorkedOn', (select count(*) from stale_rows where work_entries > 0),
        'completed', (select coalesce(sum(completed_count),0) from stale_rows),
        'reopened', (select coalesce(sum(reopen_count),0) from stale_rows),
        'activeWorkload', (select count(*) from stale_rows where status_code in ('todo','in_progress','in_review') and not is_archived),
        'blocked', (select count(*) from stale_rows where is_blocked),
        'overdue', (select count(*) from stale_rows where due_state = 'overdue'),
        'stale', (select count(*) from stale_rows where status_code in ('todo','in_progress','in_review')
          and last_work_date is not null and period_end >= private.add_working_days(last_work_date, 5))
      ),
      'charts', jsonb_build_object(
        'activityOverTime', coalesce((select jsonb_agg(jsonb_build_object('label', work_date, 'value', ticket_count) order by work_date)
          from (select entry.work_date, count(distinct entry.work_item_id)::integer ticket_count from valid_entries entry group by entry.work_date) chart), '[]'::jsonb),
        'completionsReopenings', coalesce((select jsonb_agg(jsonb_build_object('label', changed_on, 'completed', completed, 'reopened', reopened) order by changed_on)
          from (select history.changed_on,
            count(*) filter (where history.to_status_code='done')::integer completed,
            count(*) filter (where history.from_status_code='done')::integer reopened
            from public.work_item_status_history history join ticket_ids selected on selected.id=history.work_item_id
            where history.changed_on between period_start and period_end group by history.changed_on) chart), '[]'::jsonb),
        'statusDistribution', coalesce((select jsonb_agg(jsonb_build_object('label', status_label, 'value', count) order by status_label)
          from (select status_label, count(*)::integer count from stale_rows group by status_label) chart), '[]'::jsonb),
        'byArea', coalesce((select jsonb_agg(jsonb_build_object('label', area_name, 'value', count) order by area_name)
          from (select area_name, count(*)::integer count from stale_rows group by area_name) chart), '[]'::jsonb)
      ),
      'rows', coalesce((select jsonb_agg(jsonb_build_object(
        'id', row.id, 'displayId', row.display_id, 'title', row.title, 'area', row.area_name,
        'labels', row.labels, 'status', jsonb_build_object('code', row.status_code, 'label', row.status_label),
        'assignee', case when row.assignee_id is null then null else jsonb_build_object('id', row.assignee_id, 'displayName', row.assignee_name) end,
        'contributors', row.contributors, 'plannedStartDate', row.planned_start_date, 'dueDate', row.due_date,
        'dueState', row.due_state, 'firstWorkDate', row.first_work_date, 'lastWorkDate', row.last_work_date,
        'activeWorkDays', row.active_work_days, 'workEntries', row.work_entries,
        'completedTransitions', row.completed_count, 'reopenTransitions', row.reopen_count,
        'isBlocked', row.is_blocked, 'blockedDays', row.blocked_days,
        'completedSubtasks', row.completed_subtasks, 'totalSubtasks', row.total_subtasks,
        'isArchived', row.is_archived
      ) order by row.due_date asc nulls last, row.display_id) from paged row), '[]'::jsonb)
    ) into result;
  elsif selected_tab = 'designers' then
    with people as (
      select profile.* from public.profiles profile where profile.id = any(selected_people)
    ), ticket_entries as (
      select entry.*, item.area_id,
        private.work_item_assignee_on(entry.work_item_id, entry.work_date) as assignee_on_date
      from public.valid_work_log_entries entry
      join public.work_items item on item.id = entry.work_item_id
      where entry.context_code='ticket' and entry.work_date between period_start and period_end
        and entry.worked_by = any(selected_people)
        and (area_ids is null or item.area_id = any(area_ids))
        and (work_type_codes is null or entry.work_type_code = any(work_type_codes))
    ), visual_entries as (
      select entry.* from public.valid_work_log_entries entry
      where entry.context_code='standalone_visual' and entry.work_date between period_start and period_end
        and entry.worked_by = any(selected_people)
        and ((area_unassigned and entry.related_area_id is null) or (not area_unassigned and (area_ids is null or entry.related_area_id = any(area_ids))))
    ), designer_rows as (
      select person.id, person.display_name, person.position_code, person.is_admin,
        private.reporting_hierarchy_on(person.id, period_end) as hierarchy,
        (select count(distinct entry.work_item_id)::integer from ticket_entries entry where entry.worked_by=person.id) tickets_worked,
        (select count(distinct entry.work_date)::integer from ticket_entries entry where entry.worked_by=person.id) ticket_active_days,
        (select count(distinct (entry.work_item_id, entry.work_date))::integer from ticket_entries entry where entry.worked_by=person.id) ticket_days,
        (select count(*)::integer from public.work_item_status_history history where history.to_status_code='done'
          and history.changed_on between period_start and period_end
          and private.work_item_assignee_on(history.work_item_id, history.changed_on)=person.id) completed_primary,
        (select count(distinct entry.work_item_id)::integer from ticket_entries entry
          where entry.worked_by=person.id and entry.assignee_on_date is distinct from person.id) contributed_tickets,
        (select count(distinct (entry.work_item_id,entry.work_date))::integer from ticket_entries entry
          where entry.worked_by=person.id and entry.assignee_on_date=person.id) primary_ticket_days,
        (select count(distinct (entry.work_item_id,entry.work_date))::integer from ticket_entries entry
          where entry.worked_by=person.id and entry.assignee_on_date is distinct from person.id) contributor_ticket_days,
        (select count(*)::integer from public.work_items item where private.work_item_assignee_on(item.id,period_end)=person.id
          and private.work_item_status_on(item.id,period_end) in ('todo','in_progress','in_review')
          and not private.work_item_archived_on(item.id,period_end)) active_owned,
        (select count(*)::integer from public.work_items item where private.work_item_assignee_on(item.id,period_end)=person.id
          and private.work_item_status_on(item.id,period_end) in ('todo','in_progress','in_review')
          and exists(select 1 from public.blockers blocker where blocker.work_item_id=item.id and blocker.blocked_at::date<=period_end
            and (blocker.resolved_at is null or blocker.resolved_at::date>period_end))) blocked_owned,
        (select count(*)::integer from public.work_items item where private.work_item_assignee_on(item.id,period_end)=person.id
          and private.work_item_status_on(item.id,period_end) in ('todo','in_progress','in_review') and item.due_date<period_end) overdue_owned,
        (select count(*)::integer from public.work_items item where private.work_item_assignee_on(item.id,period_end)=person.id
          and not exists(select 1 from ticket_entries entry where entry.work_item_id=item.id and entry.worked_by=person.id)) owned_without_work,
        (select max(entry.work_date) from public.valid_work_log_entries entry where entry.worked_by=person.id and entry.work_date<=period_end) last_recorded_work,
        (select max(item.due_date) from public.work_items item where private.work_item_assignee_on(item.id,period_end)=person.id
          and private.work_item_status_on(item.id,period_end) in ('todo','in_progress','in_review')
          and not private.work_item_archived_on(item.id,period_end)) planned_until,
        (select count(*)::integer from public.work_items item where private.work_item_assignee_on(item.id,period_end)=person.id
          and private.work_item_status_on(item.id,period_end) in ('todo','in_progress','in_review') and item.due_date is null
          and not private.work_item_archived_on(item.id,period_end)) missing_due,
        (select count(distinct entry.work_date)::integer from visual_entries entry where entry.worked_by=person.id) visual_days,
        (select count(distinct entry.work_date)::integer from public.valid_work_log_entries entry
          where entry.worked_by=person.id and entry.work_date between period_start and period_end) active_calendar_days
      from people person
    ), designer_ticket_rows as (
      select entry.worked_by, item.id, item.display_id, item.title, area.name::text area_name,
        min(entry.work_date) first_activity_date, max(entry.work_date) last_activity_date,
        array_agg(distinct entry.work_date order by entry.work_date) activity_dates,
        array_agg(distinct type.display_label order by type.display_label) work_types,
        bool_or(entry.assignee_on_date is distinct from entry.worked_by) contributed_during_period,
        private.work_item_assignee_on(item.id,period_end)=entry.worked_by owned_at_period_end,
        private.work_item_status_on(item.id,period_end) status_at_period_end,
        snapshot_assignee.display_name primary_assignee_at_period_end,item.due_date,
        exists(select 1 from public.blockers blocker where blocker.work_item_id=item.id and blocker.blocked_at::date<=period_end and (blocker.resolved_at is null or blocker.resolved_at::date>period_end)) blocked_at_period_end
      from ticket_entries entry join public.work_items item on item.id=entry.work_item_id
      join public.work_areas area on area.id=item.area_id
      join public.work_type_definitions type on type.code=entry.work_type_code
      left join public.profiles snapshot_assignee on snapshot_assignee.id=private.work_item_assignee_on(item.id,period_end)
      group by entry.worked_by,item.id,item.display_id,item.title,area.name,snapshot_assignee.display_name
    ), paged as (
      select * from designer_rows order by display_name, id limit 25 offset (requested_page-1)*25
    )
    select jsonb_build_object(
      'tab', selected_tab, 'periodStart',period_start,'periodEnd',period_end,'snapshotAt',period_end,
      'defaultScopeKey',dashboard->>'defaultScopeKey','selectedScopeKey',dashboard->>'selectedScopeKey',
      'selectedPeople',dashboard->'selectedPeople','scopeOptions',dashboard->'scopeOptions',
      'peopleOptions',dashboard->'peopleOptions','areaOptions',dashboard->'areaOptions',
      'canExport',private.can_export_reports(),'page',requested_page,'pageSize',25,
      'totalCount',(select count(*) from designer_rows),
      'charts',jsonb_build_object(
        'activityOverTime',coalesce((select jsonb_agg(jsonb_build_object('label',work_date,'value',ticket_days) order by work_date)
          from (select work_date,count(distinct (worked_by,work_item_id))::integer ticket_days from ticket_entries group by work_date) chart),'[]'::jsonb),
        'activityMix',coalesce((select jsonb_agg(jsonb_build_object('label',display_name,'primary',primary_ticket_days,'contributor',contributor_ticket_days) order by display_name) from designer_rows),'[]'::jsonb),
        'byWorkType',coalesce((select jsonb_agg(jsonb_build_object('label',label,'value',activity_days) order by label)
          from (select type.display_label label,count(distinct (entry.worked_by,entry.work_date))::integer activity_days
            from ticket_entries entry join public.work_type_definitions type on type.code=entry.work_type_code group by type.display_label) chart),'[]'::jsonb),
        'byArea',coalesce((select jsonb_agg(jsonb_build_object('label',label,'value',ticket_days) order by label)
          from (select area.name::text label,count(distinct(entry.worked_by,entry.work_item_id,entry.work_date))::integer ticket_days
            from ticket_entries entry join public.work_areas area on area.id=entry.area_id group by area.name) chart),'[]'::jsonb)
      ),
      'rows',coalesce((select jsonb_agg(to_jsonb(row) order by row.display_name) from paged row),'[]'::jsonb),
      'designerTickets',case when cardinality(selected_people)=1 then coalesce((select jsonb_agg(jsonb_build_object(
        'id',row.id,'displayId',row.display_id,'title',row.title,'area',row.area_name,
        'firstActivityDate',row.first_activity_date,'lastActivityDate',row.last_activity_date,
        'activityDates',row.activity_dates,'workTypes',row.work_types,
        'contributedDuringPeriod',row.contributed_during_period,'ownedAtPeriodEnd',row.owned_at_period_end,
        'statusAtPeriodEnd',row.status_at_period_end,'primaryAssigneeAtPeriodEnd',row.primary_assignee_at_period_end,
        'dueDate',row.due_date,'blockedAtPeriodEnd',row.blocked_at_period_end
      ) order by row.display_id) from designer_ticket_rows row),'[]'::jsonb) else '[]'::jsonb end,
      'recordedActivity',case when cardinality(selected_people)=1 then coalesce((select jsonb_agg(jsonb_build_object(
        'id',entry.id,'workDate',entry.work_date,'workItem',jsonb_build_object('id',item.id,'displayId',item.display_id,'title',item.title),
        'area',area.name::text,'workType',type.display_label,
        'relationship',case when entry.worked_by=entry.assignee_on_date then 'primary' else 'contributor' end,
        'description',entry.description,'workedBy',worked.display_name,'loggedBy',logged.display_name,
        'loggedAt',entry.logged_at,'lastEditedAt',entry.last_edited_at
        ) order by entry.work_date desc,entry.logged_at desc,entry.id desc)
        from ticket_entries entry join public.work_items item on item.id=entry.work_item_id
        join public.work_areas area on area.id=item.area_id join public.work_type_definitions type on type.code=entry.work_type_code
        join public.profiles worked on worked.id=entry.worked_by join public.profiles logged on logged.id=entry.logged_by),'[]'::jsonb) else '[]'::jsonb end,
      'visualActivity',case when cardinality(selected_people)=1 then coalesce((select jsonb_agg(jsonb_build_object(
        'id',entry.id,'workDate',entry.work_date,'workType',type.display_label,'area',area.name::text,'description',entry.description
        ) order by entry.work_date desc,entry.id desc) from visual_entries entry
        join public.work_type_definitions type on type.code=entry.work_type_code
        left join public.work_areas area on area.id=entry.related_area_id),'[]'::jsonb) else '[]'::jsonb end
    ) into result;
  else
    with visual_entries as (
      select entry.*, worked.display_name worked_name, logged.display_name logged_name,
        type.display_label type_label, area.name::text area_name,
        private.reporting_hierarchy_on(entry.worked_by,entry.work_date) hierarchy
      from public.valid_work_log_entries entry
      join public.profiles worked on worked.id=entry.worked_by
      join public.profiles logged on logged.id=entry.logged_by
      join public.work_type_definitions type on type.code=entry.work_type_code
      left join public.work_areas area on area.id=entry.related_area_id
      where entry.context_code='standalone_visual' and entry.work_date between period_start and period_end
        and entry.worked_by=any(selected_people)
        and ((area_unassigned and entry.related_area_id is null) or (not area_unassigned and (area_ids is null or entry.related_area_id=any(area_ids))))
        and (visual_type_codes is null or entry.work_type_code=any(visual_type_codes))
        and (logged_by_filter is null or entry.logged_by=logged_by_filter)
        and (edited_filter='any' or (edited_filter='edited')=(entry.last_edited_at is not null))
    ), paged as (
      select * from visual_entries order by work_date desc,logged_at desc,id desc limit 25 offset(requested_page-1)*25
    )
    select jsonb_build_object(
      'tab',selected_tab,'periodStart',period_start,'periodEnd',period_end,'snapshotAt',null,
      'defaultScopeKey',dashboard->>'defaultScopeKey','selectedScopeKey',dashboard->>'selectedScopeKey',
      'selectedPeople',dashboard->'selectedPeople','scopeOptions',dashboard->'scopeOptions',
      'peopleOptions',dashboard->'peopleOptions','areaOptions',dashboard->'areaOptions',
      'canExport',private.can_export_reports(),'page',requested_page,'pageSize',25,'totalCount',(select count(*) from visual_entries),
      'cards',jsonb_build_object(
        'visualActivityDays',(select count(distinct(worked_by,work_date)) from visual_entries),
        'visualEntries',(select count(*) from visual_entries),
        'designers',(select count(distinct worked_by) from visual_entries),
        'areas',(select count(distinct coalesce(related_area_id,'00000000-0000-0000-0000-000000000000'::uuid)) from visual_entries)
      ),
      'charts',jsonb_build_object(
        'activityOverTime',coalesce((select jsonb_agg(jsonb_build_object('label',work_date,'value',activity_days) order by work_date)
          from(select work_date,count(distinct(worked_by,work_date))::integer activity_days from visual_entries group by work_date) chart),'[]'::jsonb),
        'byType',coalesce((select jsonb_agg(jsonb_build_object('label',type_label,'value',activity_days) order by type_label)
          from(select type_label,count(distinct(worked_by,work_date))::integer activity_days from visual_entries group by type_label) chart),'[]'::jsonb),
        'byDesigner',coalesce((select jsonb_agg(jsonb_build_object('label',worked_name,'value',activity_days) order by worked_name)
          from(select worked_name,count(distinct(worked_by,work_date))::integer activity_days from visual_entries group by worked_name) chart),'[]'::jsonb),
        'byArea',coalesce((select jsonb_agg(jsonb_build_object('label',area_name,'value',activity_days) order by area_name)
          from(select coalesce(area_name,'Unassigned') area_name,count(distinct(worked_by,work_date))::integer activity_days from visual_entries group by coalesce(area_name,'Unassigned')) chart),'[]'::jsonb)
      ),
      'rows',coalesce((select jsonb_agg(jsonb_build_object(
        'id',row.id,'batchId',row.batch_id,'workDate',row.work_date,
        'designer',jsonb_build_object('id',row.worked_by,'displayName',row.worked_name),
        'reportingLead',row.hierarchy->'lead','reportingManager',row.hierarchy->'manager',
        'workType',jsonb_build_object('code',row.work_type_code,'label',row.type_label),
        'area',row.area_name,'description',row.description,'loggedBy',row.logged_name,
        'loggedAt',row.logged_at,'lastEditedAt',row.last_edited_at
      ) order by row.work_date desc,row.logged_at desc,row.id desc) from paged row),'[]'::jsonb)
    ) into result;
  end if;
  return result;
end;
$$;

create function public.export_report_rows(report_type text, filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  period_start date;
  period_end date;
  scope_key text := nullif(filters->>'scopeKey','');
  requested_people uuid[];
  selected_people uuid[];
  area_ids uuid[];
  area_unassigned boolean := false;
  label_ids uuid[];
  status_codes text[];
  work_type_codes text[];
  visual_type_codes text[];
  relationship_filter text := coalesce(nullif(filters->>'relationship',''),'owned_or_contributed');
  blocked_filter text := coalesce(nullif(filters->>'blocked',''),'any');
  due_filter text := coalesce(nullif(filters->>'due',''),'any');
  archived_filter text := coalesce(nullif(filters->>'archived',''),'all');
  edited_filter text := coalesce(nullif(filters->>'edited',''),'any');
  stale_filter text := coalesce(nullif(filters->>'stale',''),'any');
  logged_by_filter uuid;
  dashboard jsonb;
  generated_at timestamptz := statement_timestamp();
  metadata jsonb;
  rows jsonb;
begin
  actor := private.require_application_user_read();
  if not private.can_export_reports() then
    raise exception using errcode='P0001',message='DF_FORBIDDEN';
  end if;
  if report_type not in ('ticket_summary','ticket_activity','designer_summary','designer_ticket','visual_work') then
    raise exception using errcode='P0001',message='DF_VALIDATION';
  end if;
  begin
    period_start:=coalesce((filters->>'periodStart')::date,date_trunc('month',private.current_team_date())::date);
    period_end:=coalesce((filters->>'periodEnd')::date,private.current_team_date());
    area_unassigned:=coalesce((filters->>'areaUnassigned')::boolean,false);
    if filters?'peopleIds' then select coalesce(array_agg(value::uuid),array[]::uuid[]) into requested_people from jsonb_array_elements_text(filters->'peopleIds') value; end if;
    if filters?'areaIds' then select coalesce(array_agg(value::uuid),array[]::uuid[]) into area_ids from jsonb_array_elements_text(filters->'areaIds') value; end if;
    if filters?'labelIds' then select coalesce(array_agg(value::uuid),array[]::uuid[]) into label_ids from jsonb_array_elements_text(filters->'labelIds') value; end if;
    if filters?'statuses' then select coalesce(array_agg(value),array[]::text[]) into status_codes from jsonb_array_elements_text(filters->'statuses') value; end if;
    if filters?'workTypes' then select coalesce(array_agg(value),array[]::text[]) into work_type_codes from jsonb_array_elements_text(filters->'workTypes') value; end if;
    if filters?'visualTypes' then select coalesce(array_agg(value),array[]::text[]) into visual_type_codes from jsonb_array_elements_text(filters->'visualTypes') value; end if;
    if nullif(filters->>'loggedBy','') is not null then logged_by_filter := (filters->>'loggedBy')::uuid; end if;
  exception when invalid_text_representation or datetime_field_overflow then
    raise exception using errcode='P0001',message='DF_VALIDATION';
  end;
  if period_start>period_end or period_end>private.current_team_date()
    or relationship_filter not in ('owned','contributed','owned_or_contributed')
    or blocked_filter not in ('any','blocked','not_blocked')
    or due_filter not in ('any','overdue','not_overdue','no_due_date')
    or archived_filter not in ('all','archived','not_archived')
    or edited_filter not in ('any','edited','not_edited')
    or stale_filter not in ('any','stale','not_stale')
  then raise exception using errcode='P0001',message='DF_VALIDATION'; end if;
  dashboard:=public.get_dashboard(scope_key,requested_people,null);
  select coalesce(array_agg((person->>'id')::uuid),array[]::uuid[]) into selected_people from jsonb_array_elements(dashboard->'selectedPeople') person;
  metadata:=jsonb_build_object(
    'reportPeriodStart',period_start,'reportPeriodEnd',period_end,
    'snapshotAt',case when report_type in ('ticket_summary','designer_summary','designer_ticket') then period_end else null end,
    'generatedAt',generated_at,'generatedBy',actor.display_name,
    'peopleScope',dashboard->>'selectedScopeKey','reportingGroupFilter',coalesce(scope_key,''),
    'areaFilter',coalesce(filters->'areaIds','[]'::jsonb)
  );

  if report_type='ticket_activity' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'workEntryId',entry.id,'workBatchId',entry.batch_id,'ticketId',item.display_id,'ticketTitle',item.title,
      'area',area.name::text,'workDate',entry.work_date,'workedBy',worked.display_name,
      'reportingLead',private.reporting_hierarchy_on(entry.worked_by,entry.work_date)->'lead'->>'displayName',
      'reportingManager',private.reporting_hierarchy_on(entry.worked_by,entry.work_date)->'manager'->>'displayName',
      'loggedBy',logged.display_name,'primaryAssignee',assignee.display_name,
      'relationship',case when entry.worked_by=assignee.id then 'primary' else 'contributor' end,
      'ticketStatus',private.work_item_status_on(item.id,entry.work_date),'workType',type.display_label,
      'description',entry.description,'loggedAt',entry.logged_at,'lastEditedAt',entry.last_edited_at
    ) order by entry.work_date desc,entry.logged_at desc,entry.id desc),'[]'::jsonb) into rows
    from public.valid_work_log_entries entry join public.work_items item on item.id=entry.work_item_id
    join public.work_areas area on area.id=item.area_id join public.profiles worked on worked.id=entry.worked_by
    join public.profiles logged on logged.id=entry.logged_by join public.work_type_definitions type on type.code=entry.work_type_code
    left join public.profiles assignee on assignee.id=private.work_item_assignee_on(item.id,entry.work_date)
    where entry.context_code='ticket' and entry.work_date between period_start and period_end and entry.worked_by=any(selected_people)
      and (area_ids is null or item.area_id=any(area_ids))
      and (label_ids is null or exists(select 1 from public.work_item_labels relation where relation.work_item_id=item.id and relation.label_id=any(label_ids) and relation.removed_at is null))
      and (work_type_codes is null or entry.work_type_code=any(work_type_codes));
  elsif report_type='visual_work' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'visualWorkEntryId',entry.id,'workBatchId',entry.batch_id,'designer',worked.display_name,
      'reportingLead',private.reporting_hierarchy_on(entry.worked_by,entry.work_date)->'lead'->>'displayName',
      'reportingManager',private.reporting_hierarchy_on(entry.worked_by,entry.work_date)->'manager'->>'displayName',
      'workDate',entry.work_date,'visualWorkType',type.display_label,'area',coalesce(area.name::text,''),
      'description',entry.description,'loggedBy',logged.display_name,'loggedAt',entry.logged_at,'lastEditedAt',entry.last_edited_at
    ) order by entry.work_date desc,entry.logged_at desc,entry.id desc),'[]'::jsonb) into rows
    from public.valid_work_log_entries entry join public.profiles worked on worked.id=entry.worked_by
    join public.profiles logged on logged.id=entry.logged_by join public.work_type_definitions type on type.code=entry.work_type_code
    left join public.work_areas area on area.id=entry.related_area_id
    where entry.context_code='standalone_visual' and entry.work_date between period_start and period_end and entry.worked_by=any(selected_people)
      and ((area_unassigned and entry.related_area_id is null) or (not area_unassigned and (area_ids is null or entry.related_area_id=any(area_ids))))
      and (visual_type_codes is null or entry.work_type_code=any(visual_type_codes))
      and (logged_by_filter is null or entry.logged_by=logged_by_filter)
      and (edited_filter='any' or (edited_filter='edited')=(entry.last_edited_at is not null));
  elsif report_type='ticket_summary' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'ticketId',item.display_id,'title',item.title,'area',area.name::text,
      'labels',coalesce((select string_agg(label.name::text,' | ' order by label.name) from public.work_item_labels relation join public.labels label on label.id=relation.label_id where relation.work_item_id=item.id and relation.removed_at is null),''),
      'statusAtPeriodEnd',private.work_item_status_on(item.id,period_end),'primaryAssigneeAtPeriodEnd',assignee.display_name,
      'contributorsDuringPeriod',coalesce((select string_agg(distinct profile.display_name,' | ' order by profile.display_name) from public.valid_work_log_entries entry join public.profiles profile on profile.id=entry.worked_by where entry.work_item_id=item.id and entry.work_date between period_start and period_end and entry.worked_by is distinct from private.work_item_assignee_on(item.id,entry.work_date)),''),
      'plannedStartDate',item.planned_start_date,'dueDate',item.due_date,
      'dueState',case when item.due_date is null then 'no_due_date' when item.due_date<period_end and private.work_item_status_on(item.id,period_end) in('todo','in_progress','in_review') then 'overdue' else 'not_overdue' end,
      'firstWorkDate',(select min(entry.work_date) from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date between period_start and period_end),
      'lastWorkDate',(select max(entry.work_date) from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date between period_start and period_end),
      'activeWorkDays',(select count(distinct entry.work_date) from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date between period_start and period_end),
      'workEntries',(select count(*) from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date between period_start and period_end),
      'completedTransitions',(select count(*) from public.work_item_status_history history where history.work_item_id=item.id and history.to_status_code='done' and history.changed_on between period_start and period_end),
      'reopenTransitions',(select count(*) from public.work_item_status_history history where history.work_item_id=item.id and history.from_status_code='done' and history.changed_on between period_start and period_end),
      'blockedAtPeriodEnd',exists(select 1 from public.blockers blocker where blocker.work_item_id=item.id and blocker.blocked_at::date<=period_end and (blocker.resolved_at is null or blocker.resolved_at::date>period_end)),
      'blockedCalendarDays',(select coalesce(sum(greatest(0,least(period_end,coalesce(blocker.resolved_at::date,period_end))-greatest(period_start,blocker.blocked_at::date)+1)),0) from public.blockers blocker where blocker.work_item_id=item.id),
      'completedSubtasks',(select count(*) from public.subtasks subtask where subtask.work_item_id=item.id and subtask.withdrawn_at is null and subtask.is_completed),
      'totalSubtasks',(select count(*) from public.subtasks subtask where subtask.work_item_id=item.id and subtask.withdrawn_at is null),
      'archivedAtPeriodEnd',private.work_item_archived_on(item.id,period_end)
    ) order by item.due_date asc nulls last,item.display_id),'[]'::jsonb) into rows
    from public.work_items item join public.work_areas area on area.id=item.area_id
    left join public.profiles assignee on assignee.id=private.work_item_assignee_on(item.id,period_end)
    where (exists(select 1 from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date between period_start and period_end and entry.worked_by=any(selected_people)
      and (work_type_codes is null or entry.work_type_code=any(work_type_codes)))
      or private.work_item_assignee_on(item.id,period_end)=any(selected_people))
      and (area_ids is null or item.area_id=any(area_ids))
      and (status_codes is null or private.work_item_status_on(item.id,period_end)=any(status_codes))
      and (archived_filter='all' or (archived_filter='archived')=private.work_item_archived_on(item.id,period_end))
      and (blocked_filter='any' or (blocked_filter='blocked')=exists(select 1 from public.blockers blocker where blocker.work_item_id=item.id and blocker.blocked_at::date<=period_end and (blocker.resolved_at is null or blocker.resolved_at::date>period_end)))
      and (due_filter='any' or (due_filter='no_due_date' and item.due_date is null) or (due_filter='overdue' and item.due_date<period_end and private.work_item_status_on(item.id,period_end) in('todo','in_progress','in_review')) or (due_filter='not_overdue' and not(item.due_date<period_end and private.work_item_status_on(item.id,period_end) in('todo','in_progress','in_review'))))
      and (stale_filter='any' or (stale_filter='stale')=(private.work_item_status_on(item.id,period_end) in('todo','in_progress','in_review') and (select max(entry.work_date) from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date<=period_end) is not null and period_end>=private.add_working_days((select max(entry.work_date) from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date<=period_end),5)))
      and (relationship_filter='owned_or_contributed' or (relationship_filter='owned' and private.work_item_assignee_on(item.id,period_end)=any(selected_people)) or (relationship_filter='contributed' and exists(select 1 from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date between period_start and period_end and entry.worked_by=any(selected_people) and entry.worked_by is distinct from private.work_item_assignee_on(item.id,entry.work_date))));
  elsif report_type='designer_summary' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'designer',profile.display_name,'workEmail',profile.email::text,'position',profile.position_code,'adminPrivilege',profile.is_admin,
      'reportingLeadAtPeriodEnd',private.reporting_hierarchy_on(profile.id,period_end)->'lead'->>'displayName',
      'reportingManagerAtPeriodEnd',private.reporting_hierarchy_on(profile.id,period_end)->'manager'->>'displayName',
      'reportingLeadsDuringPeriod',coalesce((select string_agg(distinct private.reporting_hierarchy_on(profile.id,day::date)->'lead'->>'displayName',' | ') from generate_series(period_start,period_end,'1 day') day where private.reporting_hierarchy_on(profile.id,day::date)->'lead' is not null),''),
      'reportingManagersDuringPeriod',coalesce((select string_agg(distinct private.reporting_hierarchy_on(profile.id,day::date)->'manager'->>'displayName',' | ') from generate_series(period_start,period_end,'1 day') day where private.reporting_hierarchy_on(profile.id,day::date)->'manager' is not null),''),
      'activeOwnedTickets',(select count(*) from public.work_items item where private.work_item_assignee_on(item.id,period_end)=profile.id and private.work_item_status_on(item.id,period_end) in('todo','in_progress','in_review')),
      'ticketsWorkedOn',(select count(distinct entry.work_item_id) from public.valid_work_log_entries entry where entry.worked_by=profile.id and entry.work_item_id is not null and entry.work_date between period_start and period_end),
      'ticketActiveDays',(select count(distinct entry.work_date) from public.valid_work_log_entries entry where entry.worked_by=profile.id and entry.work_item_id is not null and entry.work_date between period_start and period_end),
      'ticketDays',(select count(distinct(entry.work_item_id,entry.work_date)) from public.valid_work_log_entries entry where entry.worked_by=profile.id and entry.work_item_id is not null and entry.work_date between period_start and period_end),
      'completedAsPrimary',(select count(*) from public.work_item_status_history history where history.to_status_code='done' and history.changed_on between period_start and period_end and private.work_item_assignee_on(history.work_item_id,history.changed_on)=profile.id),
      'contributedTickets',(select count(distinct entry.work_item_id) from public.valid_work_log_entries entry where entry.worked_by=profile.id and entry.work_item_id is not null and entry.work_date between period_start and period_end and private.work_item_assignee_on(entry.work_item_id,entry.work_date) is distinct from profile.id),
      'primaryTicketDays',(select count(distinct(entry.work_item_id,entry.work_date)) from public.valid_work_log_entries entry where entry.worked_by=profile.id and entry.work_item_id is not null and entry.work_date between period_start and period_end and private.work_item_assignee_on(entry.work_item_id,entry.work_date)=profile.id),
      'contributorTicketDays',(select count(distinct(entry.work_item_id,entry.work_date)) from public.valid_work_log_entries entry where entry.worked_by=profile.id and entry.work_item_id is not null and entry.work_date between period_start and period_end and private.work_item_assignee_on(entry.work_item_id,entry.work_date) is distinct from profile.id),
      'blockedOwnedTickets',(select count(*) from public.work_items item where private.work_item_assignee_on(item.id,period_end)=profile.id and exists(select 1 from public.blockers blocker where blocker.work_item_id=item.id and blocker.resolved_at is null)),
      'overdueOwnedTickets',(select count(*) from public.work_items item where private.work_item_assignee_on(item.id,period_end)=profile.id and item.due_date<period_end and private.work_item_status_on(item.id,period_end) in('todo','in_progress','in_review')),
      'ownedTicketsWithoutWork',(select count(*) from public.work_items item where private.work_item_assignee_on(item.id,period_end)=profile.id and not exists(select 1 from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.worked_by=profile.id and entry.work_date between period_start and period_end)),
      'lastRecordedWorkDate',(select max(entry.work_date) from public.valid_work_log_entries entry where entry.worked_by=profile.id and entry.work_date<=period_end),
      'plannedUntil',(select max(item.due_date) from public.work_items item where private.work_item_assignee_on(item.id,period_end)=profile.id and private.work_item_status_on(item.id,period_end) in('todo','in_progress','in_review')),
      'activeOwnedTicketsWithoutDueDates',(select count(*) from public.work_items item where private.work_item_assignee_on(item.id,period_end)=profile.id and private.work_item_status_on(item.id,period_end) in('todo','in_progress','in_review') and item.due_date is null),
      'visualActivityDays',(select count(distinct entry.work_date) from public.valid_work_log_entries entry where entry.worked_by=profile.id and entry.context_code='standalone_visual' and entry.work_date between period_start and period_end),
      'overallActiveCalendarDays',(select count(distinct entry.work_date) from public.valid_work_log_entries entry where entry.worked_by=profile.id and entry.work_date between period_start and period_end)
    ) order by profile.display_name),'[]'::jsonb) into rows from public.profiles profile where profile.id=any(selected_people);
  else
    select coalesce(jsonb_agg(to_jsonb(grouped) order by grouped.designer,grouped."ticketId"),'[]'::jsonb)
    into rows
    from (
      select
        profile.display_name as designer,
        private.reporting_hierarchy_on(entry.worked_by,entry.work_date)->'lead'->>'displayName' as "reportingLeadDuringActivity",
        private.reporting_hierarchy_on(entry.worked_by,entry.work_date)->'manager'->>'displayName' as "reportingManagerDuringActivity",
        item.display_id as "ticketId",item.title as "ticketTitle",area.name::text as area,
        case when entry.worked_by=private.work_item_assignee_on(item.id,entry.work_date) then 'primary' else 'contributor' end as relationship,
        min(entry.work_date) as "firstActivityDate",max(entry.work_date) as "lastActivityDate",count(distinct entry.work_date) as "ticketDays",
        string_agg(distinct type.display_label,' | ' order by type.display_label) as "workTypes",
        (select count(*) from public.work_item_status_history history where history.work_item_id=item.id and history.to_status_code='done' and history.changed_on between period_start and period_end and private.work_item_assignee_on(item.id,history.changed_on)=entry.worked_by) as "completedAsPrimaryTransitions",
        private.work_item_status_on(item.id,period_end) as "statusAtPeriodEnd",assignee.display_name as "primaryAssigneeAtPeriodEnd",
        item.due_date as "dueDate",(select max(source.work_date) from public.valid_work_log_entries source where source.work_item_id=item.id and source.work_date<=period_end) as "lastWorkedOnAtPeriodEnd"
      from public.valid_work_log_entries entry join public.profiles profile on profile.id=entry.worked_by
      join public.work_items item on item.id=entry.work_item_id join public.work_areas area on area.id=item.area_id
      join public.work_type_definitions type on type.code=entry.work_type_code
      left join public.profiles assignee on assignee.id=private.work_item_assignee_on(item.id,period_end)
      where entry.context_code='ticket' and entry.work_date between period_start and period_end and entry.worked_by=any(selected_people)
        and (area_ids is null or item.area_id=any(area_ids))
        and (work_type_codes is null or entry.work_type_code=any(work_type_codes))
      group by profile.display_name,entry.worked_by,item.id,item.display_id,item.title,area.name,
        case when entry.worked_by=private.work_item_assignee_on(item.id,entry.work_date) then 'primary' else 'contributor' end,
        private.reporting_hierarchy_on(entry.worked_by,entry.work_date),assignee.display_name
    ) grouped;
  end if;
  return jsonb_build_object('reportType',report_type,'metadata',metadata,'rows',rows);
end;
$$;

create function public.get_work_item_export(display_id text, include_comments boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  detail jsonb;
  history jsonb;
begin
  actor:=private.require_application_user_read();
  if not private.can_export_work_item() then raise exception using errcode='P0001',message='DF_FORBIDDEN'; end if;
  detail:=public.get_work_item_detail(display_id);
  if detail is null then raise exception using errcode='P0001',message='DF_VALIDATION'; end if;
  history:=public.get_work_item_history((detail->>'id')::uuid);
  return jsonb_build_object(
    'generatedAt',statement_timestamp(),'generatedBy',actor.display_name,'includeComments',include_comments,
    'workItem',(detail-'events'-'comments'-'capabilities'),
    'history',history,
    'comments',case when include_comments then coalesce(detail->'comments','[]'::jsonb) else '[]'::jsonb end
  );
end;
$$;

revoke all on function public.get_export_capabilities() from public;
revoke all on function public.get_reports(jsonb) from public;
revoke all on function public.export_report_rows(text,jsonb) from public;
revoke all on function public.get_work_item_export(text,boolean) from public;
grant execute on function public.get_export_capabilities() to authenticated;
grant execute on function public.get_reports(jsonb) to authenticated;
grant execute on function public.export_report_rows(text,jsonb) to authenticated;
grant execute on function public.get_work_item_export(text,boolean) to authenticated;

comment on function public.get_reports(jsonb) is
  'Returns one URL-filtered Phase 6 report view with source-reconciled cards, charts, and paginated detail rows.';
comment on function public.export_report_rows(text,jsonb) is
  'Returns all authorized matching rows for one of the five fixed Phase 6 CSV schemas.';
comment on function public.get_work_item_export(text,boolean) is
  'Returns the authorized sanitized Work Item PDF projection, with comments opt-in.';

commit;
