-- Release Slice 3: expanded search and Last Activity default ordering.

begin;

-- Reconcile the current permission-sensitive read model in place so later
-- unassigned and shared domain-semantics amendments remain intact.
do $$
declare
  definition text;
  old_sort constant text := $fragment$  sort_field text := coalesce(nullif(filters ->> 'sort', ''), 'default');
  sort_direction text := coalesce(nullif(filters ->> 'direction', ''), 'asc');$fragment$;
  new_sort constant text := $fragment$  sort_field text := coalesce(nullif(filters ->> 'sort', ''), 'last_activity');
  sort_direction text := coalesce(
    nullif(filters ->> 'direction', ''),
    case
      when coalesce(nullif(filters ->> 'sort', ''), 'last_activity') = 'last_activity' then 'desc'
      else 'asc'
    end
  );$fragment$;
  archived_block constant text := $fragment$  if filters ? 'archivedOnly' then
    if jsonb_typeof(filters -> 'archivedOnly') <> 'boolean' then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    archived_only := (filters ->> 'archivedOnly')::boolean;
  end if;$fragment$;
  normalized_search_block constant text := $fragment$  if search_text ~ '^#[0-9]+$' then
    search_text := regexp_replace(substring(search_text from 2), '^0+', '');
    search_text := coalesce(nullif(search_text, ''), '0');
    search_text := 'DF-' || case
      when length(search_text) < 6 then lpad(search_text, 6, '0')
      else search_text
    end;
  end if;

  if filters ? 'archivedOnly' then
    if jsonb_typeof(filters -> 'archivedOnly') <> 'boolean' then
      raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
    end if;
    archived_only := (filters ->> 'archivedOnly')::boolean;
  end if;$fragment$;
  old_search constant text := $fragment$      and (search_text = '' or display_id ilike '%' || search_text || '%'
        or title ilike '%' || search_text || '%' or coalesce(description, '') ilike '%' || search_text || '%')$fragment$;
  new_search constant text := $fragment$      and (
        search_text = ''
        or display_id ilike '%' || search_text || '%'
        or title ilike '%' || search_text || '%'
        or area_name ilike '%' || search_text || '%'
        or coalesce(assignee_name, '') ilike '%' || search_text || '%'
        or exists (
          select 1
          from jsonb_array_elements(contributors) contributor
          where contributor ->> 'displayName' ilike '%' || search_text || '%'
        )
      )$fragment$;
begin
  select pg_get_functiondef('public.list_work_items(jsonb)'::regprocedure)
  into definition;

  if definition is null
    or strpos(definition, old_sort) = 0
    or strpos(definition, archived_block) = 0
    or strpos(definition, old_search) = 0 then
    raise exception 'Unexpected list_work_items definition; refusing Slice 3 replacement';
  end if;

  definition := replace(definition, old_sort, new_sort);
  definition := replace(definition, archived_block, normalized_search_block);
  definition := replace(definition, old_search, new_search);
  execute definition;
end;
$$;

comment on function public.list_work_items(jsonb) is
  'Lists team-ready tickets with unassigned refinement, shared domain semantics, expanded people/Area search, copied # reference normalization, and Last Activity newest-first default ordering.';

commit;
