begin;

select plan(3);

select has_function(
  'public',
  'get_ticket_details_activity',
  array['uuid'],
  'Slice 4 activity read model exists'
);

select function_privs_are(
  'public',
  'get_ticket_details_activity',
  array['uuid'],
  'authenticated',
  array['EXECUTE'],
  'authenticated principals may execute the activity read model'
);

select function_privs_are(
  'public',
  'get_ticket_details_activity',
  array['uuid'],
  'anon',
  array[]::text[],
  'anonymous principals cannot execute the activity read model'
);

select * from finish();
rollback;
