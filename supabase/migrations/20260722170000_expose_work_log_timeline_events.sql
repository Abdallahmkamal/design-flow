do $$
declare
  function_definition text;
  previous_filter constant text := '''archived'', ''restored''';
  expanded_filter constant text := '''work_log_submitted'', ''work_log_corrected'', ''work_log_withdrawn'',
        ''archived'', ''restored''';
begin
  select pg_get_functiondef('public.get_work_item_detail(text)'::regprocedure)
  into function_definition;

  if function_definition is null
    or strpos(function_definition, previous_filter) = 0
    or strpos(function_definition, '''work_log_submitted''') > 0 then
    raise exception 'Unexpected get_work_item_detail definition; refusing an unsafe replacement';
  end if;

  execute replace(function_definition, previous_filter, expanded_filter);
end;
$$;

comment on function public.get_work_item_detail(text) is
  'Returns an authorized Work Item detail, including ticket work-log submission, correction, and withdrawal events.';
