-- Design Flow Phase 2 Slice 2: Team hierarchy and Settings.
--
-- This migration owns only the Team directory, member-access administration,
-- controlled Areas/Squads and Labels, team timezone, and administration audit.

begin;

create function private.write_admin_audit(
  event_code text,
  actor_id uuid,
  subject_type text,
  subject_id uuid,
  previous_values jsonb,
  new_values jsonb,
  operation_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_audit_events (
    event_type_code,
    actor_id,
    subject_type,
    subject_id,
    previous_values,
    new_values,
    operation_id
  ) values (
    event_code,
    actor_id,
    subject_type,
    subject_id,
    previous_values,
    new_values,
    operation_id
  );
$$;

create function private.controlled_list_usage(
  list_code text,
  value_id uuid
)
returns table (
  current_usage_count integer,
  historical_usage_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if list_code = 'work_area' then
    return query
    select
      count(*) filter (where item.archived_at is null)::integer,
      count(*)::integer
    from public.work_items item
    where item.area_id = value_id;
  elsif list_code = 'label' then
    return query
    select
      count(distinct relation.work_item_id) filter (
        where relation.removed_at is null and item.archived_at is null
      )::integer,
      count(distinct relation.work_item_id)::integer
    from public.work_item_labels relation
    join public.work_items item on item.id = relation.work_item_id
    where relation.label_id = value_id;
  else
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;
end;
$$;

with ordered as (
  select id, row_number() over (order by sort_order, name, id) - 1 as next_order
  from public.work_areas
  where is_active
)
update public.work_areas area
set sort_order = ordered.next_order
from ordered
where area.id = ordered.id;

with ordered as (
  select id, row_number() over (order by sort_order, name, id) - 1 as next_order
  from public.labels
  where is_active
)
update public.labels label
set sort_order = ordered.next_order
from ordered
where label.id = ordered.id;

drop view public.team_directory;

create view public.team_directory
with (security_invoker = true)
as
select
  profile.id,
  profile.display_name,
  profile.position_code,
  position.display_label as position_label,
  profile.is_admin,
  profile.current_reports_to_id,
  supervisor.display_name as reports_to_display_name
from public.profiles profile
join public.position_definitions position
  on position.code = profile.position_code
left join public.profiles supervisor
  on supervisor.id = profile.current_reports_to_id
where profile.is_active
  and private.is_application_user();

create view public.admin_member_directory
with (security_barrier = true)
as
select
  profile.id,
  profile.display_name,
  profile.email::text as email,
  profile.position_code,
  position.display_label as position_label,
  profile.is_admin,
  profile.is_active,
  profile.must_change_password,
  profile.current_reports_to_id,
  supervisor.display_name as reports_to_display_name,
  auth_user.last_sign_in_at,
  profile.created_at,
  profile.updated_at,
  (
    select max(event.occurred_at)
    from public.admin_audit_events event
    where event.subject_type = 'profile'
      and event.subject_id = profile.id
      and event.event_type_code in (
        'position_changed',
        'admin_privilege_granted',
        'admin_privilege_removed',
        'reporting_line_changed',
        'account_deactivated',
        'account_reactivated',
        'password_reset_issued'
      )
  ) as access_administered_at
from public.profiles profile
join public.position_definitions position
  on position.code = profile.position_code
join auth.users auth_user on auth_user.id = profile.id
left join public.profiles supervisor
  on supervisor.id = profile.current_reports_to_id
where private.can_manage_settings();

create view public.work_area_settings
with (security_barrier = true)
as
select
  area.id,
  area.name::text as name,
  area.sort_order,
  area.is_active,
  area.created_at,
  area.archived_at,
  area.updated_at,
  (
    select count(*)::integer
    from public.work_items item
    where item.area_id = area.id and item.archived_at is null
  ) as current_usage_count,
  (
    select count(*)::integer
    from public.work_items item
    where item.area_id = area.id
  ) as historical_usage_count
from public.work_areas area
where private.can_manage_settings();

create view public.label_settings
with (security_barrier = true)
as
select
  label.id,
  label.name::text as name,
  label.sort_order,
  label.is_active,
  label.created_at,
  label.archived_at,
  label.updated_at,
  (
    select count(distinct relation.work_item_id)::integer
    from public.work_item_labels relation
    join public.work_items item on item.id = relation.work_item_id
    where relation.label_id = label.id
      and relation.removed_at is null
      and item.archived_at is null
  ) as current_usage_count,
  (
    select count(distinct relation.work_item_id)::integer
    from public.work_item_labels relation
    where relation.label_id = label.id
  ) as historical_usage_count
from public.labels label
where private.can_manage_settings();

create view public.administration_audit_log
with (security_barrier = true)
as
select
  event.id,
  event.event_type_code,
  event.actor_id,
  actor.display_name as actor_display_name,
  event.subject_type,
  event.subject_id,
  subject.display_name as subject_display_name,
  event.previous_values,
  event.new_values,
  event.operation_id,
  event.occurred_at
from public.admin_audit_events event
left join public.profiles actor on actor.id = event.actor_id
left join public.profiles subject
  on event.subject_type = 'profile' and subject.id = event.subject_id
where private.can_manage_settings();

create function public.set_member_access(
  target_profile_id uuid,
  desired_position_code text,
  desired_is_admin boolean,
  desired_supervisor_id uuid,
  expected_updated_at timestamptz,
  assignment_replacements jsonb default '[]'::jsonb,
  operation_id uuid default gen_random_uuid()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  target public.profiles;
  operation public.operation_requests;
  now_at timestamptz := statement_timestamp();
  current_date date := private.current_team_date();
  access_changed boolean;
  reporting_changed boolean;
  loses_assignment_eligibility boolean;
  item record;
  replacement record;
  new_assignee public.profiles;
  event_id uuid;
  result jsonb;
begin
  if jsonb_typeof(assignment_replacements) <> 'array' then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  operation := private.lock_or_create_operation(
    operation_id,
    'set_member_access',
    auth.uid(),
    jsonb_build_object(
      'target_profile_id', target_profile_id,
      'desired_position_code', desired_position_code,
      'desired_is_admin', desired_is_admin,
      'desired_supervisor_id', desired_supervisor_id,
      'expected_updated_at', expected_updated_at,
      'assignment_replacements', assignment_replacements
    ),
    'started'
  );

  if operation.state = 'completed' then
    return operation.result;
  end if;

  actor := private.require_admin(auth.uid());

  perform profile.id
  from public.profiles profile
  where profile.id in (actor.id, target_profile_id)
  order by profile.id
  for update;

  select * into target
  from public.profiles profile
  where profile.id = target_profile_id;

  if target.id is null or not target.is_active then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  if target.updated_at is distinct from expected_updated_at then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end if;

  perform private.assert_requested_access(
    desired_position_code,
    desired_is_admin,
    desired_supervisor_id,
    target.id
  );

  if desired_supervisor_id is not null and exists (
    with recursive supervisors as (
      select profile.id, profile.current_reports_to_id
      from public.profiles profile
      where profile.id = desired_supervisor_id
      union all
      select profile.id, profile.current_reports_to_id
      from public.profiles profile
      join supervisors current_supervisor
        on profile.id = current_supervisor.current_reports_to_id
    )
    select 1 from supervisors where id = target.id
  ) then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  perform profile.id
  from public.profiles profile
  where profile.is_active and profile.is_admin
  order by profile.id
  for update;

  if target.is_admin and not desired_is_admin and (
    select count(*)
    from public.profiles profile
    where profile.is_active and profile.is_admin
  ) <= 1 then
    raise exception using errcode = 'P0001', message = 'DF_FINAL_ADMIN';
  end if;

  access_changed :=
    target.position_code <> desired_position_code
    or target.is_admin is distinct from desired_is_admin;
  reporting_changed :=
    target.current_reports_to_id is distinct from desired_supervisor_id;
  loses_assignment_eligibility :=
    target.position_code in ('designer', 'lead', 'manager')
    and desired_position_code = 'viewer';

  if not access_changed and not reporting_changed then
    result := jsonb_build_object(
      'target_profile_id', target.id,
      'updated_at', target.updated_at,
      'status', 'unchanged'
    );
    return private.complete_operation(operation_id, result);
  end if;

  if loses_assignment_eligibility then
    if exists (
      select 1
      from jsonb_array_elements(assignment_replacements) left_item
      join jsonb_array_elements(assignment_replacements) right_item
        on left_item <> right_item
        and left_item ->> 'work_item_id' = right_item ->> 'work_item_id'
    ) then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;

    if jsonb_array_length(assignment_replacements) <> (
      select count(*)
      from public.work_items work_item
      where work_item.primary_assignee_id = target.id
        and work_item.archived_at is null
    ) or exists (
      select 1
      from jsonb_array_elements(assignment_replacements) entry
      where not exists (
        select 1
        from public.work_items work_item
        where work_item.id = (entry ->> 'work_item_id')::uuid
          and work_item.primary_assignee_id = target.id
          and work_item.archived_at is null
      )
    ) then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;

    for item in
      select
        work_item.id,
        work_item.status_code,
        assignment.id as assignment_id
      from public.work_items work_item
      join public.work_item_assignments assignment
        on assignment.work_item_id = work_item.id
        and assignment.ended_at is null
      where work_item.primary_assignee_id = target.id
        and work_item.archived_at is null
      order by work_item.id
      for update of work_item, assignment
    loop
      select nullif(entry ->> 'new_assignee_id', '')::uuid as new_assignee_id
      into replacement
      from jsonb_array_elements(assignment_replacements) entry
      where (entry ->> 'work_item_id')::uuid = item.id;

      if replacement.new_assignee_id is not null then
        select * into new_assignee
        from public.profiles profile
        where profile.id = replacement.new_assignee_id
        for share;

        if new_assignee.id is null
          or not new_assignee.is_active
          or new_assignee.must_change_password
          or new_assignee.position_code not in ('designer', 'lead', 'manager')
          or new_assignee.id = target.id
        then
          raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
        end if;
      elsif item.status_code in ('todo', 'in_progress', 'in_review') then
        raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
      end if;

      update public.work_item_assignments
      set
        ended_at = now_at,
        ended_on = current_date,
        end_operation_id = operation_id
      where id = item.assignment_id;

      if replacement.new_assignee_id is not null then
        insert into public.work_item_assignments (
          work_item_id,
          assignee_id,
          started_at,
          started_on,
          assigned_by,
          start_operation_id
        ) values (
          item.id,
          replacement.new_assignee_id,
          now_at,
          current_date,
          actor.id,
          operation_id
        );
      end if;

      update public.work_items
      set
        primary_assignee_id = replacement.new_assignee_id,
        updated_at = now_at,
        last_activity_at = now_at
      where id = item.id;

      insert into public.work_item_events (
        work_item_id,
        event_type_code,
        actor_id,
        subject_type,
        subject_id,
        previous_values,
        new_values,
        operation_id,
        occurred_at
      ) values (
        item.id,
        'assignment_changed',
        actor.id,
        'profile',
        replacement.new_assignee_id,
        jsonb_build_object('assignee_id', target.id),
        jsonb_build_object('assignee_id', replacement.new_assignee_id),
        operation_id,
        now_at
      )
      returning id into event_id;

      if target.id <> actor.id then
        insert into public.notifications (
          recipient_id,
          actor_id,
          work_item_id,
          source_event_id,
          notification_type_code
        ) values (
          target.id,
          actor.id,
          item.id,
          event_id,
          'reassigned_away_from_you'
        );
      end if;

      if replacement.new_assignee_id is not null
        and replacement.new_assignee_id <> actor.id
      then
        insert into public.notifications (
          recipient_id,
          actor_id,
          work_item_id,
          source_event_id,
          notification_type_code
        ) values (
          replacement.new_assignee_id,
          actor.id,
          item.id,
          event_id,
          'assigned_to_you'
        );
      end if;
    end loop;
  elsif jsonb_array_length(assignment_replacements) <> 0 then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if reporting_changed then
    update public.reporting_line_assignments
    set
      ended_on = current_date,
      end_operation_id = operation_id
    where person_id = target.id and ended_on is null;

    if desired_supervisor_id is not null then
      insert into public.reporting_line_assignments (
        person_id,
        supervisor_id,
        started_on,
        assigned_by,
        start_operation_id
      ) values (
        target.id,
        desired_supervisor_id,
        current_date,
        actor.id,
        operation_id
      );
    end if;
  end if;

  if access_changed then
    update public.profile_access_periods
    set
      ended_at = now_at,
      end_operation_id = operation_id
    where profile_id = target.id and ended_at is null;

    insert into public.profile_access_periods (
      profile_id,
      position_code,
      is_admin,
      is_active,
      started_at,
      changed_by,
      start_operation_id
    ) values (
      target.id,
      desired_position_code,
      desired_is_admin,
      true,
      now_at,
      actor.id,
      operation_id
    );
  end if;

  update public.profiles
  set
    position_code = desired_position_code,
    is_admin = desired_is_admin,
    current_reports_to_id = desired_supervisor_id,
    updated_at = now_at
  where id = target.id;

  if target.position_code <> desired_position_code then
    perform private.write_admin_audit(
      'position_changed',
      actor.id,
      'profile',
      target.id,
      jsonb_build_object('position_code', target.position_code),
      jsonb_build_object('position_code', desired_position_code),
      operation_id
    );
  end if;

  if target.is_admin is distinct from desired_is_admin then
    perform private.write_admin_audit(
      case
        when desired_is_admin then 'admin_privilege_granted'
        else 'admin_privilege_removed'
      end,
      actor.id,
      'profile',
      target.id,
      jsonb_build_object('is_admin', target.is_admin),
      jsonb_build_object('is_admin', desired_is_admin),
      operation_id
    );
  end if;

  if reporting_changed then
    perform private.write_admin_audit(
      'reporting_line_changed',
      actor.id,
      'profile',
      target.id,
      jsonb_build_object('supervisor_id', target.current_reports_to_id),
      jsonb_build_object('supervisor_id', desired_supervisor_id),
      operation_id
    );
  end if;

  result := jsonb_build_object(
    'target_profile_id', target.id,
    'position_code', desired_position_code,
    'is_admin', desired_is_admin,
    'supervisor_id', desired_supervisor_id,
    'updated_at', now_at,
    'status', 'updated'
  );

  return private.complete_operation(operation_id, result);
end;
$$;

create function private.create_controlled_value(
  list_code text,
  value_id uuid,
  value_name text,
  requested_sort_order integer,
  operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  operation public.operation_requests;
  active_count integer;
  target_order integer;
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id,
    'create_' || list_code,
    auth.uid(),
    jsonb_build_object(
      'value_id', value_id,
      'value_name', btrim(value_name),
      'requested_sort_order', requested_sort_order
    ),
    'started'
  );

  if operation.state = 'completed' then
    return operation.result;
  end if;

  actor := private.require_admin(auth.uid());

  if value_id is null or btrim(value_name) = '' then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if list_code = 'work_area' then
    select count(*) into active_count
    from public.work_areas where is_active;
  elsif list_code = 'label' then
    select count(*) into active_count
    from public.labels where is_active;
  else
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  target_order := coalesce(requested_sort_order, active_count);
  if target_order < 0 or target_order > active_count then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  begin
    if list_code = 'work_area' then
      update public.work_areas
      set sort_order = sort_order + 1
      where is_active and sort_order >= target_order;

      insert into public.work_areas (
        id, name, sort_order, created_by, updated_by
      ) values (
        value_id, btrim(value_name), target_order, actor.id, actor.id
      );
    else
      update public.labels
      set sort_order = sort_order + 1
      where is_active and sort_order >= target_order;

      insert into public.labels (
        id, name, sort_order, created_by, updated_by
      ) values (
        value_id, btrim(value_name), target_order, actor.id, actor.id
      );
    end if;
  exception when unique_violation then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end;

  perform private.write_admin_audit(
    case when list_code = 'work_area'
      then 'work_area_created' else 'label_created' end,
    actor.id,
    list_code,
    value_id,
    null,
    jsonb_build_object('name', btrim(value_name), 'sort_order', target_order),
    operation_id
  );

  result := jsonb_build_object(
    'id', value_id,
    'name', btrim(value_name),
    'sort_order', target_order,
    'status', 'created'
  );
  return private.complete_operation(operation_id, result);
end;
$$;

create function private.rename_controlled_value(
  list_code text,
  value_id uuid,
  value_name text,
  expected_updated_at timestamptz,
  operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  operation public.operation_requests;
  previous_name text;
  current_updated_at timestamptz;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id,
    'rename_' || list_code,
    auth.uid(),
    jsonb_build_object(
      'value_id', value_id,
      'value_name', btrim(value_name),
      'expected_updated_at', expected_updated_at
    ),
    'started'
  );
  if operation.state = 'completed' then
    return operation.result;
  end if;

  actor := private.require_admin(auth.uid());
  if btrim(value_name) = '' then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if list_code = 'work_area' then
    select name::text, updated_at into previous_name, current_updated_at
    from public.work_areas where id = value_id for update;
  elsif list_code = 'label' then
    select name::text, updated_at into previous_name, current_updated_at
    from public.labels where id = value_id for update;
  else
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if previous_name is null then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;
  if current_updated_at is distinct from expected_updated_at then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end if;

  if lower(previous_name) = lower(btrim(value_name)) then
    result := jsonb_build_object(
      'id', value_id,
      'name', previous_name,
      'updated_at', current_updated_at,
      'status', 'unchanged'
    );
    return private.complete_operation(operation_id, result);
  end if;

  begin
    if list_code = 'work_area' then
      update public.work_areas
      set name = btrim(value_name), updated_by = actor.id, updated_at = now_at
      where id = value_id;
    else
      update public.labels
      set name = btrim(value_name), updated_by = actor.id, updated_at = now_at
      where id = value_id;
    end if;
  exception when unique_violation then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end;

  perform private.write_admin_audit(
    case when list_code = 'work_area'
      then 'work_area_renamed' else 'label_renamed' end,
    actor.id,
    list_code,
    value_id,
    jsonb_build_object('name', previous_name),
    jsonb_build_object('name', btrim(value_name)),
    operation_id
  );

  result := jsonb_build_object(
    'id', value_id,
    'name', btrim(value_name),
    'updated_at', now_at,
    'status', 'renamed'
  );
  return private.complete_operation(operation_id, result);
end;
$$;

create function private.reorder_controlled_values(
  list_code text,
  ordered_ids uuid[],
  operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  operation public.operation_requests;
  active_count integer;
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id,
    'reorder_' || list_code || 's',
    auth.uid(),
    jsonb_build_object('ordered_ids', to_jsonb(ordered_ids)),
    'started'
  );
  if operation.state = 'completed' then
    return operation.result;
  end if;

  actor := private.require_admin(auth.uid());

  if ordered_ids is null
    or cardinality(ordered_ids) <> (
      select count(distinct value_id) from unnest(ordered_ids) value_id
    )
  then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if list_code = 'work_area' then
    select count(*) into active_count from public.work_areas where is_active;
    if cardinality(ordered_ids) <> active_count or exists (
      select 1 from unnest(ordered_ids) value_id
      where not exists (
        select 1 from public.work_areas
        where id = value_id and is_active
      )
    ) then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;

    update public.work_areas area
    set
      sort_order = ordering.ordinality - 1,
      updated_by = actor.id,
      updated_at = statement_timestamp()
    from unnest(ordered_ids) with ordinality ordering(id, ordinality)
    where area.id = ordering.id;
  elsif list_code = 'label' then
    select count(*) into active_count from public.labels where is_active;
    if cardinality(ordered_ids) <> active_count or exists (
      select 1 from unnest(ordered_ids) value_id
      where not exists (
        select 1 from public.labels
        where id = value_id and is_active
      )
    ) then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;

    update public.labels label
    set
      sort_order = ordering.ordinality - 1,
      updated_by = actor.id,
      updated_at = statement_timestamp()
    from unnest(ordered_ids) with ordinality ordering(id, ordinality)
    where label.id = ordering.id;
  else
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  perform private.write_admin_audit(
    case when list_code = 'work_area'
      then 'work_area_reordered' else 'label_reordered' end,
    actor.id,
    list_code || '_list',
    operation_id,
    null,
    jsonb_build_object('ordered_ids', to_jsonb(ordered_ids)),
    operation_id
  );

  result := jsonb_build_object(
    'ordered_ids', to_jsonb(ordered_ids),
    'status', 'reordered'
  );
  return private.complete_operation(operation_id, result);
end;
$$;

create function private.archive_controlled_value(
  list_code text,
  value_id uuid,
  confirmed_usage_count integer,
  expected_updated_at timestamptz,
  operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  operation public.operation_requests;
  value_name text;
  value_order integer;
  value_is_active boolean;
  current_updated_at timestamptz;
  current_count integer;
  historical_count integer;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id,
    'archive_' || list_code,
    auth.uid(),
    jsonb_build_object(
      'value_id', value_id,
      'confirmed_usage_count', confirmed_usage_count,
      'expected_updated_at', expected_updated_at
    ),
    'started'
  );
  if operation.state = 'completed' then
    return operation.result;
  end if;

  actor := private.require_admin(auth.uid());

  if list_code = 'work_area' then
    select name::text, sort_order, is_active, updated_at
    into value_name, value_order, value_is_active, current_updated_at
    from public.work_areas where id = value_id for update;
  elsif list_code = 'label' then
    select name::text, sort_order, is_active, updated_at
    into value_name, value_order, value_is_active, current_updated_at
    from public.labels where id = value_id for update;
  else
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if value_name is null or not value_is_active then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;
  if current_updated_at is distinct from expected_updated_at then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end if;

  select usage.current_usage_count, usage.historical_usage_count
  into current_count, historical_count
  from private.controlled_list_usage(list_code, value_id) usage;

  if confirmed_usage_count is null
    or confirmed_usage_count <> historical_count
  then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end if;

  if list_code = 'work_area' then
    update public.work_areas
    set
      is_active = false,
      archived_by = actor.id,
      archived_at = now_at,
      updated_by = actor.id,
      updated_at = now_at
    where id = value_id;
    update public.work_areas
    set sort_order = sort_order - 1
    where is_active and sort_order > value_order;
  else
    update public.labels
    set
      is_active = false,
      archived_by = actor.id,
      archived_at = now_at,
      updated_by = actor.id,
      updated_at = now_at
    where id = value_id;
    update public.labels
    set sort_order = sort_order - 1
    where is_active and sort_order > value_order;
  end if;

  perform private.write_admin_audit(
    case when list_code = 'work_area'
      then 'work_area_archived' else 'label_archived' end,
    actor.id,
    list_code,
    value_id,
    jsonb_build_object('is_active', true, 'name', value_name),
    jsonb_build_object(
      'is_active', false,
      'current_usage_count', current_count,
      'historical_usage_count', historical_count
    ),
    operation_id
  );

  result := jsonb_build_object(
    'id', value_id,
    'current_usage_count', current_count,
    'historical_usage_count', historical_count,
    'updated_at', now_at,
    'status', 'archived'
  );
  return private.complete_operation(operation_id, result);
end;
$$;

create function private.reactivate_controlled_value(
  list_code text,
  value_id uuid,
  requested_sort_order integer,
  expected_updated_at timestamptz,
  operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  operation public.operation_requests;
  value_name text;
  value_is_active boolean;
  current_updated_at timestamptz;
  active_count integer;
  target_order integer;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id,
    'reactivate_' || list_code,
    auth.uid(),
    jsonb_build_object(
      'value_id', value_id,
      'requested_sort_order', requested_sort_order,
      'expected_updated_at', expected_updated_at
    ),
    'started'
  );
  if operation.state = 'completed' then
    return operation.result;
  end if;

  actor := private.require_admin(auth.uid());

  if list_code = 'work_area' then
    select name::text, is_active, updated_at
    into value_name, value_is_active, current_updated_at
    from public.work_areas where id = value_id for update;
    select count(*) into active_count from public.work_areas where is_active;
  elsif list_code = 'label' then
    select name::text, is_active, updated_at
    into value_name, value_is_active, current_updated_at
    from public.labels where id = value_id for update;
    select count(*) into active_count from public.labels where is_active;
  else
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if value_name is null or value_is_active then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;
  if current_updated_at is distinct from expected_updated_at then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end if;

  target_order := coalesce(requested_sort_order, active_count);
  if target_order < 0 or target_order > active_count then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  begin
    if list_code = 'work_area' then
      update public.work_areas
      set sort_order = sort_order + 1
      where is_active and sort_order >= target_order;
      update public.work_areas
      set
        sort_order = target_order,
        is_active = true,
        archived_by = null,
        archived_at = null,
        updated_by = actor.id,
        updated_at = now_at
      where id = value_id;
    else
      update public.labels
      set sort_order = sort_order + 1
      where is_active and sort_order >= target_order;
      update public.labels
      set
        sort_order = target_order,
        is_active = true,
        archived_by = null,
        archived_at = null,
        updated_by = actor.id,
        updated_at = now_at
      where id = value_id;
    end if;
  exception when unique_violation then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end;

  perform private.write_admin_audit(
    case when list_code = 'work_area'
      then 'work_area_reactivated' else 'label_reactivated' end,
    actor.id,
    list_code,
    value_id,
    jsonb_build_object('is_active', false),
    jsonb_build_object(
      'is_active', true,
      'name', value_name,
      'sort_order', target_order
    ),
    operation_id
  );

  result := jsonb_build_object(
    'id', value_id,
    'sort_order', target_order,
    'updated_at', now_at,
    'status', 'reactivated'
  );
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.create_work_area(
  work_area_id uuid,
  name text,
  requested_sort_order integer default null,
  operation_id uuid default gen_random_uuid()
)
returns jsonb language sql security definer set search_path = ''
as $$
  select private.create_controlled_value(
    'work_area', work_area_id, name, requested_sort_order, operation_id
  );
$$;

create function public.create_label(
  label_id uuid,
  name text,
  requested_sort_order integer default null,
  operation_id uuid default gen_random_uuid()
)
returns jsonb language sql security definer set search_path = ''
as $$
  select private.create_controlled_value(
    'label', label_id, name, requested_sort_order, operation_id
  );
$$;

create function public.rename_work_area(
  work_area_id uuid,
  name text,
  expected_updated_at timestamptz,
  operation_id uuid default gen_random_uuid()
)
returns jsonb language sql security definer set search_path = ''
as $$
  select private.rename_controlled_value(
    'work_area', work_area_id, name, expected_updated_at, operation_id
  );
$$;

create function public.rename_label(
  label_id uuid,
  name text,
  expected_updated_at timestamptz,
  operation_id uuid default gen_random_uuid()
)
returns jsonb language sql security definer set search_path = ''
as $$
  select private.rename_controlled_value(
    'label', label_id, name, expected_updated_at, operation_id
  );
$$;

create function public.reorder_work_areas(
  ordered_ids uuid[],
  operation_id uuid default gen_random_uuid()
)
returns jsonb language sql security definer set search_path = ''
as $$
  select private.reorder_controlled_values(
    'work_area', ordered_ids, operation_id
  );
$$;

create function public.reorder_labels(
  ordered_ids uuid[],
  operation_id uuid default gen_random_uuid()
)
returns jsonb language sql security definer set search_path = ''
as $$
  select private.reorder_controlled_values('label', ordered_ids, operation_id);
$$;

create function public.archive_work_area(
  work_area_id uuid,
  confirmed_usage_count integer,
  expected_updated_at timestamptz,
  operation_id uuid default gen_random_uuid()
)
returns jsonb language sql security definer set search_path = ''
as $$
  select private.archive_controlled_value(
    'work_area',
    work_area_id,
    confirmed_usage_count,
    expected_updated_at,
    operation_id
  );
$$;

create function public.archive_label(
  label_id uuid,
  confirmed_usage_count integer,
  expected_updated_at timestamptz,
  operation_id uuid default gen_random_uuid()
)
returns jsonb language sql security definer set search_path = ''
as $$
  select private.archive_controlled_value(
    'label',
    label_id,
    confirmed_usage_count,
    expected_updated_at,
    operation_id
  );
$$;

create function public.reactivate_work_area(
  work_area_id uuid,
  requested_sort_order integer default null,
  expected_updated_at timestamptz default null,
  operation_id uuid default gen_random_uuid()
)
returns jsonb language sql security definer set search_path = ''
as $$
  select private.reactivate_controlled_value(
    'work_area',
    work_area_id,
    requested_sort_order,
    expected_updated_at,
    operation_id
  );
$$;

create function public.reactivate_label(
  label_id uuid,
  requested_sort_order integer default null,
  expected_updated_at timestamptz default null,
  operation_id uuid default gen_random_uuid()
)
returns jsonb language sql security definer set search_path = ''
as $$
  select private.reactivate_controlled_value(
    'label',
    label_id,
    requested_sort_order,
    expected_updated_at,
    operation_id
  );
$$;

create function public.set_team_timezone(
  timezone_name text,
  expected_updated_at timestamptz,
  operation_id uuid default gen_random_uuid()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  operation public.operation_requests;
  settings public.team_settings;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id,
    'set_team_timezone',
    auth.uid(),
    jsonb_build_object(
      'timezone_name', btrim(timezone_name),
      'expected_updated_at', expected_updated_at
    ),
    'started'
  );
  if operation.state = 'completed' then
    return operation.result;
  end if;

  actor := private.require_admin(auth.uid());

  if not exists (
    select 1 from pg_catalog.pg_timezone_names timezone_entry
    where timezone_entry.name = btrim(timezone_name)
  ) then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  select * into settings
  from public.team_settings
  where singleton_key
  for update;

  if settings.updated_at is distinct from expected_updated_at then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end if;

  if settings.timezone = btrim(timezone_name) then
    result := jsonb_build_object(
      'timezone', settings.timezone,
      'updated_at', settings.updated_at,
      'status', 'unchanged'
    );
    return private.complete_operation(operation_id, result);
  end if;

  update public.team_settings
  set
    timezone = btrim(timezone_name),
    updated_by = actor.id,
    updated_at = now_at
  where singleton_key;

  perform private.write_admin_audit(
    'team_timezone_changed',
    actor.id,
    'team_settings',
    null,
    jsonb_build_object('timezone', settings.timezone),
    jsonb_build_object('timezone', btrim(timezone_name)),
    operation_id
  );

  result := jsonb_build_object(
    'timezone', btrim(timezone_name),
    'updated_at', now_at,
    'status', 'updated'
  );
  return private.complete_operation(operation_id, result);
end;
$$;

revoke all on
  public.team_directory,
  public.admin_member_directory,
  public.work_area_settings,
  public.label_settings,
  public.administration_audit_log
from public, anon, authenticated;

grant select on
  public.team_directory,
  public.admin_member_directory,
  public.work_area_settings,
  public.label_settings,
  public.administration_audit_log
to authenticated;

revoke execute on function public.set_member_access(
  uuid, text, boolean, uuid, timestamptz, jsonb, uuid
) from public, anon;
revoke execute on function public.create_work_area(
  uuid, text, integer, uuid
) from public, anon;
revoke execute on function public.create_label(
  uuid, text, integer, uuid
) from public, anon;
revoke execute on function public.rename_work_area(
  uuid, text, timestamptz, uuid
) from public, anon;
revoke execute on function public.rename_label(
  uuid, text, timestamptz, uuid
) from public, anon;
revoke execute on function public.reorder_work_areas(
  uuid[], uuid
) from public, anon;
revoke execute on function public.reorder_labels(
  uuid[], uuid
) from public, anon;
revoke execute on function public.archive_work_area(
  uuid, integer, timestamptz, uuid
) from public, anon;
revoke execute on function public.archive_label(
  uuid, integer, timestamptz, uuid
) from public, anon;
revoke execute on function public.reactivate_work_area(
  uuid, integer, timestamptz, uuid
) from public, anon;
revoke execute on function public.reactivate_label(
  uuid, integer, timestamptz, uuid
) from public, anon;
revoke execute on function public.set_team_timezone(
  text, timestamptz, uuid
) from public, anon;

grant execute on function public.set_member_access(
  uuid, text, boolean, uuid, timestamptz, jsonb, uuid
) to authenticated;
grant execute on function public.create_work_area(
  uuid, text, integer, uuid
) to authenticated;
grant execute on function public.create_label(
  uuid, text, integer, uuid
) to authenticated;
grant execute on function public.rename_work_area(
  uuid, text, timestamptz, uuid
) to authenticated;
grant execute on function public.rename_label(
  uuid, text, timestamptz, uuid
) to authenticated;
grant execute on function public.reorder_work_areas(
  uuid[], uuid
) to authenticated;
grant execute on function public.reorder_labels(
  uuid[], uuid
) to authenticated;
grant execute on function public.archive_work_area(
  uuid, integer, timestamptz, uuid
) to authenticated;
grant execute on function public.archive_label(
  uuid, integer, timestamptz, uuid
) to authenticated;
grant execute on function public.reactivate_work_area(
  uuid, integer, timestamptz, uuid
) to authenticated;
grant execute on function public.reactivate_label(
  uuid, integer, timestamptz, uuid
) to authenticated;
grant execute on function public.set_team_timezone(
  text, timestamptz, uuid
) to authenticated;

revoke execute on function private.write_admin_audit(
  text, uuid, text, uuid, jsonb, jsonb, uuid
) from public, anon, authenticated;
revoke execute on function private.controlled_list_usage(
  text, uuid
) from public, anon, authenticated;
revoke execute on function private.create_controlled_value(
  text, uuid, text, integer, uuid
) from public, anon, authenticated;
revoke execute on function private.rename_controlled_value(
  text, uuid, text, timestamptz, uuid
) from public, anon, authenticated;
revoke execute on function private.reorder_controlled_values(
  text, uuid[], uuid
) from public, anon, authenticated;
revoke execute on function private.archive_controlled_value(
  text, uuid, integer, timestamptz, uuid
) from public, anon, authenticated;
revoke execute on function private.reactivate_controlled_value(
  text, uuid, integer, timestamptz, uuid
) from public, anon, authenticated;

commit;
