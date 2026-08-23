do $$
declare
  definition text;
begin
  select pg_get_functiondef('public.get_dashboard(text,uuid[],uuid)'::regprocedure)
    into definition;

  if strpos(definition, 'No due date') = 0 then
    raise exception 'Dashboard reconciliation expected the legacy No due date label';
  end if;

  definition := replace(definition, 'No due date', 'No Due Date');
  execute definition;
end;
$$;

comment on function public.get_dashboard(text,uuid[],uuid) is
  'Returns the operational Dashboard with canonical working-calendar metrics and Due Date presentation.';

comment on view public.review_return_deadline_remediation is
  'Admin-only review list for historical In Review to In Progress returns whose replacement Due Date cannot be inferred safely.';
