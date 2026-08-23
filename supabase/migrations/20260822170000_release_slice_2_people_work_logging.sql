-- Design Flow release Slice 2: people, avatars, and work-log correction.

begin;

alter table public.profiles
  add column avatar_path text;

alter table public.profiles
  add constraint profiles_avatar_path_format check (
    avatar_path is null
    or avatar_path ~ ('^' || id::text || '/[0-9a-f-]+\.(jpg|jpeg|png|webp)$')
  );

grant select (avatar_path) on public.profiles to authenticated;

insert into public.admin_audit_event_types(code)
values ('display_name_changed'), ('avatar_changed');

create or replace view public.admin_member_directory
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
  ) as access_administered_at,
  profile.avatar_path
from public.profiles profile
join public.position_definitions position
  on position.code = profile.position_code
join auth.users auth_user on auth_user.id = profile.id
left join public.profiles supervisor
  on supervisor.id = profile.current_reports_to_id
where private.can_manage_settings();

create function public.update_member_profile(
  target_profile_id uuid,
  display_name text,
  avatar_path text,
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
  target public.profiles;
  normalized_name text := btrim(display_name);
  normalized_avatar text := nullif(btrim(avatar_path), '');
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id,
    'update_member_profile',
    auth.uid(),
    jsonb_build_object(
      'target_profile_id', target_profile_id,
      'display_name', normalized_name,
      'avatar_path', normalized_avatar,
      'expected_updated_at', expected_updated_at
    ),
    'started'
  );
  if operation.state = 'completed' then return operation.result; end if;

  actor := private.require_admin(auth.uid());
  select profile.* into target
  from public.profiles profile
  where profile.id = target_profile_id
  for update;

  if target.id is null or normalized_name = '' or char_length(normalized_name) > 160 then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;
  if target.updated_at is distinct from expected_updated_at then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end if;
  if normalized_avatar is not null
    and normalized_avatar !~ ('^' || target.id::text || '/[0-9a-f-]+\.(jpg|jpeg|png|webp)$')
  then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if target.display_name is not distinct from normalized_name
    and target.avatar_path is not distinct from normalized_avatar
  then
    return private.complete_operation(operation_id, jsonb_build_object(
      'target_profile_id', target.id,
      'display_name', target.display_name,
      'avatar_path', target.avatar_path,
      'updated_at', target.updated_at,
      'status', 'unchanged'
    ));
  end if;

  update public.profiles
  set display_name = normalized_name,
      avatar_path = normalized_avatar,
      updated_at = now_at
  where id = target.id;

  if target.display_name is distinct from normalized_name then
    perform private.write_admin_audit(
      'display_name_changed', actor.id, 'profile', target.id,
      jsonb_build_object('display_name', target.display_name),
      jsonb_build_object('display_name', normalized_name),
      operation_id
    );
  end if;
  if target.avatar_path is distinct from normalized_avatar then
    perform private.write_admin_audit(
      'avatar_changed', actor.id, 'profile', target.id,
      jsonb_build_object('avatar_path', target.avatar_path),
      jsonb_build_object('avatar_path', normalized_avatar),
      operation_id
    );
  end if;

  result := jsonb_build_object(
    'target_profile_id', target.id,
    'display_name', normalized_name,
    'avatar_path', normalized_avatar,
    'updated_at', now_at,
    'status', 'updated'
  );
  return private.complete_operation(operation_id, result);
end;
$$;

revoke all on function public.update_member_profile(uuid, text, text, timestamptz, uuid) from public;
grant execute on function public.update_member_profile(uuid, text, text, timestamptz, uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Authorized users read profile avatars"
on storage.objects for select to authenticated
using (bucket_id = 'profile-avatars' and private.is_application_user());

create policy "Admins upload profile avatars"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-avatars'
  and private.can_manage_settings()
  and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
);

create policy "Admins replace profile avatars"
on storage.objects for update to authenticated
using (bucket_id = 'profile-avatars' and private.can_manage_settings())
with check (bucket_id = 'profile-avatars' and private.can_manage_settings());

