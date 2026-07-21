-- Design Flow Phase 3, slice 2: Work Item detail and core lifecycle.

begin;

create function private.write_work_item_event(
  target_work_item_id uuid,
  target_event_type text,
  target_actor_id uuid,
  target_subject_type text,
  target_subject_id uuid,
  target_previous_values jsonb,
  target_new_values jsonb,
  target_operation_id uuid,
  target_occurred_at timestamptz default statement_timestamp()
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_id uuid;
begin
  insert into public.work_item_events (
    work_item_id, event_type_code, actor_id, subject_type, subject_id,
    previous_values, new_values, operation_id, occurred_at
  ) values (
    target_work_item_id, target_event_type, target_actor_id,
    target_subject_type, target_subject_id, target_previous_values,
    target_new_values, target_operation_id, target_occurred_at
  ) returning id into event_id;
  return event_id;
end;
$$;

create function private.write_work_item_notification(
  target_recipient_id uuid,
  target_actor_id uuid,
  target_work_item_id uuid,
  target_source_event_id uuid,
  target_notification_type text,
  target_created_at timestamptz default statement_timestamp()
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_recipient_id is not null and target_recipient_id <> target_actor_id then
    insert into public.notifications (
      recipient_id, actor_id, work_item_id, source_event_id,
      notification_type_code, created_at
    ) values (
      target_recipient_id, target_actor_id, target_work_item_id,
      target_source_event_id, target_notification_type, target_created_at
    );
  end if;
end;
$$;

create function public.get_work_item_detail(display_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  item public.work_items;
  result jsonb;
begin
  actor := private.require_application_user_read();

  select target.* into item
  from public.work_items target
  where upper(target.display_id) = upper(btrim($1));

  if item.id is null then
    return null;
  end if;

  select jsonb_build_object(
    'id', item.id,
    'displayId', item.display_id,
    'title', item.title,
    'description', item.description,
    'status', jsonb_build_object('code', item.status_code, 'label', status.display_label),
    'area', jsonb_build_object('id', item.area_id, 'name', area.name::text, 'isActive', area.is_active),
    'assignee', case when assignee.id is null then null else jsonb_build_object('id', assignee.id, 'displayName', assignee.display_name) end,
    'contributors', coalesce(contributor_data.value, '[]'::jsonb),
    'labels', coalesce(label_data.value, '[]'::jsonb),
    'plannedStartDate', item.planned_start_date,
    'dueDate', item.due_date,
    'figmaUrl', item.figma_url,
    'createdBy', jsonb_build_object('id', creator.id, 'displayName', creator.display_name),
    'createdAt', item.created_at,
    'updatedAt', item.updated_at,
    'firstWorkedOn', actual_dates.first_worked_on,
    'lastWorkedOn', item.last_worked_on,
    'lastActivityAt', item.last_activity_at,
    'activeWorkDays', coalesce(active_days.active_work_days, 0),
    'completedAt', item.completed_at,
    'isArchived', item.archived_at is not null,
    'archivedAt', item.archived_at,
    'subtasks', coalesce(subtask_data.value, '[]'::jsonb),
    'completedSubtasks', coalesce(subtask_data.completed_count, 0),
    'totalSubtasks', coalesce(subtask_data.total_count, 0),
    'activeBlocker', active_blocker.value,
    'blockerHistory', coalesce(blocker_history.value, '[]'::jsonb),
    'events', coalesce(event_data.value, '[]'::jsonb),
    'comments', coalesce(comment_data.value, '[]'::jsonb),
    'capabilities', jsonb_build_object(
      'canEdit', item.archived_at is null and private.can_edit_work_item(item.id),
      'canReassign', item.archived_at is null and private.can_edit_work_item(item.id),
      'canTransition', item.archived_at is null and private.can_edit_work_item(item.id),
      'canCreateBlocker', item.archived_at is null
        and actor.position_code <> 'viewer'
        and item.status_code in ('todo', 'in_progress', 'in_review')
        and active_blocker.value is null,
      'canResolveBlocker', item.archived_at is null
        and actor.position_code <> 'viewer'
        and active_blocker.value is not null,
      'canEditSubtasks', item.archived_at is null and private.can_edit_work_item(item.id),
      'canComment', item.archived_at is null and actor.position_code <> 'viewer',
      'canArchive', item.archived_at is null
        and (actor.is_admin or actor.position_code in ('lead', 'manager'))
        and status.archive_eligible,
      'canRestore', item.archived_at is not null
        and (actor.is_admin or actor.position_code in ('lead', 'manager'))
    )
  ) into result
  from public.work_item_statuses status
  join public.work_areas area on area.id = item.area_id
  join public.profiles creator on creator.id = item.created_by
  left join public.profiles assignee on assignee.id = item.primary_assignee_id
  left join public.work_item_active_work_days active_days on active_days.work_item_id = item.id
  left join lateral (
    select min(entry.work_date) as first_worked_on
    from public.valid_work_log_entries entry
    where entry.work_item_id = item.id
  ) actual_dates on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object('id', profile.id, 'displayName', profile.display_name)
      order by profile.display_name, profile.id
    ) as value
    from public.current_work_item_contributors contributor
    join public.profiles profile on profile.id = contributor.profile_id
    where contributor.work_item_id = item.id
  ) contributor_data on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object('id', label.id, 'name', label.name::text, 'isActive', label.is_active)
      order by label.sort_order, label.name
    ) as value
    from public.work_item_labels relation
    join public.labels label on label.id = relation.label_id
    where relation.work_item_id = item.id and relation.removed_at is null
  ) label_data on true
  left join lateral (
    select
      jsonb_agg(jsonb_build_object(
        'id', subtask.id,
        'title', subtask.title,
        'position', subtask.position,
        'isCompleted', subtask.is_completed,
        'createdBy', jsonb_build_object('id', created_by.id, 'displayName', created_by.display_name),
        'createdAt', subtask.created_at,
        'completedBy', case when completed_by.id is null then null else jsonb_build_object('id', completed_by.id, 'displayName', completed_by.display_name) end,
        'completedAt', subtask.completed_at,
        'updatedAt', subtask.updated_at
      ) order by subtask.position) as value,
      count(*) filter (where subtask.is_completed)::integer as completed_count,
      count(*)::integer as total_count
    from public.subtasks subtask
    join public.profiles created_by on created_by.id = subtask.created_by
    left join public.profiles completed_by on completed_by.id = subtask.completed_by
    where subtask.work_item_id = item.id and subtask.withdrawn_at is null
  ) subtask_data on true
  left join lateral (
    select jsonb_build_object(
      'id', blocker.id,
      'reason', blocker.reason,
      'blockedBy', jsonb_build_object('id', profile.id, 'displayName', profile.display_name),
      'blockedAt', blocker.blocked_at,
      'expectedResolutionDate', blocker.expected_resolution_date
    ) as value
    from public.blockers blocker
    join public.profiles profile on profile.id = blocker.blocked_by
    where blocker.work_item_id = item.id and blocker.resolved_at is null
  ) active_blocker on true
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'id', blocker.id,
      'reason', blocker.reason,
      'blockedBy', jsonb_build_object('id', blocked_by.id, 'displayName', blocked_by.display_name),
      'blockedAt', blocker.blocked_at,
      'expectedResolutionDate', blocker.expected_resolution_date,
      'resolvedBy', case when resolved_by.id is null then null else jsonb_build_object('id', resolved_by.id, 'displayName', resolved_by.display_name) end,
      'resolvedAt', blocker.resolved_at,
      'resolutionNote', blocker.resolution_note
    ) order by blocker.blocked_at desc) as value
    from public.blockers blocker
    join public.profiles blocked_by on blocked_by.id = blocker.blocked_by
    left join public.profiles resolved_by on resolved_by.id = blocker.resolved_by
    where blocker.work_item_id = item.id and blocker.resolved_at is not null
  ) blocker_history on true
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'id', event.id,
      'type', event.event_type_code,
      'actor', jsonb_build_object('id', event.actor_id, 'displayName', profile.display_name),
      'subjectType', event.subject_type,
      'subjectId', event.subject_id,
      'previousValues', event.previous_values,
      'newValues', event.new_values,
      'occurredAt', event.occurred_at
    ) order by event.occurred_at, event.id) as value
    from public.work_item_events event
    join public.profiles profile on profile.id = event.actor_id
    where event.work_item_id = item.id
      and event.event_type_code in (
        'created', 'core_fields_changed', 'labels_changed', 'assignment_changed',
        'status_changed', 'reopened', 'blocker_created', 'blocker_resolved',
        'subtask_added', 'subtask_renamed', 'subtask_reordered',
        'subtask_completed', 'subtask_reopened', 'subtask_withdrawn',
        'archived', 'restored'
      )
  ) event_data on true
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'id', comment.id,
      'body', comment.body,
      'author', jsonb_build_object('id', author.id, 'displayName', author.display_name),
      'createdAt', comment.created_at,
      'editedAt', comment.edited_at,
      'withdrawnAt', comment.withdrawn_at,
      'withdrawnBy', case when withdrawn_by.id is null then null else jsonb_build_object('id', withdrawn_by.id, 'displayName', withdrawn_by.display_name) end,
      'canEdit', comment.withdrawn_at is null and comment.author_id = actor.id,
      'canWithdraw', comment.withdrawn_at is null and (
        comment.author_id = actor.id or actor.is_admin or actor.position_code in ('lead', 'manager')
      )
    ) order by comment.created_at, comment.id) as value
    from public.visible_comments comment
    join public.profiles author on author.id = comment.author_id
    left join public.profiles withdrawn_by on withdrawn_by.id = comment.withdrawn_by
    where comment.work_item_id = item.id
  ) comment_data on true
  where status.code = item.status_code;

  return result;
