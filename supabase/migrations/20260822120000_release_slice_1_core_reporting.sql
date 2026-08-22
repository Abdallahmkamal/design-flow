-- Frozen release Slice 1: canonical calendar/domain reporting semantics.

begin;

create or replace function private.is_working_day(target_date date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_date is not null and extract(dow from target_date)::smallint in (
    select unnest(policy.working_days)
    from public.product_policy_versions policy
    where policy.effective_to is null
  );
$$;

create or replace function private.count_working_days(start_date date, end_date date)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when start_date is null then null
    when end_date is null or end_date <= start_date then 0
    else coalesce((
      select count(*)::integer
      from generate_series(start_date + 1, end_date, interval '1 day') day
      where private.is_working_day(day::date)
    ), 0)
  end;
$$;

create or replace function private.work_item_status_on(target_work_item_id uuid, target_date date)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_date >= private.current_team_date()
      then (select item.status_code from public.work_items item where item.id = target_work_item_id)
    else coalesce(
      (
        select history.to_status_code
        from public.work_item_status_history history
        where history.work_item_id = target_work_item_id
          and history.changed_on <= target_date
        order by history.changed_on desc, history.changed_at desc, history.id desc
        limit 1
      ),
      (select item.status_code from public.work_items item where item.id = target_work_item_id)
    )
  end;
$$;

create or replace function private.work_item_days_open(
  target_work_item_id uuid,
  snapshot_date date
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select item.planned_start_date,
      private.work_item_status_on(item.id, snapshot_date) as status_at_snapshot
    from public.work_items item
    where item.id = target_work_item_id
  ), completion as (
    select history.changed_on
    from public.work_item_status_history history, target
    where history.work_item_id = target_work_item_id
      and target.status_at_snapshot = 'done'
      and history.to_status_code = 'done'
      and history.changed_on <= snapshot_date
    order by history.changed_on desc, history.changed_at desc, history.id desc
    limit 1
  )
  select case
    when target.planned_start_date is null then null
    else private.count_working_days(
      target.planned_start_date,
      case when target.status_at_snapshot = 'done'
        then coalesce((select changed_on from completion), snapshot_date)
        else snapshot_date
      end
    )
  end
  from target;
$$;

create or replace function private.work_item_days_active(
  target_work_item_id uuid,
  snapshot_date date
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct entry.work_date)::integer
  from public.valid_work_log_entries entry
  where entry.work_item_id = target_work_item_id
    and entry.work_date <= snapshot_date
    and private.is_working_day(entry.work_date);
$$;

create or replace function private.work_item_is_overdue(
  target_work_item_id uuid,
  snapshot_date date
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    not private.work_item_archived_on(item.id, snapshot_date)
    and item.due_date is not null
    and item.due_date < snapshot_date
    and private.work_item_status_on(item.id, snapshot_date) in ('todo', 'in_progress'),
    false
  )
  from public.work_items item
  where item.id = target_work_item_id;
$$;

create or replace function private.work_item_status_durations(
  target_work_item_id uuid,
  snapshot_date date
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select min(history.changed_on) as first_date
    from public.work_item_status_history history
    where history.work_item_id = target_work_item_id
      and history.changed_on <= snapshot_date
  ), owned_days as (
    select private.work_item_status_on(target_work_item_id, day::date) as status_code
    from bounds
    cross join lateral generate_series(bounds.first_date, snapshot_date, interval '1 day') day
    where bounds.first_date is not null
      and private.is_working_day(day::date)
  )
  select jsonb_build_object(
    'todoDays', count(*) filter (where status_code = 'todo'),
    'inProgressDays', count(*) filter (where status_code = 'in_progress'),
    'reviewDays', count(*) filter (where status_code = 'in_review'),
    'pausedDays', count(*) filter (where status_code = 'paused')
  )
  from owned_days;
$$;

create or replace view public.work_item_active_work_days
with (security_barrier = true)
as
select
  batch.work_item_id,
  count(distinct entry.work_date)::integer as active_work_days
from public.work_log_batches batch
join public.work_log_entries entry on entry.batch_id = batch.id
where batch.context_code = 'ticket'
  and private.is_application_user()
  and batch.withdrawn_at is null
  and entry.withdrawn_at is null
  and private.is_working_day(entry.work_date)
group by batch.work_item_id;

-- Preserve the legacy signature for deployed clients, but prevent it from
-- returning reviewed work without the newly required deadline.
do $$
declare
  definition text;
  anchor constant text := $fragment$  if target_status_code = item.status_code then$fragment$;
  guard constant text := $fragment$  if item.status_code = 'in_review' and target_status_code = 'in_progress' then
    raise exception using errcode = 'P0001', message = 'DF_NEXT_DEADLINE_REQUIRED';
  end if;

  if target_status_code = item.status_code then$fragment$;
begin
  select pg_get_functiondef(
    'public.transition_work_item_status(uuid,text,text,timestamptz,boolean,uuid)'::regprocedure
  ) into definition;
  if strpos(definition, anchor) = 0 then
    raise exception 'Unexpected transition function; refusing review-return guard';
  end if;
  execute replace(definition, anchor, guard);
end;
$$;

create function public.transition_work_item_status(
  work_item_id uuid,
  target_status_code text,
  expected_status_code text,
  expected_updated_at timestamptz,
  acknowledge_incomplete_subtasks boolean,
  operation_id uuid,
  new_next_deadline date
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  operation public.operation_requests;
  item public.work_items;
  target_status public.work_item_statuses;
  event_id uuid;
  incomplete_count integer;
  now_at timestamptz := statement_timestamp();
  team_date date;
  result jsonb;
begin
  operation := private.lock_or_create_operation(
    operation_id, 'transition_work_item_status', auth.uid(),
    jsonb_build_object(
      'work_item_id', work_item_id, 'target_status_code', target_status_code,
      'expected_status_code', expected_status_code,
      'expected_updated_at', expected_updated_at,
      'acknowledge_incomplete_subtasks', acknowledge_incomplete_subtasks,
      'new_next_deadline', new_next_deadline
    ), 'started'
  );
  if operation.state = 'completed' then return operation.result; end if;

  actor := private.require_profile(auth.uid(), false, false);
  select target.* into item from public.work_items target
  where target.id = work_item_id for update;
  if item.id is null then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if not private.can_edit_work_item(item.id) then raise exception using errcode = 'P0001', message = 'DF_FORBIDDEN'; end if;
  if item.archived_at is not null then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  if item.status_code is distinct from expected_status_code
    or item.updated_at is distinct from expected_updated_at
  then raise exception using errcode = 'P0001', message = 'DF_CONFLICT'; end if;
  if item.status_code = 'in_review' and target_status_code = 'in_progress'
    and new_next_deadline is null
  then raise exception using errcode = 'P0001', message = 'DF_NEXT_DEADLINE_REQUIRED'; end if;
  if not (item.status_code = 'in_review' and target_status_code = 'in_progress')
    and new_next_deadline is not null
  then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if target_status_code = item.status_code then
    return private.complete_operation(operation_id, jsonb_build_object(
      'id', item.id, 'status_code', item.status_code,
      'updated_at', item.updated_at, 'status', 'unchanged'
    ));
  end if;

  select status.* into target_status from public.work_item_statuses status
  where status.code = target_status_code;
  if target_status.code is null or not exists (
    select 1 from public.work_item_status_transitions transition
    where transition.from_status_code = item.status_code
      and transition.to_status_code = target_status_code
      and transition.is_allowed
  ) then raise exception using errcode = 'P0001', message = 'DF_VALIDATION'; end if;
  if target_status.requires_primary_assignee and item.primary_assignee_id is null then
    raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE';
  end if;
  if target_status_code in ('backlog', 'paused', 'done') and exists (
    select 1 from public.blockers blocker
    where blocker.work_item_id = item.id and blocker.resolved_at is null
  ) then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;
  select count(*)::integer into incomplete_count
  from public.subtasks subtask
  where subtask.work_item_id = item.id and subtask.withdrawn_at is null
    and not subtask.is_completed;
  if target_status_code = 'done' and incomplete_count > 0
    and not acknowledge_incomplete_subtasks
  then raise exception using errcode = 'P0001', message = 'DF_INVALID_STATE'; end if;

  team_date := private.current_team_date();
  update public.work_items set
    status_code = target_status_code,
    due_date = case
      when item.status_code = 'in_review' and target_status_code = 'in_progress'
        then new_next_deadline
      else due_date
    end,
    updated_at = now_at,
    last_activity_at = now_at,
    completed_at = case when target_status_code = 'done' then now_at else completed_at end
  where id = item.id;

  insert into public.work_item_status_history (
    work_item_id, from_status_code, to_status_code, changed_by,
    changed_at, changed_on, operation_id
  ) values (
    item.id, item.status_code, target_status_code, actor.id,
    now_at, team_date, operation_id
  );
  if item.status_code = 'in_review' and target_status_code = 'in_progress' then
    perform private.write_work_item_event(
      item.id, 'core_fields_changed', actor.id, 'work_item', item.id,
      jsonb_build_object('due_date', item.due_date),
      jsonb_build_object('due_date', new_next_deadline),
      operation_id, now_at
    );
  end if;
  event_id := private.write_work_item_event(
    item.id, 'status_changed', actor.id, 'work_item', item.id,
    jsonb_build_object('status_code', item.status_code),
    jsonb_build_object('status_code', target_status_code),
    operation_id, now_at
  );
  if item.status_code = 'done' and target_status_code <> 'done' then
    perform private.write_work_item_event(
      item.id, 'reopened', actor.id, 'work_item', item.id,
      jsonb_build_object('status_code', 'done'),
      jsonb_build_object('status_code', target_status_code),
      operation_id, now_at
    );
  end if;
  perform private.write_work_item_notification(
    item.primary_assignee_id, actor.id, item.id, event_id,
    'status_changed', now_at
  );
  result := jsonb_build_object(
    'id', item.id, 'status_code', target_status_code,
    'due_date', case when item.status_code = 'in_review' and target_status_code = 'in_progress'
      then new_next_deadline else item.due_date end,
    'updated_at', now_at, 'status', 'updated'
  );
  return private.complete_operation(operation_id, result);
end;
$$;

revoke all on function public.transition_work_item_status(uuid,text,text,timestamptz,boolean,uuid,date) from public;
grant execute on function public.transition_work_item_status(uuid,text,text,timestamptz,boolean,uuid,date) to authenticated;

-- Reconcile existing read functions without duplicating the complete,
-- permission-sensitive query bodies in this forward migration.
do $$
declare
  definition text;
begin
  select pg_get_functiondef('public.list_work_items(jsonb)'::regprocedure) into definition;
  definition := replace(definition,
    $fragment$case
        when item.planned_start_date is null then null
        when item.planned_start_date >= coalesce(done_state.done_on, today) then 0
        else private.count_working_days(item.planned_start_date, coalesce(done_state.done_on, today))
      end as days_open$fragment$,
    'private.work_item_days_open(item.id, today) as days_open');
  definition := replace(definition,
    $fragment$(due_filter = 'overdue' and due_date is not null and due_date < today)$fragment$,
    $fragment$(due_filter = 'overdue' and private.work_item_is_overdue(id, today))$fragment$);
  execute definition;

  select pg_get_functiondef('public.get_ticket_details_activity(uuid)'::regprocedure) into definition;
  definition := regexp_replace(definition,
    $pattern$case\s+when item\.planned_start_date is null then null\s+when item\.planned_start_date >= coalesce\(done_state\.done_on, private\.current_team_date\(\)\) then 0\s+else private\.count_working_days\(\s*item\.planned_start_date,\s*coalesce\(done_state\.done_on, private\.current_team_date\(\)\)\s*\)\s+end as days_open$pattern$,
    'private.work_item_days_open(item.id, private.current_team_date()) as days_open');
  execute definition;

  select pg_get_functiondef('public.get_dashboard(text,uuid[],uuid)'::regprocedure) into definition;
  definition := replace(definition,
    $fragment$where ticket.status_code in ('todo', 'in_progress', 'in_review')
          and ticket.due_date < today$fragment$,
    $fragment$where ticket.status_code in ('todo', 'in_progress')
          and ticket.due_date < today$fragment$);
  definition := replace(definition,
    $fragment$max(ticket.due_date) filter (
        where ticket.status_code in ('todo', 'in_progress', 'in_review')
      ) as planned_until$fragment$,
    $fragment$max(ticket.due_date) filter (
        where ticket.status_code in ('todo', 'in_progress')
      ) as planned_until$fragment$);
  execute definition;
end;
$$;

do $$
declare
  definition text;
begin
  select pg_get_functiondef('public.get_reports(jsonb)'::regprocedure) into definition;
  definition := replace(definition,
    $fragment$archived_filter text := coalesce(nullif(filters ->> 'archived', ''), 'all')$fragment$,
    $fragment$archived_filter text := coalesce(nullif(filters ->> 'archived', ''), 'not_archived')$fragment$);
  definition := replace(definition,
    $fragment$when status_code in ('todo','in_progress','in_review') and due_date < period_end then 'overdue'$fragment$,
    $fragment$when private.work_item_is_overdue(id, period_end) then 'overdue'$fragment$);
  definition := replace(definition,
    $fragment$(select count(distinct entry.work_date)::integer from valid_entries entry where entry.work_item_id = item.id) as active_work_days$fragment$,
    $fragment$private.work_item_days_active(item.id, period_end) as active_work_days,
        private.work_item_days_open(item.id, period_end) as days_open,
        private.work_item_status_durations(item.id, period_end) as status_durations$fragment$);
  definition := replace(definition,
    $fragment$'activeWorkDays', row.active_work_days, 'workEntries', row.work_entries,$fragment$,
    $fragment$'daysOpen', row.days_open, 'activeWorkDays', row.active_work_days, 'workEntries', row.work_entries,
        'todoDays', (row.status_durations ->> 'todoDays')::integer,
        'inProgressDays', (row.status_durations ->> 'inProgressDays')::integer,
        'reviewDays', (row.status_durations ->> 'reviewDays')::integer,
        'pausedDays', (row.status_durations ->> 'pausedDays')::integer,$fragment$);
  definition := replace(definition,
    $fragment$from (select entry.work_date, count(distinct entry.work_item_id)::integer ticket_count from valid_entries entry group by entry.work_date) chart$fragment$,
    $fragment$from (select entry.work_date, count(distinct entry.work_item_id)::integer ticket_count from valid_entries entry
            where exists (select 1 from stale_rows scoped where scoped.id = entry.work_item_id)
            group by entry.work_date) chart$fragment$);
  definition := replace(definition,
    'from public.work_item_status_history history join ticket_ids selected on selected.id=history.work_item_id',
    'from public.work_item_status_history history join stale_rows selected on selected.id=history.work_item_id');
  definition := replace(definition,
    $fragment$and private.work_item_status_on(item.id,period_end) in ('todo','in_progress','in_review') and item.due_date<period_end) overdue_owned$fragment$,
    $fragment$and private.work_item_is_overdue(item.id, period_end)) overdue_owned$fragment$);
  definition := replace(definition,
    $fragment$and private.work_item_status_on(item.id,period_end) in ('todo','in_progress','in_review')
          and not private.work_item_archived_on(item.id,period_end)) planned_until$fragment$,
    $fragment$and private.work_item_status_on(item.id,period_end) in ('todo','in_progress')
          and not private.work_item_archived_on(item.id,period_end)) planned_until$fragment$);
  execute definition;

  select pg_get_functiondef('public.export_report_rows(text,jsonb)'::regprocedure) into definition;
  definition := replace(definition,
    $fragment$archived_filter text := coalesce(nullif(filters ->> 'archived', ''), 'all')$fragment$,
    $fragment$archived_filter text := coalesce(nullif(filters ->> 'archived', ''), 'not_archived')$fragment$);
  definition := replace(definition,
    $fragment$'daysOpen', greatest(0, period_end-item.created_at::date),
      'daysActive', (select count(distinct entry.work_date) from public.valid_work_log_entries entry where entry.work_item_id=item.id and entry.work_date between period_start and period_end),$fragment$,
    $fragment$'daysOpen', private.work_item_days_open(item.id, period_end),
      'daysActive', private.work_item_days_active(item.id, period_end),
      'todoDays', (private.work_item_status_durations(item.id, period_end) ->> 'todoDays')::integer,
      'inProgressDays', (private.work_item_status_durations(item.id, period_end) ->> 'inProgressDays')::integer,
      'reviewDays', (private.work_item_status_durations(item.id, period_end) ->> 'reviewDays')::integer,
      'pausedDays', (private.work_item_status_durations(item.id, period_end) ->> 'pausedDays')::integer,$fragment$);
  definition := replace(definition,
    $fragment$(due_filter='overdue' and item.due_date<period_end and item.status_at_end in('todo','in_progress','in_review'))$fragment$,
    $fragment$(due_filter='overdue' and private.work_item_is_overdue(item.id, period_end))$fragment$);
  definition := replace(definition,
    $fragment$(due_filter='not_overdue' and not(item.due_date<period_end and item.status_at_end in('todo','in_progress','in_review')))$fragment$,
    $fragment$(due_filter='not_overdue' and not private.work_item_is_overdue(item.id, period_end))$fragment$);
  execute definition;
