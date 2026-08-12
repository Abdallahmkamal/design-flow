-- Close the D-113 Dashboard-to-All-Tickets Unassigned drill-down gap.

begin;

do $$
declare
  definition text;
  old_declaration constant text := '  archived_only boolean := false;';
  new_declaration constant text := E'  archived_only boolean := false;\n  unassigned_only boolean := false;';
  old_boolean_block constant text := $fragment$  if filters ? 'archivedOnly' then
    if jsonb_typeof(filters -> 'archivedOnly') <> 'boolean' then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    archived_only := (filters ->> 'archivedOnly')::boolean;
  end if;$fragment$;
  new_boolean_block constant text := $fragment$  if filters ? 'archivedOnly' then
    if jsonb_typeof(filters -> 'archivedOnly') <> 'boolean' then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    archived_only := (filters ->> 'archivedOnly')::boolean;
  end if;
  if filters ? 'unassignedOnly' then
    if jsonb_typeof(filters -> 'unassignedOnly') <> 'boolean' then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    unassigned_only := (filters ->> 'unassignedOnly')::boolean;
  end if;$fragment$;
  old_validation constant text := $fragment$  if status_codes is not null and exists ($fragment$;
  new_validation constant text := $fragment$  if unassigned_only and coalesce(cardinality(people_ids), 0) > 0 then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  if status_codes is not null and exists ($fragment$;
  old_filter constant text := $fragment$      and (people_ids is null or cardinality(people_ids) = 0
        or primary_assignee_id = any(people_ids) or exists (
          select 1 from public.current_work_item_contributors contributor
          where contributor.work_item_id = id and contributor.profile_id = any(people_ids)))
      and (blocked_filter = 'any'$fragment$;
  new_filter constant text := $fragment$      and (people_ids is null or cardinality(people_ids) = 0
        or primary_assignee_id = any(people_ids) or exists (
          select 1 from public.current_work_item_contributors contributor
          where contributor.work_item_id = id and contributor.profile_id = any(people_ids)))
      and (not unassigned_only or primary_assignee_id is null)
      and (blocked_filter = 'any'$fragment$;
begin
  select pg_get_functiondef('public.list_work_items(jsonb)'::regprocedure)
  into definition;
  if definition is null
    or strpos(definition, old_declaration) = 0
    or strpos(definition, old_boolean_block) = 0
    or strpos(definition, old_validation) = 0
    or strpos(definition, old_filter) = 0 then
    raise exception 'Unexpected list_work_items definition; refusing D-113 replacement';
  end if;
  definition := replace(definition, old_declaration, new_declaration);
  definition := replace(definition, old_boolean_block, new_boolean_block);
  definition := replace(definition, old_validation, new_validation);
  definition := replace(definition, old_filter, new_filter);
  execute definition;
end;
$$;

comment on function public.list_work_items(jsonb) is
  'Lists team-ready tickets, including the visible D-113 unassigned-only refinement.';

commit;