end;
$$;

create function public.update_work_item(
  work_item_id uuid,
  title text,
  description text,
  area_id uuid,
  planned_start_date date,
  due_date date,
  figma_url text,
  label_ids uuid[],
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
  item public.work_items;
  normalized_description text := nullif(btrim(description), '');
  normalized_figma_url text := nullif(btrim(figma_url), '');
  normalized_labels uuid[];
  current_labels uuid[];
  core_changed boolean;
  labels_changed boolean;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  select coalesce(array_agg(value order by value), array[]::uuid[])
  into normalized_labels from unnest(coalesce(label_ids, array[]::uuid[])) value;

  operation := private.lock_or_create_operation(
    operation_id, 'update_work_item', auth.uid(),
    jsonb_build_object(
      'work_item_id', work_item_id, 'title', btrim(title),
      'description', normalized_description, 'area_id', area_id,
      'planned_start_date', planned_start_date, 'due_date', due_date,
      'figma_url', normalized_figma_url, 'label_ids', to_jsonb(normalized_labels),
      'expected_updated_at', expected_updated_at
    ), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;

  actor := private.require_profile(auth.uid(), false, false);
  select target.* into item from public.work_items target
  where target.id = work_item_id for update;

  if item.id is null then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if not private.can_edit_work_item(item.id) then raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN'; end if;
  if item.archived_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  if item.updated_at is distinct from expected_updated_at then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;

  if btrim(title) = '' or area_id is null
    or (planned_start_date is not null and due_date is not null and due_date < planned_start_date)
    or cardinality(normalized_labels) <> cardinality(array(select distinct unnest(normalized_labels)))
    or (normalized_figma_url is not null and normalized_figma_url !~* '^https://([a-z0-9-]+\.)*figma\.com(/|$)')
  then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  perform 1 from public.work_areas area
  where area.id = area_id and (area.is_active or area.id = item.area_id)
  for update;
  if not found then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;

  select coalesce(array_agg(relation.label_id order by relation.label_id), array[]::uuid[])
  into current_labels
  from public.work_item_labels relation
  where relation.work_item_id = item.id and relation.removed_at is null;

  if exists (
    select 1 from unnest(normalized_labels) requested(label_id)
    left join public.labels label on label.id = requested.label_id
    where label.id is null or (
      not label.is_active and requested.label_id <> all(current_labels)
    )
  ) then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  core_changed := item.title is distinct from btrim(title)
    or item.description is distinct from normalized_description
    or item.area_id is distinct from area_id
    or item.planned_start_date is distinct from planned_start_date
    or item.due_date is distinct from due_date
    or item.figma_url is distinct from normalized_figma_url;
  labels_changed := current_labels is distinct from normalized_labels;

  if not core_changed and not labels_changed then
    return private.complete_operation(operation_id, jsonb_build_object(
      'id', item.id, 'display_id', item.display_id,
      'updated_at', item.updated_at, 'status', 'unchanged'
    ));
  end if;

  update public.work_items set
    title = btrim(update_work_item.title),
    description = normalized_description,
    area_id = update_work_item.area_id,
    planned_start_date = update_work_item.planned_start_date,
    due_date = update_work_item.due_date,
    figma_url = normalized_figma_url,
    updated_at = now_at,
    last_activity_at = now_at
  where id = item.id;

  if core_changed then
    perform private.write_work_item_event(
      item.id, 'core_fields_changed', actor.id, 'work_item', item.id,
      jsonb_build_object(
        'title', item.title, 'area_id', item.area_id,
        'planned_start_date', item.planned_start_date, 'due_date', item.due_date,
        'figma_url', item.figma_url, 'description_present', item.description is not null
      ),
      jsonb_build_object(
        'title', btrim(title), 'area_id', area_id,
        'planned_start_date', planned_start_date, 'due_date', due_date,
        'figma_url', normalized_figma_url, 'description_present', normalized_description is not null
      ), operation_id, now_at
    );
  end if;

  if labels_changed then
    update public.work_item_labels relation set
      removed_by = actor.id, removed_at = now_at, remove_operation_id = operation_id
    where relation.work_item_id = item.id and relation.removed_at is null
      and relation.label_id <> all(normalized_labels);

    insert into public.work_item_labels (
      work_item_id, label_id, applied_by, applied_at, apply_operation_id
    )
    select item.id, requested.label_id, actor.id, now_at, operation_id
    from unnest(normalized_labels) requested(label_id)
    where requested.label_id <> all(current_labels);

    perform private.write_work_item_event(
      item.id, 'labels_changed', actor.id, 'work_item', item.id,
      jsonb_build_object('label_ids', to_jsonb(current_labels)),
      jsonb_build_object('label_ids', to_jsonb(normalized_labels)),
      operation_id, now_at
    );
  end if;

  result := jsonb_build_object(
    'id', item.id, 'display_id', item.display_id,
    'updated_at', now_at, 'status', 'updated'
  );
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.reassign_work_item(
  work_item_id uuid,
  new_assignee_id uuid,
  expected_assignee_id uuid,
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
  assignee public.profiles;
  operation public.operation_requests;
  item public.work_items;
  status public.work_item_statuses;
  event_id uuid;
  now_at timestamptz := statement_timestamp();
  team_date date;
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'reassign_work_item', auth.uid(),
    jsonb_build_object(
      'work_item_id', work_item_id, 'new_assignee_id', new_assignee_id,
      'expected_assignee_id', expected_assignee_id,
      'expected_updated_at', expected_updated_at
    ), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;

  actor := private.require_profile(auth.uid(), false, false);
  if new_assignee_id is not null then
    select profile.* into assignee from public.profiles profile
    where profile.id = new_assignee_id for update;
    if assignee.id is null or not assignee.is_active or assignee.must_change_password
      or assignee.position_code not in ('designer', 'lead', 'manager')
    then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  end if;

  select target.* into item from public.work_items target
  where target.id = work_item_id for update;
  if item.id is null then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if not private.can_edit_work_item(item.id) then raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN'; end if;
  if item.archived_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  if item.primary_assignee_id is distinct from expected_assignee_id
    or item.updated_at is distinct from expected_updated_at
  then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;

  select definition.* into status from public.work_item_statuses definition
  where definition.code = item.status_code;
  if status.requires_primary_assignee and new_assignee_id is null then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  if item.primary_assignee_id is not distinct from new_assignee_id then
    return private.complete_operation(operation_id, jsonb_build_object(
      'id', item.id, 'assignee_id', item.primary_assignee_id,
      'updated_at', item.updated_at, 'status', 'unchanged'
    ));
  end if;

  team_date := private.current_team_date();
  update public.work_item_assignments assignment set
    ended_at = now_at, ended_on = team_date, end_operation_id = operation_id
  where assignment.work_item_id = item.id and assignment.ended_at is null;

  if new_assignee_id is not null then
    insert into public.work_item_assignments (
      work_item_id, assignee_id, started_at, started_on, assigned_by, start_operation_id
    ) values (item.id, new_assignee_id, now_at, team_date, actor.id, operation_id);
  end if;

  update public.work_items set
    primary_assignee_id = new_assignee_id,
    updated_at = now_at,
    last_activity_at = now_at
  where id = item.id;

  event_id := private.write_work_item_event(
    item.id, 'assignment_changed', actor.id, 'work_item', item.id,
    jsonb_build_object('assignee_id', item.primary_assignee_id),
    jsonb_build_object('assignee_id', new_assignee_id),
    operation_id, now_at
  );
  perform private.write_work_item_notification(
    item.primary_assignee_id, actor.id, item.id, event_id,
    'reassigned_away_from_you', now_at
  );
  perform private.write_work_item_notification(
    new_assignee_id, actor.id, item.id, event_id,
    'assigned_to_you', now_at
  );

  result := jsonb_build_object(
    'id', item.id, 'assignee_id', new_assignee_id,
    'updated_at', now_at, 'status', 'updated'
  );
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.transition_work_item_status(
  work_item_id uuid,
  target_status_code text,
  expected_status_code text,
  expected_updated_at timestamptz,
  acknowledge_incomplete_subtasks boolean default false,
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
  item public.work_items;
  target_status public.work_item_statuses;
  event_id uuid;
  incomplete_count integer;
  now_at timestamptz := statement_timestamp();
  team_date date;
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'transition_work_item_status', auth.uid(),
    jsonb_build_object(
      'work_item_id', work_item_id, 'target_status_code', target_status_code,
      'expected_status_code', expected_status_code,
      'expected_updated_at', expected_updated_at,
      'acknowledge_incomplete_subtasks', acknowledge_incomplete_subtasks
    ), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;

  actor := private.require_profile(auth.uid(), false, false);
  select target.* into item from public.work_items target
  where target.id = work_item_id for update;
  if item.id is null then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if not private.can_edit_work_item(item.id) then raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN'; end if;
  if item.archived_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  if item.status_code is distinct from expected_status_code
    or item.updated_at is distinct from expected_updated_at
  then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;
  if target_status_code = item.status_code then
    return private.complete_operation(operation_id, jsonb_build_object(
      'id', item.id, 'status_code', item.status_code,
      'updated_at', item.updated_at, 'status', 'unchanged'
    ));
  end if;

  select status.* into target_status from public.work_item_statuses status
  where status.code = target_status_code;
  if target_status.code is null or not exists (
    select 1 from public.work_item_status_transitions transition
    where transition.from_status_code = item.status_code
      and transition.to_status_code = target_status_code
      and transition.is_allowed
  ) then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;

  if target_status.requires_primary_assignee and item.primary_assignee_id is null then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;
  if target_status_code in ('backlog', 'paused', 'done') and exists (
    select 1 from public.blockers blocker
    where blocker.work_item_id = item.id and blocker.resolved_at is null
  ) then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;

  select count(*)::integer into incomplete_count
  from public.subtasks subtask
  where subtask.work_item_id = item.id and subtask.withdrawn_at is null
    and not subtask.is_completed;
  if target_status_code = 'done' and incomplete_count > 0
    and not acknowledge_incomplete_subtasks
  then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;

  team_date := private.current_team_date();
  update public.work_items set
    status_code = target_status_code,
    updated_at = now_at,
    last_activity_at = now_at,
    completed_at = case when target_status_code = 'done' then now_at else completed_at end
  where id = item.id;

  insert into public.work_item_status_history (
    work_item_id, from_status_code, to_status_code, changed_by,
    changed_at, changed_on, operation_id
  ) values (
    item.id, item.status_code, target_status_code, actor.id,
    now_at, team_date, operation_id
  );

  event_id := private.write_work_item_event(
    item.id, 'status_changed', actor.id, 'work_item', item.id,
    jsonb_build_object('status_code', item.status_code),
    jsonb_build_object('status_code', target_status_code),
    operation_id, now_at
  );
  if item.status_code = 'done' and target_status_code <> 'done' then
    perform private.write_work_item_event(
      item.id, 'reopened', actor.id, 'work_item', item.id,
      jsonb_build_object('status_code', 'done'),
      jsonb_build_object('status_code', target_status_code),
      operation_id, now_at
    );
  end if;
  perform private.write_work_item_notification(
    item.primary_assignee_id, actor.id, item.id, event_id,
    'status_changed', now_at
  );

  result := jsonb_build_object(
    'id', item.id, 'status_code', target_status_code,
    'updated_at', now_at, 'status', 'updated'
  );
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.archive_work_item(
  work_item_id uuid,
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
  item public.work_items;
  eligible boolean;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'archive_work_item', auth.uid(),
    jsonb_build_object('work_item_id', work_item_id, 'expected_updated_at', expected_updated_at),
    'started'
  );
  if operation.state = 'completed' then return operation.result; end if;
  actor := private.require_profile(auth.uid(), false, false);
  if not (actor.is_admin or actor.position_code in ('lead', 'manager')) then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;
  select target.* into item from public.work_items target
  where target.id = work_item_id for update;
  if item.id is null then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if item.updated_at is distinct from expected_updated_at then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;
  if item.archived_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  select status.archive_eligible into eligible from public.work_item_statuses status
  where status.code = item.status_code;
  if not eligible or exists (
    select 1 from public.blockers blocker where blocker.work_item_id = item.id and blocker.resolved_at is null
  ) then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;

  update public.work_items set
    archived_by = actor.id, archived_at = now_at,
    updated_at = now_at, last_activity_at = now_at
  where id = item.id;
  perform private.write_work_item_event(
    item.id, 'archived', actor.id, 'work_item', item.id,
    null, jsonb_build_object('archived', true), operation_id, now_at
  );
  result := jsonb_build_object('id', item.id, 'archived_at', now_at, 'updated_at', now_at);
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.restore_work_item(
  work_item_id uuid,
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
  item public.work_items;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'restore_work_item', auth.uid(),
    jsonb_build_object('work_item_id', work_item_id, 'expected_updated_at', expected_updated_at),
    'started'
  );
  if operation.state = 'completed' then return operation.result; end if;
  actor := private.require_profile(auth.uid(), false, false);
  if not (actor.is_admin or actor.position_code in ('lead', 'manager')) then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;
  select target.* into item from public.work_items target
  where target.id = work_item_id for update;
  if item.id is null then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if item.updated_at is distinct from expected_updated_at then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;
  if item.archived_at is null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;

  update public.work_items set
    archived_by = null, archived_at = null,
    updated_at = now_at, last_activity_at = now_at
  where id = item.id;
  perform private.write_work_item_event(
    item.id, 'restored', actor.id, 'work_item', item.id,
    jsonb_build_object('archived', true), jsonb_build_object('archived', false),
    operation_id, now_at
  );
  result := jsonb_build_object('id', item.id, 'archived_at', null, 'updated_at', now_at);
  return private.complete_operation(operation_id, result);
end;
$$;

revoke execute on function private.write_work_item_event(
  uuid, text, uuid, text, uuid, jsonb, jsonb, uuid, timestamptz
) from public, anon, authenticated;
revoke execute on function private.write_work_item_notification(
  uuid, uuid, uuid, uuid, text, timestamptz
) from public, anon, authenticated;
revoke execute on function public.get_work_item_detail(text) from public, anon;
revoke execute on function public.update_work_item(
  uuid, text, text, uuid, date, date, text, uuid[], timestamptz, uuid
) from public, anon;
revoke execute on function public.reassign_work_item(
  uuid, uuid, uuid, timestamptz, uuid
) from public, anon;
revoke execute on function public.transition_work_item_status(
  uuid, text, text, timestamptz, boolean, uuid
) from public, anon;
revoke execute on function public.archive_work_item(uuid, timestamptz, uuid) from public, anon;
revoke execute on function public.restore_work_item(uuid, timestamptz, uuid) from public, anon;

grant execute on function public.get_work_item_detail(text) to authenticated;
grant execute on function public.update_work_item(
  uuid, text, text, uuid, date, date, text, uuid[], timestamptz, uuid
) to authenticated;
grant execute on function public.reassign_work_item(
  uuid, uuid, uuid, timestamptz, uuid
) to authenticated;
grant execute on function public.transition_work_item_status(
  uuid, text, text, timestamptz, boolean, uuid
) to authenticated;
grant execute on function public.archive_work_item(uuid, timestamptz, uuid) to authenticated;
grant execute on function public.restore_work_item(uuid, timestamptz, uuid) to authenticated;

commit;
