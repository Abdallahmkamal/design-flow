-- Slice 4: explainable calendar aggregates and effective-date activity feed.

begin;

create function public.get_ticket_details_activity(target_work_item_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform private.require_application_user_read();

  if not exists (
    select 1 from public.work_items item where item.id = target_work_item_id
  ) then
    return null;
  end if;

  with target_metric as (
    select case
      when item.planned_start_date is null then null
      when item.planned_start_date >= coalesce(done_state.done_on, private.current_team_date()) then 0
      else private.count_working_days(
        item.planned_start_date,
        coalesce(done_state.done_on, private.current_team_date())
      )
    end as days_open
    from public.work_items item
    left join lateral (
      select history.changed_on as done_on
      from public.work_item_status_history history
      where history.work_item_id = item.id
        and history.to_status_code = 'done'
        and item.status_code = 'done'
      order by history.changed_at desc, history.id desc
      limit 1
    ) done_state on true
    where item.id = target_work_item_id
  ), calendar_days as (
    select
      entry.work_date,
      count(*)::integer as log_count,
      jsonb_agg(distinct jsonb_build_object(
        'id', worked_by.id,
        'displayName', worked_by.display_name
      )) as people,
      jsonb_agg(distinct entry.work_type_code order by entry.work_type_code) as work_types
    from public.valid_work_log_entries entry
    join public.profiles worked_by on worked_by.id = entry.worked_by
    where entry.work_item_id = target_work_item_id
    group by entry.work_date
  ), feed_rows as (
    select
      entry.id,
      entry.work_date::timestamptz as effective_sort,
      batch.created_at as occurred_at,
      jsonb_build_object(
        'id', entry.id,
        'kind', 'work_log',
        'type', 'work_log',
        'effectiveDate', entry.work_date,
        'occurredAt', batch.created_at,
        'actor', jsonb_build_object('id', worked_by.id, 'displayName', worked_by.display_name),
        'title', work_type.display_label,
        'description', entry.description,
        'workTypeLabel', work_type.display_label,
        'relationship', case
          when assignment.assignee_id = batch.worked_by then 'primary'
          else 'contributor'
        end,
        'subjectId', batch.id
      ) as payload
    from public.valid_work_log_entries entry
    join public.work_log_batches batch on batch.id = entry.batch_id
    join public.profiles worked_by on worked_by.id = batch.worked_by
    join public.work_type_definitions work_type on work_type.code = entry.work_type_code
    left join lateral (
      select period.assignee_id
      from public.work_item_assignments period
      where period.work_item_id = target_work_item_id
        and period.started_on <= entry.work_date
        and (period.ended_on is null or entry.work_date < period.ended_on)
      order by period.started_on desc, period.started_at desc, period.id desc
      limit 1
    ) assignment on true
    where entry.work_item_id = target_work_item_id

    union all

    select
      event.id,
      event.occurred_at,
      event.occurred_at,
      jsonb_build_object(
        'id', event.id,
        'kind', 'ticket_change',
        'type', event.event_type_code,
        'effectiveDate', event.occurred_at,
        'occurredAt', event.occurred_at,
        'actor', jsonb_build_object('id', actor.id, 'displayName', actor.display_name),
        'title', event.event_type_code,
        'description', null,
        'workTypeLabel', null,
        'relationship', null,
        'subjectId', event.subject_id
      )
    from public.work_item_events event
    join public.profiles actor on actor.id = event.actor_id
    where event.work_item_id = target_work_item_id
      and event.event_type_code in (
        'created', 'core_fields_changed', 'labels_changed', 'assignment_changed',
        'status_changed', 'reopened', 'blocker_created', 'blocker_resolved',
        'subtask_added', 'subtask_renamed', 'subtask_reordered',
        'subtask_completed', 'subtask_reopened', 'subtask_withdrawn',
        'work_log_corrected', 'work_log_withdrawn', 'archived', 'restored'
      )
  )
  select jsonb_build_object(
    'daysOpen', (select metric.days_open from target_metric metric),
    'workDates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', day.work_date,
        'people', day.people,
        'workTypes', day.work_types,
        'logCount', day.log_count
      ) order by day.work_date)
      from calendar_days day
    ), '[]'::jsonb),
    'activityFeed', coalesce((
      select jsonb_agg(row.payload order by row.effective_sort desc, row.occurred_at desc, row.id desc)
      from feed_rows row
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_ticket_details_activity(uuid) from public;
grant execute on function public.get_ticket_details_activity(uuid) to authenticated;

comment on function public.get_ticket_details_activity(uuid) is
  'Returns Slice 4 Sunday-Thursday calendar source aggregates and a reverse-chronological effective-date operational feed. Comments remain separate.';

commit;