create policy "Admins remove profile avatars"
on storage.objects for delete to authenticated
using (bucket_id = 'profile-avatars' and private.can_manage_settings());

-- Password reset readiness remains an actor/login gate. It is no longer a
-- target-member eligibility requirement for assignment, hierarchy, or work.
do $$
declare definition text;
begin
  select pg_get_functiondef('private.assert_requested_access(text,boolean,uuid,uuid)'::regprocedure) into definition;
  if strpos(definition, 'or supervisor.must_change_password') = 0 then
    raise exception 'Unexpected assert_requested_access definition';
  end if;
  execute replace(definition, 'supervisor.must_change_password', 'false');

  select pg_get_functiondef('public.create_work_item(text,text,uuid,uuid,date,date,text,uuid[],uuid)'::regprocedure) into definition;
  if strpos(definition, 'or assignee.must_change_password') = 0 then
    raise exception 'Unexpected create_work_item definition';
  end if;
  execute replace(definition, 'assignee.must_change_password', 'false');

  select pg_get_functiondef('public.reassign_work_item(uuid,uuid,uuid,timestamptz,uuid)'::regprocedure) into definition;
  if strpos(definition, 'or assignee.must_change_password') = 0 then
    raise exception 'Unexpected reassign_work_item definition';
  end if;
  execute replace(definition, 'assignee.must_change_password', 'false');

  select pg_get_functiondef('public.set_member_access(uuid,text,boolean,uuid,timestamptz,jsonb,uuid)'::regprocedure) into definition;
  if strpos(definition, 'or new_assignee.must_change_password') = 0 then
    raise exception 'Unexpected set_member_access definition';
  end if;
  execute replace(definition, 'new_assignee.must_change_password', 'false');

  select pg_get_functiondef('public.prepare_member_deactivation(uuid,uuid,jsonb,jsonb,uuid)'::regprocedure) into definition;
  if strpos(definition, 'or new_supervisor.must_change_password') = 0
    or strpos(definition, 'or new_assignee.must_change_password') = 0 then
    raise exception 'Unexpected prepare_member_deactivation definition';
  end if;
  definition := replace(definition, 'new_supervisor.must_change_password', 'false');
  definition := replace(definition, 'new_assignee.must_change_password', 'false');
  execute definition;

  select pg_get_functiondef('private.assert_work_log_state()'::regprocedure) into definition;
  if strpos(definition, 'and not logger.must_change_password') = 0 then
    raise exception 'Unexpected assert_work_log_state definition';
  end if;
  execute replace(
    definition,
    'not logger.must_change_password',
    '(not logger.must_change_password or (
      tg_op = ''UPDATE'' and (
        (tg_table_name = ''work_log_batches'' and batch.logged_by = (to_jsonb(old) ->> ''logged_by'')::uuid)
        or tg_table_name = ''work_log_entries''
      )
    ))'
  );
end;
$$;

