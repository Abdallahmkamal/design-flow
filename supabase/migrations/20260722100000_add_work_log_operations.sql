-- Design Flow Phase 4, slice 1: atomic work-log mutations and recalculation.

begin;

create function private.recalculate_work_items(work_item_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
begin
  for target_id in
    select distinct value from unnest(coalesce(work_item_ids, array[]::uuid[])) value
    where value is not null order by value
  loop
    perform 1 from public.work_items where id = target_id for update;
    update public.work_items item set last_worked_on = (
      select max(entry.work_date)
      from public.work_log_batches batch
      join public.work_log_entries entry on entry.batch_id = batch.id
      where batch.work_item_id = item.id
        and batch.context_code = 'ticket'
        and batch.withdrawn_at is null
        and entry.withdrawn_at is null
    ) where item.id = target_id;
  end loop;
end;
$$;

create function private.assert_work_log_actor(actor public.profiles, worked_by_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if actor.position_code = 'viewer' then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;
  if actor.id <> worked_by_id and not (actor.is_admin or actor.position_code in ('lead', 'manager')) then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;
  if not private.is_work_attribution_eligible(worked_by_id) then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;
end;
$$;

create function public.submit_work_log(
  context_code text,
  work_item_id uuid,
  related_area_id uuid,
  worked_by uuid,
  entries jsonb,
  blocker jsonb default null,
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
  batch_id uuid;
  event_id uuid;
  blocker_id uuid;
  blocker_event_id uuid;
  now_at timestamptz := statement_timestamp();
  entry_count integer;
  normalized_worked_by uuid := coalesce(worked_by, auth.uid());
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'submit_work_log', auth.uid(),
    jsonb_build_object(
      'context_code', context_code, 'work_item_id', work_item_id,
      'related_area_id', related_area_id, 'worked_by', normalized_worked_by,
      'entries', entries, 'blocker', blocker
    ), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;

  actor := private.require_profile(auth.uid(), false, false);
  perform private.assert_work_log_actor(actor, normalized_worked_by);
  if context_code not in ('ticket', 'standalone_visual') or jsonb_typeof(entries) <> 'array' then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;
  entry_count := jsonb_array_length(entries);
  if entry_count not between 1 and 5 then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(entries) as entry(work_date date, work_type_code text, description text)
    left join public.work_type_definitions type on type.code = entry.work_type_code
    where entry.work_date is null or entry.work_date > private.current_team_date()
      or type.code is null or type.context_code <> submit_work_log.context_code
      or (entry.description is not null and btrim(entry.description) = '')
  ) then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;

  if context_code = 'ticket' then
    if related_area_id is not null or work_item_id is null then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
    select target.* into item from public.work_items target where target.id = work_item_id for update;
    if item.id is null then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
    if item.archived_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
    if blocker is not null and (
      jsonb_typeof(blocker) <> 'object'
      or nullif(btrim(blocker ->> 'reason'), '') is null
      or item.status_code not in ('todo', 'in_progress', 'in_review')
      or exists (select 1 from public.blockers target where target.work_item_id = item.id and target.resolved_at is null)
    ) then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  else
    if work_item_id is not null or blocker is not null then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
    if related_area_id is not null and not exists (
      select 1 from public.work_areas area where area.id = related_area_id and area.is_active
    ) then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  end if;

  insert into public.work_log_batches (
    context_code, work_item_id, related_area_id, worked_by, logged_by,
    created_at, create_operation_id
  ) values (
    context_code, work_item_id, related_area_id, normalized_worked_by, actor.id,
    now_at, operation_id
  ) returning id into batch_id;
  insert into public.work_log_entries (batch_id, work_date, work_type_code, description, position, created_at, updated_at)
  select batch_id,
    (entry.value ->> 'work_date')::date,
    entry.value ->> 'work_type_code',
    nullif(btrim(entry.value ->> 'description'), ''),
    entry.position::smallint, now_at, now_at
  from jsonb_array_elements(entries) with ordinality as entry(value, position);

  if context_code = 'ticket' then
    event_id := private.write_work_item_event(
      item.id, 'work_log_submitted', actor.id, 'work_log_batch', batch_id,
      null, jsonb_build_object('worked_by', normalized_worked_by, 'entry_count', entry_count), operation_id, now_at
    );
    if blocker is not null then
      insert into public.blockers (
        work_item_id, reason, blocked_by, blocked_at,
        expected_resolution_date, create_operation_id
      ) values (
        item.id, btrim(blocker ->> 'reason'), actor.id, now_at,
        nullif(blocker ->> 'expected_resolution_date', '')::date, operation_id
      ) returning id into blocker_id;
      blocker_event_id := private.write_work_item_event(
        item.id, 'blocker_created', actor.id, 'blocker', blocker_id, null,
        jsonb_build_object('expected_resolution_date', nullif(blocker ->> 'expected_resolution_date', '')::date), operation_id, now_at
      );
      perform private.write_work_item_notification(item.primary_assignee_id, actor.id, item.id, blocker_event_id, 'blocker_created', now_at);
    end if;
    update public.work_items set last_activity_at = now_at where id = item.id;
    perform private.recalculate_work_items(array[item.id]);
  end if;
  result := jsonb_build_object('id', batch_id, 'context_code', context_code, 'work_item_id', work_item_id, 'created_at', now_at, 'event_id', event_id, 'blocker_id', blocker_id);
  return private.complete_operation(operation_id, result);
end;
$$;

create function public.withdraw_work_log(
  batch_id uuid,
  expected_version timestamptz,
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
  batch public.work_log_batches;
  now_at timestamptz := statement_timestamp();
  revision_number integer;
begin
  operation := private.lock_or_create_operation(operation_id, 'withdraw_work_log', auth.uid(),
    jsonb_build_object('batch_id', batch_id, 'expected_version', expected_version), 'started');
  if operation.state = 'completed' then return operation.result; end if;
  actor := private.require_profile(auth.uid(), false, false);
  select target.* into batch from public.work_log_batches target where target.id = batch_id for update;
  if batch.id is null or batch.withdrawn_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  if coalesce(batch.edited_at, batch.created_at) is distinct from expected_version then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;
  if batch.worked_by <> actor.id and not (actor.is_admin or actor.position_code in ('lead', 'manager')) then raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN'; end if;
  select coalesce(max(target.revision_number), 0) + 1 into revision_number from public.work_log_batch_revisions target where target.batch_id = batch.id;
  insert into public.work_log_batch_revisions (batch_id, revision_number, previous_values, new_values, change_kind, changed_by, operation_id, changed_at)
  values (batch.id, revision_number, jsonb_build_object('withdrawn_at', null), jsonb_build_object('withdrawn_at', now_at), 'withdrawal', actor.id, operation_id, now_at);
  update public.work_log_batches set withdrawn_by = actor.id, withdrawn_at = now_at, edited_at = now_at where id = batch.id;
  if batch.work_item_id is not null then
    perform private.write_work_item_event(batch.work_item_id, 'work_log_withdrawn', actor.id, 'work_log_batch', batch.id, jsonb_build_object('active', true), jsonb_build_object('active', false), operation_id, now_at);
    update public.work_items set last_activity_at = now_at where id = batch.work_item_id;
    perform private.recalculate_work_items(array[batch.work_item_id]);
  end if;
  return private.complete_operation(operation_id, jsonb_build_object('id', batch.id, 'withdrawn_at', now_at, 'revision', revision_number));
end;
$$;

create function public.correct_work_log(
  batch_id uuid,
  expected_version timestamptz,
  context_code text,
  work_item_id uuid,
  related_area_id uuid,
  worked_by uuid,
  entries jsonb,
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
  batch public.work_log_batches;
  old_work_item_id uuid;
  target_item public.work_items;
  now_at timestamptz := statement_timestamp();
  batch_revision integer;
  entry_revision integer;
  entry_row public.work_log_entries;
  entry_value jsonb;
  entry_id uuid;
  entry_count integer;
begin
  operation := private.lock_or_create_operation(operation_id, 'correct_work_log', auth.uid(),
    jsonb_build_object('batch_id', batch_id, 'expected_version', expected_version,
      'context_code', context_code, 'work_item_id', work_item_id,
      'related_area_id', related_area_id, 'worked_by', worked_by, 'entries', entries), 'started');
  if operation.state = 'completed' then return operation.result; end if;
  actor := private.require_profile(auth.uid(), false, false);
  select target.* into batch from public.work_log_batches target where target.id = batch_id for update;
  if batch.id is null or batch.withdrawn_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  if coalesce(batch.edited_at, batch.created_at) is distinct from expected_version then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;
  perform private.assert_work_log_actor(actor, worked_by);
  if context_code not in ('ticket', 'standalone_visual') or jsonb_typeof(entries) <> 'array' then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  entry_count := jsonb_array_length(entries);
  if entry_count not between 1 and 5 then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if exists (
    select 1 from jsonb_array_elements(entries) value
    left join public.work_type_definitions type on type.code = value ->> 'work_type_code'
    where nullif(value ->> 'work_date', '') is null
      or (value ->> 'work_date')::date > private.current_team_date()
      or type.code is null or type.context_code <> correct_work_log.context_code
      or (value ? 'description' and value ->> 'description' = '')
      or (value ? 'id' and not exists (select 1 from public.work_log_entries entry where entry.id = (value ->> 'id')::uuid and entry.batch_id = batch.id and entry.withdrawn_at is null))
  ) then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if context_code = 'ticket' then
    if work_item_id is null or related_area_id is not null then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
    select target.* into target_item from public.work_items target where target.id = work_item_id for update;
    if target_item.id is null then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
    if target_item.archived_at is not null and target_item.id is distinct from batch.work_item_id then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  elsif work_item_id is not null or (related_area_id is not null and not exists (select 1 from public.work_areas area where area.id = related_area_id and area.is_active)) then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;
  old_work_item_id := batch.work_item_id;
  select coalesce(max(target.revision_number), 0) + 1 into batch_revision from public.work_log_batch_revisions target where target.batch_id = batch.id;
  insert into public.work_log_batch_revisions (batch_id, revision_number, previous_values, new_values, change_kind, changed_by, operation_id, changed_at)
  values (batch.id, batch_revision,
    jsonb_build_object('context_code', batch.context_code, 'work_item_id', batch.work_item_id, 'related_area_id', batch.related_area_id, 'worked_by', batch.worked_by),
    jsonb_build_object('context_code', context_code, 'work_item_id', work_item_id, 'related_area_id', related_area_id, 'worked_by', worked_by),
    'correction', actor.id, operation_id, now_at);
  for entry_row in select * from public.work_log_entries entry where entry.batch_id = batch.id and entry.withdrawn_at is null for update loop
    if not exists (select 1 from jsonb_array_elements(entries) value where value ->> 'id' = entry_row.id::text) then
      select coalesce(max(target.revision_number), 0) + 1 into entry_revision from public.work_log_entry_revisions target where target.entry_id = entry_row.id;
      insert into public.work_log_entry_revisions (entry_id, revision_number, previous_values, new_values, change_kind, changed_by, operation_id, changed_at)
      values (entry_row.id, entry_revision, jsonb_build_object('work_date', entry_row.work_date, 'work_type_code', entry_row.work_type_code, 'description', entry_row.description), jsonb_build_object('withdrawn_at', now_at), 'correction', actor.id, operation_id, now_at);
      update public.work_log_entries set withdrawn_by = actor.id, withdrawn_at = now_at, updated_at = now_at where id = entry_row.id;
    end if;
  end loop;
  for entry_value in select value from jsonb_array_elements(entries) value loop
    entry_id := nullif(entry_value ->> 'id', '')::uuid;
    if entry_id is null then
      insert into public.work_log_entries (batch_id, work_date, work_type_code, description, position, created_at, updated_at)
      values (batch.id, (entry_value ->> 'work_date')::date, entry_value ->> 'work_type_code', nullif(btrim(entry_value ->> 'description'), ''), (select count(*) + 1 from public.work_log_entries entry where entry.batch_id = batch.id and entry.withdrawn_at is null)::smallint, now_at, now_at);
    else
      select * into entry_row from public.work_log_entries where id = entry_id for update;
      if entry_row.work_date is distinct from (entry_value ->> 'work_date')::date or entry_row.work_type_code is distinct from entry_value ->> 'work_type_code' or entry_row.description is distinct from nullif(btrim(entry_value ->> 'description'), '') then
        select coalesce(max(target.revision_number), 0) + 1 into entry_revision from public.work_log_entry_revisions target where target.entry_id = entry_row.id;
        insert into public.work_log_entry_revisions (entry_id, revision_number, previous_values, new_values, change_kind, changed_by, operation_id, changed_at)
        values (entry_row.id, entry_revision, jsonb_build_object('work_date', entry_row.work_date, 'work_type_code', entry_row.work_type_code, 'description', entry_row.description), jsonb_build_object('work_date', entry_value ->> 'work_date', 'work_type_code', entry_value ->> 'work_type_code', 'description', nullif(btrim(entry_value ->> 'description'), '')), 'correction', actor.id, operation_id, now_at);
        update public.work_log_entries set work_date = (entry_value ->> 'work_date')::date, work_type_code = entry_value ->> 'work_type_code', description = nullif(btrim(entry_value ->> 'description'), ''), updated_at = now_at where id = entry_row.id;
      end if;
    end if;
  end loop;
  update public.work_log_batches set context_code = correct_work_log.context_code, work_item_id = correct_work_log.work_item_id, related_area_id = correct_work_log.related_area_id, worked_by = correct_work_log.worked_by, edited_at = now_at where id = batch.id;
  if old_work_item_id is not null then
    perform private.write_work_item_event(old_work_item_id, 'work_log_corrected', actor.id, 'work_log_batch', batch.id, null, null, operation_id, now_at);
    update public.work_items set last_activity_at = now_at where id = old_work_item_id;
  end if;
  if work_item_id is not null and work_item_id is distinct from old_work_item_id then
    perform private.write_work_item_event(work_item_id, 'work_log_corrected', actor.id, 'work_log_batch', batch.id, null, null, operation_id, now_at);
    update public.work_items set last_activity_at = now_at where id = work_item_id;
  end if;
  perform private.recalculate_work_items(array[old_work_item_id, work_item_id]);
  return private.complete_operation(operation_id, jsonb_build_object('id', batch.id, 'edited_at', now_at, 'revision', batch_revision));
end;
$$;

create function public.get_work_log_batch(target_batch_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  batch public.work_log_batches;
begin
  actor := private.require_application_user_read();
  select target.* into batch from public.work_log_batches target where target.id = target_batch_id;
  if batch.id is null or batch.withdrawn_at is not null then return null; end if;
  return jsonb_build_object(
    'id', batch.id, 'context', batch.context_code, 'workItemId', batch.work_item_id,
    'relatedAreaId', batch.related_area_id, 'workedBy', batch.worked_by,
    'loggedBy', batch.logged_by, 'createdAt', batch.created_at, 'editedAt', batch.edited_at,
    'version', coalesce(batch.edited_at, batch.created_at),
    'entries', coalesce((select jsonb_agg(jsonb_build_object(
      'id', entry.id, 'workDate', entry.work_date, 'workTypeCode', entry.work_type_code,
      'description', entry.description, 'position', entry.position
    ) order by entry.position) from public.work_log_entries entry where entry.batch_id = batch.id and entry.withdrawn_at is null), '[]'::jsonb),
    'canCorrect', batch.worked_by = actor.id or actor.is_admin or actor.position_code in ('lead', 'manager'),
    'canWithdraw', batch.worked_by = actor.id or actor.is_admin or actor.position_code in ('lead', 'manager')
  );
end;
$$;

revoke execute on function private.recalculate_work_items(uuid[]) from public, anon, authenticated;
revoke execute on function private.assert_work_log_actor(public.profiles, uuid) from public, anon, authenticated;
revoke all on function public.submit_work_log(text, uuid, uuid, uuid, jsonb, jsonb, uuid) from public;
revoke all on function public.withdraw_work_log(uuid, timestamptz, uuid) from public;
revoke all on function public.correct_work_log(uuid, timestamptz, text, uuid, uuid, uuid, jsonb, uuid) from public;
revoke all on function public.get_work_log_batch(uuid) from public;
grant execute on function public.submit_work_log(text, uuid, uuid, uuid, jsonb, jsonb, uuid) to authenticated;
grant execute on function public.withdraw_work_log(uuid, timestamptz, uuid) to authenticated;
grant execute on function public.correct_work_log(uuid, timestamptz, text, uuid, uuid, uuid, jsonb, uuid) to authenticated;
grant execute on function public.get_work_log_batch(uuid) to authenticated;

commit;