end;
$$;

create or replace view public.review_return_deadline_remediation
with (security_barrier = true)
as
select distinct on (item.id)
  item.id as work_item_id,
  item.display_id,
  item.title,
  item.status_code,
  item.due_date as current_next_deadline,
  history.changed_at as returned_at,
  history.changed_on as returned_on
from public.work_items item
join public.work_item_status_history history
  on history.work_item_id = item.id
  and history.from_status_code = 'in_review'
  and history.to_status_code = 'in_progress'
where private.current_is_admin()
  and (item.due_date is null or item.due_date <= history.changed_on)
order by item.id, history.changed_at desc, history.id desc;

revoke all on public.review_return_deadline_remediation from public, anon, authenticated;
grant select on public.review_return_deadline_remediation to authenticated;

revoke execute on function private.is_working_day(date) from public, anon;
grant execute on function private.is_working_day(date) to authenticated;
revoke execute on function private.work_item_days_open(uuid,date) from public, anon, authenticated;
revoke execute on function private.work_item_days_active(uuid,date) from public, anon, authenticated;
revoke execute on function private.work_item_is_overdue(uuid,date) from public, anon, authenticated;
revoke execute on function private.work_item_status_durations(uuid,date) from public, anon, authenticated;

comment on view public.review_return_deadline_remediation is
  'Admin-only review list for historical In Review to In Progress returns whose replacement Next Deadline cannot be inferred safely.';

commit;