create function public.get_work_log_entry(target_entry_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  entry public.work_log_entries;
  batch public.work_log_batches;
begin
  actor := private.require_application_user_read();
  select target.* into entry
  from public.work_log_entries target
  where target.id = target_entry_id;
  if entry.id is null or entry.withdrawn_at is not null then return null; end if;

  select target.* into batch
  from public.work_log_batches target
  where target.id = entry.batch_id;
  if batch.id is null or batch.withdrawn_at is not null then return null; end if;

  return jsonb_build_object(
    'id', entry.id,
    'batchId', batch.id,
    'context', batch.context_code,
    'workItemId', batch.work_item_id,
    'workedBy', batch.worked_by,
    'workDate', entry.work_date,
    'workTypeCode', entry.work_type_code,
    'description', entry.description,
    'position', entry.position,
    'version', entry.updated_at,
    'canCorrect', batch.worked_by = actor.id
      or actor.is_admin
      or actor.position_code in ('lead', 'manager')
  );
end;
$$;

create function public.correct_work_log_entry(
  entry_id uuid,
  expected_version timestamptz,
  work_date date,
  work_type_code text,
  description text,
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
  entry public.work_log_entries;
  type_definition public.work_type_definitions;
  normalized_description text := nullif(btrim(description), '');
  now_at timestamptz := statement_timestamp();
  revision_number integer;
  previous_values jsonb;
  new_values jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id,
    'correct_work_log_entry',
    auth.uid(),
    jsonb_build_object(
      'entry_id', entry_id,
      'expected_version', expected_version,
      'work_date', work_date,
      'work_type_code', work_type_code,
      'description', normalized_description
    ),
    'started'
  );
  if operation.state = 'completed' then return operation.result; end if;

  actor := private.require_profile(auth.uid(), false, false);
  select target.* into entry
  from public.work_log_entries target
  where target.id = entry_id
  for update;
  if entry.id is null or entry.withdrawn_at is not null then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;
  select target.* into batch
  from public.work_log_batches target
  where target.id = entry.batch_id
  for update;
  if batch.id is null or batch.withdrawn_at is not null then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;
  if entry.updated_at is distinct from expected_version then
    raise exception using errcode = 'P0001', message = 'DF_CONFLICT';
  end if;
  if batch.worked_by <> actor.id
    and not (actor.is_admin or actor.position_code in ('lead', 'manager'))
  then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;
  select definition.* into type_definition
  from public.work_type_definitions definition
  where definition.code = work_type_code;
  if work_date is null or work_date > private.current_team_date()
    or type_definition.code is null
    or type_definition.context_code <> batch.context_code
  then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  previous_values := jsonb_build_object(
    'work_date', entry.work_date,
    'work_type_code', entry.work_type_code,
    'description', entry.description
  );
  new_values := jsonb_build_object(
    'work_date', work_date,
    'work_type_code', work_type_code,
    'description', normalized_description
  );
  if previous_values = new_values then
    return private.complete_operation(operation_id, jsonb_build_object(
      'id', entry.id, 'batch_id', batch.id, 'updated_at', entry.updated_at,
      'status', 'unchanged'
    ));
  end if;

  select coalesce(max(revision.revision_number), 0) + 1
  into revision_number
  from public.work_log_entry_revisions revision
  where revision.entry_id = entry.id;

  insert into public.work_log_entry_revisions (
    entry_id, revision_number, previous_values, new_values,
    change_kind, changed_by, operation_id, changed_at
  ) values (
    entry.id, revision_number, previous_values, new_values,
    'correction', actor.id, operation_id, now_at
  );

  update public.work_log_entries
  set work_date = correct_work_log_entry.work_date,
      work_type_code = correct_work_log_entry.work_type_code,
      description = normalized_description,
      updated_at = now_at
  where id = entry.id;
  update public.work_log_batches set edited_at = now_at where id = batch.id;

  if batch.work_item_id is not null then
    perform private.write_work_item_event(
      batch.work_item_id,
      'work_log_corrected',
      actor.id,
      'work_log_entry',
      entry.id,
      jsonb_build_object(
        'work_date', entry.work_date,
        'work_type_code', entry.work_type_code,
        'description_changed', entry.description is distinct from normalized_description
      ),
      jsonb_build_object(
        'work_date', work_date,
        'work_type_code', work_type_code,
        'description_changed', entry.description is distinct from normalized_description
      ),
      operation_id,
      now_at
    );
    update public.work_items set last_activity_at = now_at
    where id = batch.work_item_id;
    perform private.recalculate_work_items(array[batch.work_item_id]);
  end if;

  return private.complete_operation(operation_id, jsonb_build_object(
    'id', entry.id,
    'batch_id', batch.id,
    'updated_at', now_at,
    'revision', revision_number,
    'status', 'updated'
  ));
end;
$$;

revoke all on function public.get_work_log_entry(uuid) from public;
revoke all on function public.correct_work_log_entry(uuid, timestamptz, date, text, text, uuid) from public;
grant execute on function public.get_work_log_entry(uuid) to authenticated;
grant execute on function public.correct_work_log_entry(uuid, timestamptz, date, text, text, uuid) to authenticated;

comment on function public.correct_work_log_entry(uuid, timestamptz, date, text, text, uuid) is
  'Corrects one stable work-log entry only. Attribution, context, siblings, status, and subtasks are immutable.';

commit;
