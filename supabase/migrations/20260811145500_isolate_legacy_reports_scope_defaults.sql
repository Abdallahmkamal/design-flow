-- Slice 6 changes Dashboard defaults only. Reports retain their pre-Slice-7
-- position defaults even though their read/export functions reuse Dashboard's
-- people-scope resolver internally.

begin;

do $$
declare
  procedure_name text;
  definition text;
  old_call constant text := 'public.get_dashboard(scope_key, requested_people, null)';
  compact_old_call constant text := 'public.get_dashboard(scope_key,requested_people,null)';
  legacy_scope constant text := $fragment$coalesce(scope_key, case actor.position_code
      when 'viewer' then 'all'
      when 'designer' then 'me'
      when 'lead' then 'lead:' || actor.id::text
      else 'manager:' || actor.id::text
    end)$fragment$;
begin
  foreach procedure_name in array array[
    'public.get_reports(jsonb)',
    'public.export_report_rows(text,jsonb)'
  ] loop
    select pg_get_functiondef(procedure_name::regprocedure) into definition;
    if procedure_name = 'public.get_reports(jsonb)' then
      if strpos(definition, old_call) = 0 then
        raise exception 'Unexpected get_reports definition; refusing Slice 6 isolation';
      end if;
      definition := replace(
        definition,
        old_call,
        'public.get_dashboard(' || legacy_scope || ', requested_people, null)'
      );
      definition := replace(
        definition,
        'dashboard ->> ''defaultScopeKey''',
        legacy_scope
      );
      definition := replace(
        definition,
        'dashboard->>''defaultScopeKey''',
        legacy_scope
      );
    else
      if strpos(definition, compact_old_call) = 0 then
        raise exception 'Unexpected export_report_rows definition; refusing Slice 6 isolation';
      end if;
      definition := replace(
        definition,
        compact_old_call,
        'public.get_dashboard(' || legacy_scope || ',requested_people,null)'
      );
    end if;
    execute definition;
  end loop;
end;
$$;

comment on function public.get_reports(jsonb) is
  'Returns legacy Reports behavior with pre-Slice-7 position defaults.';
comment on function public.export_report_rows(text, jsonb) is
  'Exports legacy Reports rows with pre-Slice-7 position defaults.';

commit;
