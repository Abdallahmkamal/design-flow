-- Design Flow Phase 2 authentication and account-lifecycle slice.
--
-- This migration implements only the approved identity/account operations.
-- Team directory, set_member_access, controlled-list, timezone, and Settings
-- mutations remain outside this branch.

begin;

create function private.hash_operation_payload(payload jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(payload::text, 'sha256'), 'hex');
$$;

create function private.lock_or_create_operation(
  operation_id uuid,
  operation_code text,
  actor_id uuid,
  request_payload jsonb,
  initial_state text
)
returns public.operation_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.operation_requests;
  request_hash text := private.hash_operation_payload(request_payload);
begin
  select * into existing
  from public.operation_requests request
  where request.id = operation_id
  for update;

  if existing.id is not null then
    if existing.operation_code <> operation_code
      or existing.actor_id is distinct from actor_id
      or existing.request_hash <> request_hash
    then
      raise exception using errcode = 'P0001', message = 'DF_IDEMPOTENCY_MISMATCH';
    end if;

    return existing;
  end if;

  insert into public.operation_requests (
    id,
    operation_code,
    actor_id,
    request_hash,
    state
  ) values (
    operation_id,
    operation_code,
    actor_id,
    request_hash,
    initial_state
  )
  returning * into existing;

  return existing;
end;
$$;

