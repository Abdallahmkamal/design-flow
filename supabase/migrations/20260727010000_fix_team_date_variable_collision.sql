-- Preserve team-local effective dates in account and hierarchy operations.
--
-- `current_date` is also a PostgreSQL special value. In the affected PL/pgSQL
-- functions, SQL statements resolved that name to the database-session date
-- instead of the variable initialized by `private.current_team_date()`. Rename
-- the local variable without changing the functions' signatures or grants.

do $migration$
declare
  function_signature text;
  function_definition text;
  corrected_definition text;
begin
  foreach function_signature in array array[
    'public.set_member_access(uuid,text,boolean,uuid,timestamptz,jsonb,uuid)',
    'public.prepare_member_deactivation(uuid,uuid,jsonb,jsonb,uuid)',
    'public.finalize_member_reactivation(uuid,uuid,text,boolean,uuid,boolean,uuid)'
  ]
  loop
    select pg_get_functiondef(function_signature::regprocedure)
    into function_definition;

    corrected_definition := regexp_replace(
      function_definition,
      '\mcurrent_date\M',
      'team_date',
      'g'
    );

    if corrected_definition = function_definition
      or corrected_definition not like '%team_date date := private.current_team_date();%'
    then
      raise exception 'Expected team-date variable was not found in %', function_signature;
    end if;

    execute corrected_definition;
  end loop;
end;
$migration$;
