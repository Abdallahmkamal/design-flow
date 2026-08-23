begin;
select plan(2);

select ok(
  position(
    'No due date' in
    pg_get_functiondef('public.get_dashboard(text,uuid[],uuid)'::regprocedure)
  ) = 0,
  'Dashboard no longer exposes the legacy Due Date wording'
);

select ok(
  position(
    'No Due Date' in
    pg_get_functiondef('public.get_dashboard(text,uuid[],uuid)'::regprocedure)
  ) > 0,
  'Dashboard uses the canonical Due Date wording'
);

select * from finish();
rollback;