create function private.complete_operation(
  operation_id uuid,
  operation_result jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.operation_requests
  set
    state = 'completed',
    result = operation_result,
    updated_at = statement_timestamp(),
    completed_at = statement_timestamp()
  where id = operation_id;

  return operation_result;
end;
$$;

create function private.require_profile(
  profile_id uuid,
  allow_password_restricted boolean default false,
  allow_inactive boolean default false
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
begin
  if profile_id is null then
    raise exception using errcode = 'P0001', message = 'DF_AUTH_REQUIRED';
  end if;

  select * into actor
  from public.profiles profile
  where profile.id = profile_id
  for update;

  if actor.id is null then
    raise exception using errcode = 'P0001', message = 'DF_AUTH_REQUIRED';
  end if;

  if not allow_inactive and not actor.is_active then
    raise exception using errcode = 'P0001', message = 'DF_ACCOUNT_INACTIVE';
  end if;

  if not allow_password_restricted and actor.must_change_password then
    raise exception using errcode = 'P0001', message = 'DF_PASSWORD_CHANGE_REQUIRED';
  end if;

  if actor.position_code = 'viewer' and actor.is_admin then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_VIEWER_ADMIN';
  end if;

  return actor;
end;
$$;

create function private.require_admin(profile_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
begin
  actor := private.require_profile(profile_id, false, false);

  if not actor.is_admin or actor.position_code = 'viewer' then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;

  return actor;
end;
$$;

create function private.assert_requested_access(
  position_code text,
  admin_state boolean,
  supervisor_id uuid,
  target_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  definition public.position_definitions;
  supervisor public.profiles;
begin
  select * into definition
  from public.position_definitions position
  where position.code = position_code
    and position.is_selectable;

  if definition.code is null then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if admin_state and not definition.admin_eligible then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_VIEWER_ADMIN';
  end if;

  if position_code in ('designer', 'lead') then
    if supervisor_id is null or supervisor_id = target_id then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;

    select * into supervisor
    from public.profiles profile
    where profile.id = supervisor_id
    for share;

    if supervisor.id is null
      or not supervisor.is_active
      or supervisor.must_change_password
      or (position_code = 'designer' and supervisor.position_code <> 'lead')
      or (position_code = 'lead' and supervisor.position_code <> 'manager')
    then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
  elsif supervisor_id is not null then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;
end;
$$;

create function public.get_own_account_state()
returns table (
  id uuid,
  display_name text,
  position_code text,
  is_admin boolean,
  is_active boolean,
  must_change_password boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.id,
    profile.display_name,
    profile.position_code,
    profile.is_admin,
    profile.is_active,
    profile.must_change_password
  from public.profiles profile
  where profile.id = auth.uid();
$$;

create function public.get_edge_operation_result(
  operation_id uuid,
  operation_code text,
  request_payload jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  existing public.operation_requests;
begin
  select * into existing
  from public.operation_requests request
  where request.id = operation_id;

  if existing.id is null then
    return null;
  end if;

  if existing.operation_code <> operation_code
    or existing.request_hash <> private.hash_operation_payload(request_payload)
  then
    raise exception using errcode = 'P0001', message = 'DF_IDEMPOTENCY_MISMATCH';
  end if;

  return jsonb_build_object(
    'state', existing.state,
    'result', existing.result
  );
end;
$$;

create function public.finalize_first_admin_bootstrap(
  auth_user_id uuid,
  display_name text,
  email text,
  timezone text,
  operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  operation public.operation_requests;
  bootstrap public.bootstrap_state;
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id,
    'bootstrap_first_admin',
    null,
    jsonb_build_object(
      'display_name', btrim(display_name),
      'email', lower(btrim(email)),
      'timezone', timezone
    ),
    'started'
  );

  if operation.state = 'completed' then
    return operation.result;
  end if;

  if btrim(display_name) = ''
    or btrim(email) = ''
    or not private.is_valid_iana_timezone(timezone)
  then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  select * into bootstrap
  from public.bootstrap_state state
  where state.singleton_key
  for update;

  if bootstrap.consumed_at is not null
    or exists (
      select 1 from public.profiles profile
      where profile.is_active and profile.is_admin
    )
  then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  insert into public.profiles (
    id,
    email,
    display_name,
    position_code,
    is_admin,
    is_active,
    must_change_password,
    current_reports_to_id,
    created_by
  ) values (
    auth_user_id,
    lower(btrim(email)),
    btrim(display_name),
    'manager',
    true,
    true,
    true,
    null,
    null
  );

  insert into public.profile_access_periods (
    profile_id,
    position_code,
    is_admin,
    is_active,
    started_at,
    changed_by,
    start_operation_id
  ) values (
    auth_user_id,
    'manager',
    true,
    true,
    statement_timestamp(),
    null,
    operation_id
  );

  update public.team_settings
  set
    timezone = finalize_first_admin_bootstrap.timezone,
    updated_by = auth_user_id,
    updated_at = statement_timestamp()
  where singleton_key;

  update public.bootstrap_state
  set
    consumed_at = statement_timestamp(),
    first_admin_profile_id = auth_user_id,
    operation_id = finalize_first_admin_bootstrap.operation_id
  where singleton_key;

  insert into public.admin_audit_events (
    event_type_code,
    actor_id,
    subject_type,
    subject_id,
    new_values,
    operation_id
  ) values (
    'bootstrap_completed',
    null,
    'portal',
    null,
    jsonb_build_object(
      'profile_id', auth_user_id,
      'position_code', 'manager',
      'is_admin', true,
      'timezone', timezone
    ),
    operation_id
  );

  result := jsonb_build_object(
    'profile_id', auth_user_id,
    'email', lower(btrim(email)),
    'status', 'created'
  );

  return private.complete_operation(operation_id, result);
end;
$$;

create function public.prepare_first_admin_credential_recovery(
  email text,
  operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  operation public.operation_requests;
  bootstrap public.bootstrap_state;
  target public.profiles;
  operation_result jsonb;
begin
  select * into bootstrap
  from public.bootstrap_state state
  where state.singleton_key
  for update;

  select * into target
  from public.profiles profile
  where profile.id = bootstrap.first_admin_profile_id
  for update;

  if bootstrap.consumed_at is null
    or target.id is null
    or not target.is_active
    or not target.is_admin
    or target.position_code <> 'manager'
    or target.email <> lower(btrim(email))
  then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  operation := private.lock_or_create_operation(
    operation_id,
    'recover_first_admin_credential',
    target.id,
    jsonb_build_object('email', lower(btrim(email))),
    'pending_external'
  );

  if operation.state = 'completed' then
    return jsonb_build_object(
      'operation_state', 'completed',
      'result', operation.result
    );
  end if;

  if operation.result is not null then
    return jsonb_build_object(
      'operation_state', 'pending_external',
      'result', operation.result
    );
  end if;

  if not target.must_change_password then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  if exists (
    select 1
    from public.operation_requests request
    where request.operation_code = 'recover_first_admin_credential'
      and request.id <> operation_id
  ) then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  operation_result := jsonb_build_object(
    'profile_id', target.id,
    'email', target.email,
    'status', 'pending_external'
  );

  update public.operation_requests
  set
    result = operation_result,
    updated_at = statement_timestamp()
  where id = operation_id;

  return jsonb_build_object(
    'operation_state', 'pending_external',
    'result', operation_result
  );
end;
$$;

create function public.finalize_first_admin_credential_recovery(
  operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  operation public.operation_requests;
  target public.profiles;
  result jsonb;
begin
  select * into operation
  from public.operation_requests request
  where request.id = operation_id
  for update;

  if operation.id is null
    or operation.operation_code <> 'recover_first_admin_credential'
  then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  if operation.state = 'completed' then
    return operation.result;
  end if;

  select * into target
  from public.profiles profile
  where profile.id = (operation.result ->> 'profile_id')::uuid
  for update;

  if target.id is null or not target.is_active or not target.must_change_password then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  insert into public.admin_audit_events (
    event_type_code,
    actor_id,
    subject_type,
    subject_id,
    new_values,
    operation_id
  ) values (
    'bootstrap_completed',
    null,
    'portal',
    null,
    jsonb_build_object(
      'profile_id', target.id,
      'credential_recovery', true
    ),
    operation_id
  );

  result := jsonb_build_object(
    'profile_id', target.id,
    'email', target.email,
    'status', 'recovered'
  );

  return private.complete_operation(operation_id, result);
end;
$$;

create function public.finalize_member_account_creation(
  actor_profile_id uuid,
  auth_user_id uuid,
  display_name text,
  email text,
  position_code text,
  is_admin boolean,
  supervisor_id uuid,
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
  result jsonb;
begin
  actor := private.require_admin(actor_profile_id);

  operation := private.lock_or_create_operation(
    operation_id,
    'create_member_account',
    actor.id,
    jsonb_build_object(
      'display_name', btrim(display_name),
      'email', lower(btrim(email)),
      'position_code', position_code,
      'is_admin', is_admin,
      'supervisor_id', supervisor_id
    ),
    'started'
  );

  if operation.state = 'completed' then
    return operation.result;
  end if;

  if btrim(display_name) = '' or btrim(email) = '' then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  perform private.assert_requested_access(
    position_code,
    is_admin,
    supervisor_id,
    auth_user_id
  );

  insert into public.profiles (
    id,
    email,
    display_name,
    position_code,
    is_admin,
    is_active,
    must_change_password,
    current_reports_to_id,
    created_by
  ) values (
    auth_user_id,
    lower(btrim(email)),
    btrim(display_name),
    position_code,
    is_admin,
    true,
    true,
    supervisor_id,
    actor.id
  );

  insert into public.profile_access_periods (
    profile_id,
    position_code,
    is_admin,
    is_active,
    started_at,
    changed_by,
    start_operation_id
  ) values (
    auth_user_id,
    position_code,
    is_admin,
    true,
    statement_timestamp(),
    actor.id,
    operation_id
  );

  if supervisor_id is not null then
    insert into public.reporting_line_assignments (
      person_id,
      supervisor_id,
      started_on,
      assigned_by,
      start_operation_id
    ) values (
      auth_user_id,
      supervisor_id,
      private.current_team_date(),
      actor.id,
      operation_id
    );
  end if;

  insert into public.admin_audit_events (
    event_type_code,
    actor_id,
    subject_type,
    subject_id,
    new_values,
    operation_id
  ) values (
    'account_created',
    actor.id,
    'profile',
    auth_user_id,
    jsonb_build_object(
      'display_name', btrim(display_name),
      'position_code', position_code,
      'is_admin', is_admin,
      'supervisor_id', supervisor_id,
      'is_active', true,
      'must_change_password', true
    ),
    operation_id
  );

  if supervisor_id is not null then
    insert into public.admin_audit_events (
      event_type_code,
      actor_id,
      subject_type,
      subject_id,
      previous_values,
      new_values,
      operation_id
    ) values (
      'reporting_line_changed',
      actor.id,
      'profile',
      auth_user_id,
      jsonb_build_object('supervisor_id', null),
      jsonb_build_object('supervisor_id', supervisor_id),
      operation_id
    );
  end if;

  result := jsonb_build_object(
    'profile_id', auth_user_id,
    'status', 'created'
  );

  return private.complete_operation(operation_id, result);
end;
$$;

create function public.prepare_temporary_password_reset(
  actor_profile_id uuid,
  target_profile_id uuid,
  operation_id uuid
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
  operation_result jsonb;
begin
  actor := private.require_admin(actor_profile_id);

  operation := private.lock_or_create_operation(
    operation_id,
    'issue_temporary_password_reset',
    actor.id,
    jsonb_build_object('target_profile_id', target_profile_id),
    'pending_external'
  );

  if operation.state = 'completed' then
    return jsonb_build_object(
      'operation_state', 'completed',
      'result', operation.result
    );
  end if;

  if operation.state = 'pending_external' and operation.result is not null then
    return jsonb_build_object(
      'operation_state', 'pending_external',
      'result', operation.result
    );
  end if;

  select * into target
  from public.profiles profile
  where profile.id = target_profile_id
  for update;

  if target.id is null then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  update public.profiles
  set
    must_change_password = true,
    updated_at = statement_timestamp()
  where id = target.id;

  operation_result := jsonb_build_object(
    'target_profile_id', target.id,
    'status', 'pending_external'
  );

  update public.operation_requests
  set
    result = operation_result,
    updated_at = statement_timestamp()
  where id = operation_id;

  return jsonb_build_object(
    'operation_state', 'pending_external',
    'result', operation_result
  );
end;
$$;

create function public.finalize_temporary_password_reset(
  actor_profile_id uuid,
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
  target_profile_id uuid;
  result jsonb;
begin
  actor := private.require_admin(actor_profile_id);

  select * into operation
  from public.operation_requests request
  where request.id = operation_id
  for update;

  if operation.id is null
    or operation.operation_code <> 'issue_temporary_password_reset'
    or operation.actor_id <> actor.id
  then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  if operation.state = 'completed' then
    return operation.result;
  end if;

  target_profile_id := (operation.result ->> 'target_profile_id')::uuid;

  insert into public.admin_audit_events (
    event_type_code,
    actor_id,
    subject_type,
    subject_id,
    new_values,
    operation_id
  ) values (
    'password_reset_issued',
    actor.id,
    'profile',
    target_profile_id,
    jsonb_build_object('must_change_password', true),
    operation_id
  );

  result := jsonb_build_object(
    'target_profile_id', target_profile_id,
    'status', 'completed'
  );

  return private.complete_operation(operation_id, result);
end;
$$;

create function public.prepare_member_deactivation(
  actor_profile_id uuid,
  target_profile_id uuid,
  reporting_replacements jsonb default '[]'::jsonb,
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
  current_date date := private.current_team_date();
  now_at timestamptz := statement_timestamp();
  dependent record;
  replacement record;
  item record;
  new_supervisor public.profiles;
  new_assignee public.profiles;
  event_id uuid;
  operation_result jsonb;
begin
  actor := private.require_admin(actor_profile_id);

  if jsonb_typeof(reporting_replacements) <> 'array'
    or jsonb_typeof(assignment_replacements) <> 'array'
  then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  operation := private.lock_or_create_operation(
    operation_id,
    'deactivate_member_account',
    actor.id,
    jsonb_build_object(
      'target_profile_id', target_profile_id,
      'reporting_replacements', reporting_replacements,
      'assignment_replacements', assignment_replacements
    ),
    'pending_external'
  );

  if operation.state = 'completed' then
    return jsonb_build_object(
      'operation_state', 'completed',
      'result', operation.result
    );
  end if;

  if operation.state = 'pending_external' and operation.result is not null then
    return jsonb_build_object(
      'operation_state', 'pending_external',
      'result', operation.result
    );
  end if;

  select * into target
  from public.profiles profile
  where profile.id = target_profile_id
  for update;

  if target.id is null or not target.is_active then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  perform profile.id
  from public.profiles profile
  where profile.is_active and profile.is_admin
  order by profile.id
  for update;

  if target.is_admin and (
    select count(*) from public.profiles profile
    where profile.is_active and profile.is_admin
  ) <= 1 then
    raise exception using errcode = 'P0001', message = 'DF_FINAL_ADMIN';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(reporting_replacements) left_item
    join jsonb_array_elements(reporting_replacements) right_item
      on left_item <> right_item
      and left_item ->> 'person_id' = right_item ->> 'person_id'
  ) or exists (
    select 1
    from jsonb_array_elements(assignment_replacements) left_item
    join jsonb_array_elements(assignment_replacements) right_item
      on left_item <> right_item
      and left_item ->> 'work_item_id' = right_item ->> 'work_item_id'
  ) then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if jsonb_array_length(reporting_replacements) <> (
    select count(*)
    from public.reporting_line_assignments line
    where line.supervisor_id = target.id and line.ended_on is null
  ) or exists (
    select 1
    from jsonb_array_elements(reporting_replacements) entry
    where not exists (
      select 1
      from public.reporting_line_assignments line
      where line.person_id = (entry ->> 'person_id')::uuid
        and line.supervisor_id = target.id
        and line.ended_on is null
    )
  ) then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if jsonb_array_length(assignment_replacements) <> (
    select count(*)
    from public.work_items work_item
    where work_item.primary_assignee_id = target.id
  ) or exists (
    select 1
    from jsonb_array_elements(assignment_replacements) entry
    where not exists (
      select 1
      from public.work_items work_item
      where work_item.id = (entry ->> 'work_item_id')::uuid
        and work_item.primary_assignee_id = target.id
    )
  ) then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  for dependent in
    select
      line.id as line_id,
      line.person_id,
      profile.position_code,
      profile.current_reports_to_id
    from public.reporting_line_assignments line
    join public.profiles profile on profile.id = line.person_id
    where line.supervisor_id = target.id
      and line.ended_on is null
    order by line.person_id
    for update of line, profile
  loop
    select
      (entry ->> 'new_supervisor_id')::uuid as new_supervisor_id
    into replacement
    from jsonb_array_elements(reporting_replacements) entry
    where (entry ->> 'person_id')::uuid = dependent.person_id;

    if replacement.new_supervisor_id is null then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;

    select * into new_supervisor
    from public.profiles profile
    where profile.id = replacement.new_supervisor_id
    for share;

    if new_supervisor.id is null
      or not new_supervisor.is_active
      or new_supervisor.must_change_password
      or new_supervisor.id = target.id
      or (dependent.position_code = 'designer' and new_supervisor.position_code <> 'lead')
      or (dependent.position_code = 'lead' and new_supervisor.position_code <> 'manager')
    then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;

    update public.reporting_line_assignments
    set
      ended_on = current_date,
      end_operation_id = operation_id
    where id = dependent.line_id;

    insert into public.reporting_line_assignments (
      person_id,
      supervisor_id,
      started_on,
      assigned_by,
      start_operation_id
    ) values (
      dependent.person_id,
      replacement.new_supervisor_id,
      current_date,
      actor.id,
      operation_id
    );

    update public.profiles
    set
      current_reports_to_id = replacement.new_supervisor_id,
      updated_at = now_at
    where id = dependent.person_id;

    insert into public.admin_audit_events (
      event_type_code,
      actor_id,
      subject_type,
      subject_id,
      previous_values,
      new_values,
      operation_id
    ) values (
      'reporting_line_changed',
      actor.id,
      'profile',
      dependent.person_id,
      jsonb_build_object('supervisor_id', target.id),
      jsonb_build_object('supervisor_id', replacement.new_supervisor_id),
      operation_id
    );
  end loop;

  for item in
    select
      work_item.id,
      work_item.status_code,
      work_item.primary_assignee_id,
      assignment.id as assignment_id
    from public.work_items work_item
    join public.work_item_assignments assignment
      on assignment.work_item_id = work_item.id
      and assignment.ended_at is null
    where work_item.primary_assignee_id = target.id
    order by work_item.id
    for update of work_item, assignment
  loop
    select
      nullif(entry ->> 'new_assignee_id', '')::uuid as new_assignee_id
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

    event_id := gen_random_uuid();

    insert into public.work_item_events (
      id,
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
      event_id,
      item.id,
      'assignment_changed',
      actor.id,
      'profile',
      replacement.new_assignee_id,
      jsonb_build_object('primary_assignee_id', target.id),
      jsonb_build_object('primary_assignee_id', replacement.new_assignee_id),
      operation_id,
      now_at
    );

    if target.id <> actor.id then
      insert into public.notifications (
        recipient_id,
        actor_id,
        work_item_id,
        source_event_id,
        notification_type_code,
        created_at
      ) values (
        target.id,
        actor.id,
        item.id,
        event_id,
        'reassigned_away_from_you',
        now_at
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
        notification_type_code,
        created_at
      ) values (
        replacement.new_assignee_id,
        actor.id,
        item.id,
        event_id,
        'assigned_to_you',
        now_at
      );
    end if;
  end loop;

  update public.reporting_line_assignments
  set
    ended_on = current_date,
    end_operation_id = operation_id
  where person_id = target.id and ended_on is null;

  update public.profile_access_periods
  set
    ended_at = now_at,
    end_operation_id = operation_id
  where profile_id = target.id and ended_at is null;

  update public.profiles
  set
    is_active = false,
    current_reports_to_id = null,
    updated_at = now_at
  where id = target.id;

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
    target.position_code,
    target.is_admin,
    false,
    now_at,
    actor.id,
    operation_id
  );

  insert into public.admin_audit_events (
    event_type_code,
    actor_id,
    subject_type,
    subject_id,
    previous_values,
    new_values,
    operation_id
  ) values (
    'account_deactivated',
    actor.id,
    'profile',
    target.id,
    jsonb_build_object(
      'is_active', true,
      'supervisor_id', target.current_reports_to_id
    ),
    jsonb_build_object(
      'is_active', false,
      'supervisor_id', null
    ),
    operation_id
  );

  if target.current_reports_to_id is not null then
    insert into public.admin_audit_events (
      event_type_code,
      actor_id,
      subject_type,
      subject_id,
      previous_values,
      new_values,
      operation_id
    ) values (
      'reporting_line_changed',
      actor.id,
      'profile',
      target.id,
      jsonb_build_object('supervisor_id', target.current_reports_to_id),
      jsonb_build_object('supervisor_id', null),
      operation_id
    );
  end if;

  operation_result := jsonb_build_object(
    'target_profile_id', target.id,
    'status', 'pending_external'
  );

  update public.operation_requests
  set
    result = operation_result,
    updated_at = now_at
  where id = operation_id;

  return jsonb_build_object(
    'operation_state', 'pending_external',
    'result', operation_result
  );
end;
$$;

create function public.finalize_member_deactivation(
  actor_profile_id uuid,
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
  result jsonb;
begin
  actor := private.require_admin(actor_profile_id);

  select * into operation
  from public.operation_requests request
  where request.id = operation_id
  for update;

  if operation.id is null
    or operation.operation_code <> 'deactivate_member_account'
    or operation.actor_id <> actor.id
  then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  if operation.state = 'completed' then
    return operation.result;
  end if;

  result := jsonb_build_object(
    'target_profile_id', operation.result ->> 'target_profile_id',
    'status', 'completed'
  );

  return private.complete_operation(operation_id, result);
end;
$$;

create function public.finalize_member_reactivation(
  actor_profile_id uuid,
  target_profile_id uuid,
  position_code text,
  is_admin boolean,
  supervisor_id uuid,
  must_change_password boolean,
  operation_id uuid
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
  current_date date := private.current_team_date();
  now_at timestamptz := statement_timestamp();
  result jsonb;
begin
  actor := private.require_admin(actor_profile_id);

  operation := private.lock_or_create_operation(
    operation_id,
    'reactivate_member_account',
    actor.id,
    jsonb_build_object(
      'target_profile_id', target_profile_id,
      'position_code', position_code,
      'is_admin', is_admin,
      'supervisor_id', supervisor_id,
      'must_change_password', must_change_password
    ),
    'started'
  );

  if operation.state = 'completed' then
    return operation.result;
  end if;

  select * into target
  from public.profiles profile
  where profile.id = target_profile_id
  for update;

  if target.id is null or target.is_active then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;

  perform private.assert_requested_access(
    position_code,
    is_admin,
    supervisor_id,
    target.id
  );

  update public.profile_access_periods
  set
    ended_at = now_at,
    end_operation_id = operation_id
  where profile_id = target.id and ended_at is null;

  update public.profiles
  set
    position_code = finalize_member_reactivation.position_code,
    is_admin = finalize_member_reactivation.is_admin,
    is_active = true,
    must_change_password = finalize_member_reactivation.must_change_password,
    current_reports_to_id = supervisor_id,
    updated_at = now_at
  where id = target.id;

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
    position_code,
    is_admin,
    true,
    now_at,
    actor.id,
    operation_id
  );

  if supervisor_id is not null then
    insert into public.reporting_line_assignments (
      person_id,
      supervisor_id,
      started_on,
      assigned_by,
      start_operation_id
    ) values (
      target.id,
      supervisor_id,
      current_date,
      actor.id,
      operation_id
    );
  end if;

  insert into public.admin_audit_events (
    event_type_code,
    actor_id,
    subject_type,
    subject_id,
    previous_values,
    new_values,
    operation_id
  ) values (
    'account_reactivated',
    actor.id,
    'profile',
    target.id,
    jsonb_build_object(
      'position_code', target.position_code,
      'is_admin', target.is_admin,
      'is_active', false,
      'supervisor_id', null
    ),
    jsonb_build_object(
      'position_code', position_code,
      'is_admin', is_admin,
      'is_active', true,
      'supervisor_id', supervisor_id,
      'must_change_password', must_change_password
    ),
    operation_id
  );

  if target.position_code <> position_code then
    insert into public.admin_audit_events (
      event_type_code,
      actor_id,
      subject_type,
      subject_id,
      previous_values,
      new_values,
      operation_id
    ) values (
      'position_changed', actor.id, 'profile', target.id,
      jsonb_build_object('position_code', target.position_code),
      jsonb_build_object('position_code', position_code), operation_id
    );
  end if;

  if target.is_admin is distinct from is_admin then
    insert into public.admin_audit_events (
      event_type_code,
      actor_id,
      subject_type,
      subject_id,
      previous_values,
      new_values,
      operation_id
    ) values (
      case when is_admin then 'admin_privilege_granted' else 'admin_privilege_removed' end,
      actor.id,
      'profile',
      target.id,
      jsonb_build_object('is_admin', target.is_admin),
      jsonb_build_object('is_admin', is_admin),
      operation_id
    );
  end if;

  if supervisor_id is not null then
    insert into public.admin_audit_events (
      event_type_code,
      actor_id,
      subject_type,
      subject_id,
      previous_values,
      new_values,
      operation_id
    ) values (
      'reporting_line_changed', actor.id, 'profile', target.id,
      jsonb_build_object('supervisor_id', null),
      jsonb_build_object('supervisor_id', supervisor_id), operation_id
    );
  end if;

  result := jsonb_build_object(
    'target_profile_id', target.id,
    'status', 'completed'
  );

  return private.complete_operation(operation_id, result);
end;
$$;

create function public.complete_own_password_change(
  actor_profile_id uuid,
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
  result jsonb;
begin
  actor := private.require_profile(actor_profile_id, true, false);

  operation := private.lock_or_create_operation(
    operation_id,
    'change_own_password',
    actor.id,
    jsonb_build_object('profile_id', actor.id),
    'started'
  );

  if operation.state = 'completed' then
    return operation.result;
  end if;

  update public.profiles
  set
    must_change_password = false,
    updated_at = statement_timestamp()
  where id = actor.id;

  result := jsonb_build_object(
    'profile_id', actor.id,
    'status', 'completed'
  );

  return private.complete_operation(operation_id, result);
end;
$$;

revoke all on function public.get_own_account_state() from public, anon;
grant execute on function public.get_own_account_state() to authenticated;

revoke all on function public.get_edge_operation_result(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.get_edge_operation_result(uuid, text, jsonb) to service_role;

revoke all on function public.finalize_first_admin_bootstrap(uuid, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.finalize_first_admin_bootstrap(uuid, text, text, text, uuid) to service_role;

revoke all on function public.prepare_first_admin_credential_recovery(text, uuid) from public, anon, authenticated;
grant execute on function public.prepare_first_admin_credential_recovery(text, uuid) to service_role;

revoke all on function public.finalize_first_admin_credential_recovery(uuid) from public, anon, authenticated;
grant execute on function public.finalize_first_admin_credential_recovery(uuid) to service_role;

revoke all on function public.finalize_member_account_creation(uuid, uuid, text, text, text, boolean, uuid, uuid) from public, anon, authenticated;
grant execute on function public.finalize_member_account_creation(uuid, uuid, text, text, text, boolean, uuid, uuid) to service_role;

revoke all on function public.prepare_temporary_password_reset(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.prepare_temporary_password_reset(uuid, uuid, uuid) to service_role;

revoke all on function public.finalize_temporary_password_reset(uuid, uuid) from public, anon, authenticated;
grant execute on function public.finalize_temporary_password_reset(uuid, uuid) to service_role;

revoke all on function public.prepare_member_deactivation(uuid, uuid, jsonb, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.prepare_member_deactivation(uuid, uuid, jsonb, jsonb, uuid) to service_role;

revoke all on function public.finalize_member_deactivation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.finalize_member_deactivation(uuid, uuid) to service_role;

revoke all on function public.finalize_member_reactivation(uuid, uuid, text, boolean, uuid, boolean, uuid) from public, anon, authenticated;
grant execute on function public.finalize_member_reactivation(uuid, uuid, text, boolean, uuid, boolean, uuid) to service_role;

revoke all on function public.complete_own_password_change(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_own_password_change(uuid, uuid) to service_role;

revoke execute on function private.hash_operation_payload(jsonb) from public, anon, authenticated;
revoke execute on function private.lock_or_create_operation(uuid, text, uuid, jsonb, text) from public, anon, authenticated;
revoke execute on function private.complete_operation(uuid, jsonb) from public, anon, authenticated;
revoke execute on function private.require_profile(uuid, boolean, boolean) from public, anon, authenticated;
revoke execute on function private.require_admin(uuid) from public, anon, authenticated;
revoke execute on function private.assert_requested_access(text, boolean, uuid, uuid) from public, anon, authenticated;

commit;
