-- Design Flow Phase 3, slice 3: blockers, subtasks, and comments.

begin;

create function private.lock_editable_work_item(
  target_work_item_id uuid,
  require_editor boolean default true
)
returns public.work_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.work_items;
begin
  select target.* into item
  from public.work_items target
  where target.id = target_work_item_id
  for update;

  if item.id is null then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;
  if item.archived_at is not null then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;
  if require_editor and not private.can_edit_work_item(item.id) then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;
  return item;
end;
$$;

create function public.create_blocker(
  work_item_id uuid,
  reason text,
  expected_resolution_date date,
  expected_status_code text,
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
  blocker_id uuid;
  event_id uuid;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'create_blocker', auth.uid(),
    jsonb_build_object(
      'work_item_id', work_item_id, 'reason', btrim(reason),
      'expected_resolution_date', expected_resolution_date,
      'expected_status_code', expected_status_code
    ), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;

  actor := private.require_profile(auth.uid(), false, false);
  if actor.position_code = 'viewer' then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;
  item := private.lock_editable_work_item(work_item_id, false);
  if item.status_code is distinct from expected_status_code then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end if;
  if item.status_code not in ('todo', 'in_progress', 'in_review') or btrim(reason) = '' then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;
  if exists (select 1 from public.blockers target where target.work_item_id = item.id and target.resolved_at is null) then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end if;

  insert into public.blockers (
    work_item_id, reason, blocked_by, blocked_at,
    expected_resolution_date, create_operation_id
  ) values (
    item.id, btrim(reason), actor.id, now_at,
    expected_resolution_date, operation_id
  ) returning id into blocker_id;

  update public.work_items target set last_activity_at = now_at where target.id = item.id;
  event_id := private.write_work_item_event(
    item.id, 'blocker_created', actor.id, 'blocker', blocker_id,
    null, jsonb_build_object('expected_resolution_date', expected_resolution_date),
    operation_id, now_at
  );
  perform private.write_work_item_notification(
    item.primary_assignee_id, actor.id, item.id, event_id, 'blocker_created', now_at
  );

  result := jsonb_build_object(
    'id', blocker_id, 'work_item_id', item.id, 'blocked_at', now_at,
    'last_activity_at', now_at
  );
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.resolve_blocker(
  blocker_id uuid,
  resolution_note text,
  expected_unresolved boolean,
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
  blocker public.blockers;
  item public.work_items;
  event_id uuid;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'resolve_blocker', auth.uid(),
    jsonb_build_object(
      'blocker_id', blocker_id, 'resolution_note', nullif(btrim(resolution_note), ''),
      'expected_unresolved', expected_unresolved
    ), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;

  actor := private.require_profile(auth.uid(), false, false);
  if actor.position_code = 'viewer' then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;
  select target.* into blocker from public.blockers target
  where target.id = blocker_id for update;
  if blocker.id is null then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  item := private.lock_editable_work_item(blocker.work_item_id, false);
  if not expected_unresolved or blocker.resolved_at is not null then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end if;

  update public.blockers target set
    resolved_by = actor.id, resolved_at = now_at,
    resolution_note = nullif(btrim(resolve_blocker.resolution_note), ''),
    resolve_operation_id = operation_id
  where target.id = blocker.id;
  update public.work_items target set last_activity_at = now_at where target.id = item.id;
  event_id := private.write_work_item_event(
    item.id, 'blocker_resolved', actor.id, 'blocker', blocker.id,
    jsonb_build_object('active', true), jsonb_build_object('active', false),
    operation_id, now_at
  );
  perform private.write_work_item_notification(
    item.primary_assignee_id, actor.id, item.id, event_id, 'blocker_resolved', now_at
  );

  result := jsonb_build_object(
    'id', blocker.id, 'work_item_id', item.id, 'resolved_at', now_at,
    'last_activity_at', now_at
  );
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.add_subtask(
  work_item_id uuid,
  title text,
  insertion_position integer,
  expected_last_activity_at timestamptz,
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
  target_position integer;
  active_count integer;
  subtask_id uuid;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'add_subtask', auth.uid(),
    jsonb_build_object(
      'work_item_id', work_item_id, 'title', btrim(title),
      'insertion_position', insertion_position,
      'expected_last_activity_at', expected_last_activity_at
    ), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;
  actor := private.require_profile(auth.uid(), false, false);
  item := private.lock_editable_work_item(work_item_id, true);
  if item.last_activity_at is distinct from expected_last_activity_at then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end if;
  if btrim(title) = '' then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;

  select count(*)::integer into active_count
  from public.subtasks target where target.work_item_id = item.id and target.withdrawn_at is null;
  target_position := coalesce(insertion_position, active_count + 1);
  if target_position < 1 or target_position > active_count + 1 then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  update public.subtasks target set position = target.position + 1000000
  where target.work_item_id = item.id and target.withdrawn_at is null and target.position >= target_position;
  update public.subtasks target set position = target.position - 999999
  where target.work_item_id = item.id and target.withdrawn_at is null and target.position >= target_position + 1000000;

  insert into public.subtasks (
    work_item_id, title, position, created_by, created_at, updated_at
  ) values (
    item.id, btrim(title), target_position, actor.id, now_at, now_at
  ) returning id into subtask_id;
  update public.work_items target set last_activity_at = now_at where target.id = item.id;
  perform private.write_work_item_event(
    item.id, 'subtask_added', actor.id, 'subtask', subtask_id,
    null, jsonb_build_object('title', btrim(title), 'position', target_position),
    operation_id, now_at
  );
  result := jsonb_build_object(
    'id', subtask_id, 'work_item_id', item.id, 'position', target_position,
    'updated_at', now_at, 'last_activity_at', now_at
  );
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.rename_subtask(
  subtask_id uuid,
  title text,
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
  subtask public.subtasks;
  item public.work_items;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'rename_subtask', auth.uid(),
    jsonb_build_object('subtask_id', subtask_id, 'title', btrim(title), 'expected_updated_at', expected_updated_at),
    'started'
  );
  if operation.state = 'completed' then return operation.result; end if;
  actor := private.require_profile(auth.uid(), false, false);
  select target.* into subtask from public.subtasks target where target.id = subtask_id for update;
  if subtask.id is null or subtask.withdrawn_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  item := private.lock_editable_work_item(subtask.work_item_id, true);
  if subtask.updated_at is distinct from expected_updated_at then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;
  if btrim(title) = '' then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if subtask.title = btrim(title) then
    return private.complete_operation(operation_id, jsonb_build_object(
      'id', subtask.id, 'updated_at', subtask.updated_at,
      'last_activity_at', item.last_activity_at, 'status', 'unchanged'
    ));
  end if;
  update public.subtasks target set title = btrim(rename_subtask.title), updated_at = now_at where target.id = subtask.id;
  update public.work_items target set last_activity_at = now_at where target.id = item.id;
  perform private.write_work_item_event(
    item.id, 'subtask_renamed', actor.id, 'subtask', subtask.id,
    jsonb_build_object('title', subtask.title), jsonb_build_object('title', btrim(title)), operation_id, now_at
  );
  result := jsonb_build_object('id', subtask.id, 'updated_at', now_at, 'last_activity_at', now_at);
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.reorder_subtasks(
  work_item_id uuid,
  ordered_ids uuid[],
  expected_last_activity_at timestamptz,
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
  active_ids uuid[];
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'reorder_subtasks', auth.uid(),
    jsonb_build_object('work_item_id', work_item_id, 'ordered_ids', to_jsonb(ordered_ids), 'expected_last_activity_at', expected_last_activity_at),
    'started'
  );
  if operation.state = 'completed' then return operation.result; end if;
  actor := private.require_profile(auth.uid(), false, false);
  item := private.lock_editable_work_item(work_item_id, true);
  if item.last_activity_at is distinct from expected_last_activity_at then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;

  select coalesce(array_agg(target.id order by target.id), array[]::uuid[]) into active_ids
  from public.subtasks target where target.work_item_id = item.id and target.withdrawn_at is null;
  if cardinality(coalesce(ordered_ids, array[]::uuid[])) <> cardinality(active_ids)
    or cardinality(coalesce(ordered_ids, array[]::uuid[])) <> cardinality(array(select distinct unnest(coalesce(ordered_ids, array[]::uuid[]))))
    or active_ids <> array(select value from unnest(coalesce(ordered_ids, array[]::uuid[])) value order by value)
  then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;

  update public.subtasks target set position = target.position + 1000000
  where target.work_item_id = item.id and target.withdrawn_at is null;
  update public.subtasks target set position = requested.ordinality::integer, updated_at = now_at
  from unnest(ordered_ids) with ordinality requested(id, ordinality)
  where target.id = requested.id;
  update public.work_items target set last_activity_at = now_at where target.id = item.id;
  perform private.write_work_item_event(
    item.id, 'subtask_reordered', actor.id, 'work_item', item.id,
    null, jsonb_build_object('ordered_ids', to_jsonb(ordered_ids)), operation_id, now_at
  );
  result := jsonb_build_object('work_item_id', item.id, 'ordered_ids', to_jsonb(ordered_ids), 'last_activity_at', now_at);
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.set_subtask_completion(
  subtask_id uuid,
  completed boolean,
  expected_completed boolean,
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
  subtask public.subtasks;
  item public.work_items;
  now_at timestamptz := statement_timestamp();
  event_code text;
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'set_subtask_completion', auth.uid(),
    jsonb_build_object('subtask_id', subtask_id, 'completed', completed, 'expected_completed', expected_completed), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;
  actor := private.require_profile(auth.uid(), false, false);
  select target.* into subtask from public.subtasks target where target.id = subtask_id for update;
  if subtask.id is null or subtask.withdrawn_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  item := private.lock_editable_work_item(subtask.work_item_id, true);
  if subtask.is_completed is distinct from expected_completed then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;
  if completed = subtask.is_completed then
    return private.complete_operation(operation_id, jsonb_build_object(
      'id', subtask.id, 'completed', completed, 'updated_at', subtask.updated_at,
      'last_activity_at', item.last_activity_at, 'status', 'unchanged'
    ));
  end if;
  update public.subtasks target set
    is_completed = completed,
    completed_by = case when completed then actor.id else null end,
    completed_at = case when completed then now_at else null end,
    updated_at = now_at
  where target.id = subtask.id;
  update public.work_items target set last_activity_at = now_at where target.id = item.id;
  event_code := case when completed then 'subtask_completed' else 'subtask_reopened' end;
  perform private.write_work_item_event(
    item.id, event_code, actor.id, 'subtask', subtask.id,
    jsonb_build_object('completed', subtask.is_completed), jsonb_build_object('completed', completed), operation_id, now_at
  );
  result := jsonb_build_object('id', subtask.id, 'completed', completed, 'updated_at', now_at, 'last_activity_at', now_at);
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.withdraw_subtask(
  subtask_id uuid,
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
  subtask public.subtasks;
  item public.work_items;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'withdraw_subtask', auth.uid(),
    jsonb_build_object('subtask_id', subtask_id, 'expected_updated_at', expected_updated_at), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;
  actor := private.require_profile(auth.uid(), false, false);
  select target.* into subtask from public.subtasks target where target.id = subtask_id for update;
  if subtask.id is null or subtask.withdrawn_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  item := private.lock_editable_work_item(subtask.work_item_id, true);
  if subtask.updated_at is distinct from expected_updated_at then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;

  update public.subtasks target set withdrawn_by = actor.id, withdrawn_at = now_at, updated_at = now_at where target.id = subtask.id;
  update public.subtasks target set position = target.position + 1000000
  where target.work_item_id = item.id and target.withdrawn_at is null and target.position > subtask.position;
  update public.subtasks target set position = target.position - 1000001, updated_at = now_at
  where target.work_item_id = item.id and target.withdrawn_at is null and target.position > subtask.position + 1000000;
  update public.work_items target set last_activity_at = now_at where target.id = item.id;
  perform private.write_work_item_event(
    item.id, 'subtask_withdrawn', actor.id, 'subtask', subtask.id,
    jsonb_build_object('active', true), jsonb_build_object('active', false), operation_id, now_at
  );
  result := jsonb_build_object('id', subtask.id, 'withdrawn_at', now_at, 'last_activity_at', now_at);
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.add_comment(
  work_item_id uuid,
  body text,
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
  comment_id uuid;
  event_id uuid;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'add_comment', auth.uid(),
    jsonb_build_object('work_item_id', work_item_id, 'body', btrim(body)), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;
  actor := private.require_profile(auth.uid(), false, false);
  if actor.position_code = 'viewer' then raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN'; end if;
  item := private.lock_editable_work_item(work_item_id, false);
  if btrim(body) = '' then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  insert into public.comments (work_item_id, author_id, body, created_at)
  values (item.id, actor.id, btrim(body), now_at) returning id into comment_id;
  update public.work_items target set last_activity_at = now_at where target.id = item.id;
  event_id := private.write_work_item_event(
    item.id, 'comment_added', actor.id, 'comment', comment_id,
    null, jsonb_build_object('comment_id', comment_id), operation_id, now_at
  );
  perform private.write_work_item_notification(
    item.primary_assignee_id, actor.id, item.id, event_id, 'comment_added', now_at
  );
  result := jsonb_build_object('id', comment_id, 'work_item_id', item.id, 'created_at', now_at, 'last_activity_at', now_at);
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.edit_comment(
  comment_id uuid,
  body text,
  expected_edited_at timestamptz,
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
  comment public.comments;
  item public.work_items;
  revision_number integer;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'edit_comment', auth.uid(),
    jsonb_build_object('comment_id', comment_id, 'body', btrim(body), 'expected_edited_at', expected_edited_at), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;
  actor := private.require_profile(auth.uid(), false, false);
  select target.* into comment from public.comments target where target.id = comment_id for update;
  if comment.id is null or comment.withdrawn_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  item := private.lock_editable_work_item(comment.work_item_id, false);
  if actor.id <> comment.author_id then raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN'; end if;
  if coalesce(comment.edited_at, comment.created_at) is distinct from expected_edited_at then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;
  if btrim(body) = '' then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if comment.body = btrim(body) then
    return private.complete_operation(operation_id, jsonb_build_object('id', comment.id, 'edited_at', comment.edited_at, 'status', 'unchanged'));
  end if;
  select coalesce(max(target.revision_number), 0) + 1 into revision_number
  from public.comment_revisions target where target.comment_id = comment.id;
  insert into public.comment_revisions (
    comment_id, revision_number, previous_body, new_body, change_kind,
    changed_by, operation_id, changed_at
  ) values (
    comment.id, revision_number, comment.body, btrim(body), 'edit',
    actor.id, operation_id, now_at
  );
  update public.comments target set body = btrim(edit_comment.body), edited_at = now_at where target.id = comment.id;
  update public.work_items target set last_activity_at = now_at where target.id = item.id;
  perform private.write_work_item_event(
    item.id, 'comment_edited', actor.id, 'comment', comment.id,
    jsonb_build_object('revision', revision_number - 1), jsonb_build_object('revision', revision_number), operation_id, now_at
  );
  result := jsonb_build_object('id', comment.id, 'edited_at', now_at, 'revision', revision_number, 'last_activity_at', now_at);
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.withdraw_comment(
  comment_id uuid,
  expected_edited_at timestamptz,
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
  comment public.comments;
  item public.work_items;
  revision_number integer;
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'withdraw_comment', auth.uid(),
    jsonb_build_object('comment_id', comment_id, 'expected_edited_at', expected_edited_at), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;
  actor := private.require_profile(auth.uid(), false, false);
  select target.* into comment from public.comments target where target.id = comment_id for update;
  if comment.id is null or comment.withdrawn_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  item := private.lock_editable_work_item(comment.work_item_id, false);
  if actor.id <> comment.author_id and not private.can_moderate_comments() then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;
  if coalesce(comment.edited_at, comment.created_at) is distinct from expected_edited_at then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;
  select coalesce(max(target.revision_number), 0) + 1 into revision_number
  from public.comment_revisions target where target.comment_id = comment.id;
  insert into public.comment_revisions (
    comment_id, revision_number, previous_body, new_body, change_kind,
    changed_by, operation_id, changed_at
  ) values (
    comment.id, revision_number, comment.body, null, 'withdraw',
    actor.id, operation_id, now_at
  );
  update public.comments target set withdrawn_by = actor.id, withdrawn_at = now_at where target.id = comment.id;
  update public.work_items target set last_activity_at = now_at where target.id = item.id;
  perform private.write_work_item_event(
    item.id, 'comment_withdrawn', actor.id, 'comment', comment.id,
    jsonb_build_object('active', true), jsonb_build_object('active', false), operation_id, now_at
  );
  result := jsonb_build_object('id', comment.id, 'withdrawn_at', now_at, 'revision', revision_number, 'last_activity_at', now_at);
  return private.complete_operation(operation_id, result);
end;
$$;

revoke execute on function private.lock_editable_work_item(uuid, boolean) from public, anon, authenticated;
revoke all on function public.create_blocker(uuid, text, date, text, uuid) from public;
revoke all on function public.resolve_blocker(uuid, text, boolean, uuid) from public;
revoke all on function public.add_subtask(uuid, text, integer, timestamptz, uuid) from public;
revoke all on function public.rename_subtask(uuid, text, timestamptz, uuid) from public;
revoke all on function public.reorder_subtasks(uuid, uuid[], timestamptz, uuid) from public;
revoke all on function public.set_subtask_completion(uuid, boolean, boolean, uuid) from public;
revoke all on function public.withdraw_subtask(uuid, timestamptz, uuid) from public;
revoke all on function public.add_comment(uuid, text, uuid) from public;
revoke all on function public.edit_comment(uuid, text, timestamptz, uuid) from public;
revoke all on function public.withdraw_comment(uuid, timestamptz, uuid) from public;

grant execute on function public.create_blocker(uuid, text, date, text, uuid) to authenticated;
grant execute on function public.resolve_blocker(uuid, text, boolean, uuid) to authenticated;
grant execute on function public.add_subtask(uuid, text, integer, timestamptz, uuid) to authenticated;
grant execute on function public.rename_subtask(uuid, text, timestamptz, uuid) to authenticated;
grant execute on function public.reorder_subtasks(uuid, uuid[], timestamptz, uuid) to authenticated;
grant execute on function public.set_subtask_completion(uuid, boolean, boolean, uuid) to authenticated;
grant execute on function public.withdraw_subtask(uuid, timestamptz, uuid) to authenticated;
grant execute on function public.add_comment(uuid, text, uuid) to authenticated;
grant execute on function public.edit_comment(uuid, text, timestamptz, uuid) to authenticated;
grant execute on function public.withdraw_comment(uuid, timestamptz, uuid) to authenticated;

commit;
