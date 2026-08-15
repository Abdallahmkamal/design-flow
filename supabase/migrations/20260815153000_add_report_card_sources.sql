-- Keep report-card source previews complete and independent of table pagination.
begin;

do $$
declare
  definition text;
  ticket_cards constant text := $fragment$      'cards', jsonb_build_object(
        'ticketsWorkedOn', (select count(*) from stale_rows where work_entries > 0),
        'completed', (select coalesce(sum(completed_count),0) from stale_rows),
        'reopened', (select coalesce(sum(reopen_count),0) from stale_rows),
        'activeWorkload', (select count(*) from stale_rows where status_code in ('todo','in_progress','in_review') and not is_archived),
        'blocked', (select count(*) from stale_rows where is_blocked),
        'overdue', (select count(*) from stale_rows where due_state = 'overdue'),
        'stale', (select count(*) from stale_rows where status_code in ('todo','in_progress','in_review')
          and last_work_date is not null and period_end >= private.add_working_days(last_work_date, 5))
      ),
      'charts', jsonb_build_object($fragment$;
  ticket_cards_with_sources constant text := $fragment$      'cards', jsonb_build_object(
        'ticketsWorkedOn', (select count(*) from stale_rows where work_entries > 0),
        'completed', (select coalesce(sum(completed_count),0) from stale_rows),
        'reopened', (select coalesce(sum(reopen_count),0) from stale_rows),
        'activeWorkload', (select count(*) from stale_rows where status_code in ('todo','in_progress','in_review') and not is_archived),
        'blocked', (select count(*) from stale_rows where is_blocked),
        'overdue', (select count(*) from stale_rows where due_state = 'overdue'),
        'stale', (select count(*) from stale_rows where status_code in ('todo','in_progress','in_review')
          and last_work_date is not null and period_end >= private.add_working_days(last_work_date, 5))
      ),
      'cardSources', jsonb_build_object(
        'ticketsWorkedOn', coalesce((select jsonb_agg(jsonb_build_object(
          'key', row.id::text, 'primary', row.display_id || ' · ' || row.title,
          'secondary', row.work_entries || case when row.work_entries = 1 then ' work entry' else ' work entries' end
        ) order by row.display_id) from stale_rows row where row.work_entries > 0), '[]'::jsonb),
        'completed', coalesce((select jsonb_agg(jsonb_build_object(
          'key', row.id::text, 'primary', row.display_id || ' · ' || row.title,
          'secondary', row.completed_count || case when row.completed_count = 1 then ' completed transition' else ' completed transitions' end
        ) order by row.display_id) from stale_rows row where row.completed_count > 0), '[]'::jsonb),
        'reopened', coalesce((select jsonb_agg(jsonb_build_object(
          'key', row.id::text, 'primary', row.display_id || ' · ' || row.title,
          'secondary', row.reopen_count || case when row.reopen_count = 1 then ' reopen transition' else ' reopen transitions' end
        ) order by row.display_id) from stale_rows row where row.reopen_count > 0), '[]'::jsonb),
        'activeWorkload', coalesce((select jsonb_agg(jsonb_build_object(
          'key', row.id::text, 'primary', row.display_id || ' · ' || row.title,
          'secondary', row.status_label
        ) order by row.display_id) from stale_rows row where row.status_code in ('todo','in_progress','in_review') and not row.is_archived), '[]'::jsonb),
        'blocked', coalesce((select jsonb_agg(jsonb_build_object(
          'key', row.id::text, 'primary', row.display_id || ' · ' || row.title,
          'secondary', 'Blocked at period end'
        ) order by row.display_id) from stale_rows row where row.is_blocked), '[]'::jsonb),
        'overdue', coalesce((select jsonb_agg(jsonb_build_object(
          'key', row.id::text, 'primary', row.display_id || ' · ' || row.title,
          'secondary', 'Due ' || row.due_date::text
        ) order by row.display_id) from stale_rows row where row.due_state = 'overdue'), '[]'::jsonb),
        'stale', coalesce((select jsonb_agg(jsonb_build_object(
          'key', row.id::text, 'primary', row.display_id || ' · ' || row.title,
          'secondary', 'Last worked ' || row.last_work_date::text
        ) order by row.display_id) from stale_rows row where row.status_code in ('todo','in_progress','in_review')
          and row.last_work_date is not null and period_end >= private.add_working_days(row.last_work_date, 5)), '[]'::jsonb)
      ),
      'charts', jsonb_build_object($fragment$;
  visual_cards constant text := $fragment$      'cards',jsonb_build_object(
        'visualActivityDays',(select count(distinct(worked_by,work_date)) from visual_entries),
        'visualEntries',(select count(*) from visual_entries),
        'designers',(select count(distinct worked_by) from visual_entries),
        'areas',(select count(distinct coalesce(related_area_id,'00000000-0000-0000-0000-000000000000'::uuid)) from visual_entries)
      ),
      'charts',jsonb_build_object($fragment$;
  visual_cards_with_sources constant text := $fragment$      'cards',jsonb_build_object(
        'visualActivityDays',(select count(distinct(worked_by,work_date)) from visual_entries),
        'visualEntries',(select count(*) from visual_entries),
        'designers',(select count(distinct worked_by) from visual_entries),
        'areas',(select count(distinct coalesce(related_area_id,'00000000-0000-0000-0000-000000000000'::uuid)) from visual_entries)
      ),
      'cardSources',jsonb_build_object(
        'visualActivityDays',coalesce((select jsonb_agg(jsonb_build_object(
          'key', source.worked_by::text || ':' || source.work_date::text,
          'primary', source.worked_name || ' · ' || source.work_date::text,
          'secondary', source.entry_count || case when source.entry_count = 1 then ' visual work entry' else ' visual work entries' end
        ) order by source.work_date desc, source.worked_name) from (
          select worked_by, work_date, min(worked_name) worked_name, count(*) entry_count
          from visual_entries group by worked_by, work_date
        ) source), '[]'::jsonb),
        'visualEntries',coalesce((select jsonb_agg(jsonb_build_object(
          'key', entry.id::text, 'primary', entry.worked_name || ' · ' || entry.work_date::text,
          'secondary', entry.type_label || coalesce(' · ' || entry.area_name, '')
        ) order by entry.work_date desc, entry.logged_at desc, entry.id desc) from visual_entries entry), '[]'::jsonb),
        'designers',coalesce((select jsonb_agg(jsonb_build_object(
          'key', source.worked_by::text, 'primary', source.worked_name,
          'secondary', source.entry_count || case when source.entry_count = 1 then ' visual work entry' else ' visual work entries' end
        ) order by source.worked_name) from (
          select worked_by, min(worked_name) worked_name, count(*) entry_count
          from visual_entries group by worked_by
        ) source), '[]'::jsonb),
        'areas',coalesce((select jsonb_agg(jsonb_build_object(
          'key', coalesce(source.related_area_id::text, 'unassigned'),
          'primary', coalesce(source.area_name, 'Unassigned'),
          'secondary', source.entry_count || case when source.entry_count = 1 then ' visual work entry' else ' visual work entries' end
        ) order by coalesce(source.area_name, 'Unassigned')) from (
          select related_area_id, min(area_name) area_name, count(*) entry_count
          from visual_entries group by related_area_id
        ) source), '[]'::jsonb)
      ),
      'charts',jsonb_build_object($fragment$;
begin
  select pg_get_functiondef('public.get_reports(jsonb)'::regprocedure) into definition;
  if strpos(definition, ticket_cards) = 0 or strpos(definition, visual_cards) = 0 then
    raise exception 'Unexpected get_reports definition; refusing report card-source activation';
  end if;
  definition := replace(definition, ticket_cards, ticket_cards_with_sources);
  definition := replace(definition, visual_cards, visual_cards_with_sources);
  execute definition;
end;
$$;

comment on function public.get_reports(jsonb) is
  'Returns the team-ready Reports view with D-110 scope and source-record previews for summary cards.';

commit;
