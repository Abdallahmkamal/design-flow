-- Enforce the D-110/D-112 Dashboard scope defaults and selector contract.

begin;

create or replace function private.resolve_people_scope(
  actor public.profiles,
  requested_scope_key text,
  requested_people_ids uuid[]
)
returns uuid[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  default_key text;
  scope_key text;
  subject_id uuid;
  result uuid[];
begin
  default_key := case
    when actor.is_admin then 'all'
    when actor.position_code = 'viewer' then 'all'
    when actor.position_code = 'designer' then 'me'
    when actor.position_code = 'lead' then 'lead:' || actor.id::text
    else 'all'
  end;
  scope_key := coalesce(nullif(requested_scope_key, ''), default_key);

  if actor.position_code = 'viewer' and scope_key <> 'all' then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;
  if actor.position_code = 'designer' and not actor.is_admin and scope_key <> 'me' then
    raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN';
  end if;

  if scope_key = 'people' then
    if requested_people_ids is null or cardinality(requested_people_ids) = 0 then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    if exists (
      select 1
      from unnest(requested_people_ids) requested(id)
      left join public.profiles profile on profile.id = requested.id
      where profile.id is null or not profile.is_active
        or profile.position_code not in ('designer', 'lead', 'manager')
    ) then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    select coalesce(array_agg(distinct requested.id order by requested.id), array[]::uuid[])
    into result from unnest(requested_people_ids) requested(id);
    return result;
  elsif requested_people_ids is not null then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if scope_key = 'all' then
    select coalesce(array_agg(profile.id order by profile.id), array[]::uuid[])
    into result
    from public.profiles profile
    where profile.is_active and profile.position_code in ('designer', 'lead', 'manager');
  elsif scope_key = 'me' then
    if actor.position_code not in ('designer', 'lead', 'manager') then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    result := array[actor.id];
  elsif scope_key like 'lead:%' then
    begin subject_id := substring(scope_key from 6)::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end;
    if not exists (
      select 1 from public.profiles profile
      where profile.id = subject_id and profile.is_active and profile.position_code = 'lead'
    ) then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    select coalesce(array_agg(profile.id order by profile.id), array[]::uuid[])
    into result from public.profiles profile
    where profile.is_active and profile.position_code in ('designer', 'lead', 'manager')
      and (profile.id = subject_id or profile.current_reports_to_id = subject_id);
  elsif scope_key like 'manager:%' then
    begin subject_id := substring(scope_key from 9)::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end;
    if not exists (
      select 1 from public.profiles profile
      where profile.id = subject_id and profile.is_active and profile.position_code = 'manager'
    ) then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    select coalesce(array_agg(profile.id order by profile.id), array[]::uuid[])
    into result from public.profiles profile
    where profile.is_active and profile.position_code in ('designer', 'lead', 'manager')
      and (
        profile.id = subject_id
        or profile.current_reports_to_id = subject_id
        or profile.current_reports_to_id in (
          select lead.id from public.profiles lead
          where lead.is_active and lead.position_code = 'lead'
            and lead.current_reports_to_id = subject_id
        )
      );
  else
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  return result;
end;
$$;

do $$
declare
  definition text;
  old_default constant text := $fragment$default_scope_key := case actor.position_code
    when 'viewer' then 'all'
    when 'designer' then 'me'
    when 'lead' then 'lead:' || actor.id::text
    else 'manager:' || actor.id::text
  end;$fragment$;
  new_default constant text := $fragment$default_scope_key := case
    when actor.is_admin then 'all'
    when actor.position_code = 'viewer' then 'all'
    when actor.position_code = 'designer' then 'me'
    when actor.position_code = 'lead' then 'lead:' || actor.id::text
    else 'all'
  end;$fragment$;
  old_me_option constant text := $fragment$select 2, 'Me', jsonb_build_object('key', 'me', 'label', 'Me')
        where actor.position_code = 'designer'$fragment$;
  new_me_option constant text := $fragment$select 2, 'Me', jsonb_build_object('key', 'me', 'label', 'Me')
        where actor.position_code in ('designer', 'lead', 'manager')$fragment$;
  old_area_options constant text := $fragment$from public.work_areas area
    ), '[]'::jsonb),$fragment$;
  new_area_options constant text := $fragment$from public.work_areas area
      where area.is_active or area.id = requested_area_id
    ), '[]'::jsonb),$fragment$;
begin
  select pg_get_functiondef('public.get_dashboard(text,uuid[],uuid)'::regprocedure)
  into definition;
  if definition is null
    or strpos(definition, old_default) = 0
    or strpos(definition, old_me_option) = 0
    or strpos(definition, old_area_options) = 0 then
    raise exception 'Unexpected get_dashboard definition; refusing D-110/D-112 replacement';
  end if;
  definition := replace(definition, old_default, new_default);
  definition := replace(definition, old_me_option, new_me_option);
  definition := replace(definition, old_area_options, new_area_options);
  execute definition;
end;
$$;

revoke execute on function private.resolve_people_scope(public.profiles, text, uuid[])
  from public, anon, authenticated;

comment on function public.get_dashboard(text, uuid[], uuid) is
  'Returns the D-110/D-112 authorized Dashboard with permanent People and single-Area scope.';

commit;
