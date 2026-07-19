begin;

select plan(2);

select has_extension(
  'pgtap',
  'the local test database provides the pgTAP extension'
);

select is(
  (select count(*)::integer from pg_namespace where nspname = 'public'),
  1,
  'the public application schema exists'
);

select * from finish();

rollback;
