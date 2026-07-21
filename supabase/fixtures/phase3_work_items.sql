-- Load the opt-in, conspicuously synthetic Phase 3 acceptance fixtures.
-- Run only after `npm run db:reset` against local Supabase:
--   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
--     --file supabase/fixtures/phase3_work_items.sql

\set ON_ERROR_STOP on
select set_config('design_flow.phase3_fixtures', 'on', false);
\ir ../seed.sql
