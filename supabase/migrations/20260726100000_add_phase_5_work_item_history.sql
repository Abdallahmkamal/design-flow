-- Design Flow Phase 5, slice 1: sanitized Work Item History read model.

begin;

create function public.get_work_item_history(target_work_item_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  result jsonb;
begin
  actor := private.require_application_user_read();

  if not exists (
    select 1 from public.work_items item where item.id = target_work_item_id
  ) then
    return null;
  end if;

  select jsonb_build_object(
    'workDates', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', grouped.work_date,
          'people', grouped.people,
          'workTypes', grouped.work_types
        ) order by grouped.work_date
      )
      from (
        select
          entry.work_date,
          jsonb_agg(distinct jsonb_build_object(
            'id', worked_by.id,
            'displayName', worked_by.display_name
          )) as people,
          jsonb_agg(distinct entry.work_type_code order by entry.work_type_code) as work_types
        from public.valid_work_log_entries entry
        join public.profiles worked_by on worked_by.id = entry.worked_by
        where entry.work_item_id = target_work_item_id
        group by entry.work_date
      ) grouped
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', event.id,
          'type', event.event_type_code,
          'actor', jsonb_build_object(
            'id', event.actor_id,
            'displayName', event_actor.display_name
          ),
          'subjectType', event.subject_type,
          'subjectId', event.subject_id,
          'occurredAt', event.occurred_at,
          'changedFields', case
            when event.event_type_code = 'core_fields_changed' then coalesce((
              select jsonb_agg(
                case field.key
                  when 'title' then 'Title'
                  when 'description_present' then 'Description'
                  when 'area_id' then 'Area/Squad'
                  when 'planned_start_date' then 'Planned start'
                  when 'due_date' then 'Due date'
                  when 'figma_url' then 'Figma link'
                  else field.key
                end order by field.key
              )
              from jsonb_object_keys(coalesce(event.new_values, '{}'::jsonb)) field(key)
              where event.previous_values -> field.key
                is distinct from event.new_values -> field.key
            ), '[]'::jsonb)
            else '[]'::jsonb
          end,
          'statusFrom', case when event.event_type_code in ('status_changed', 'reopened')
            then event.previous_values ->> 'status_code' else null end,
          'statusTo', case when event.event_type_code in ('status_changed', 'reopened')
            then event.new_values ->> 'status_code' else null end,
          'assigneeFrom', case when event.event_type_code = 'assignment_changed' then (
            select profile.display_name
            from public.profiles profile
            where profile.id = nullif(event.previous_values ->> 'assignee_id', '')::uuid
          ) else null end,
          'assigneeTo', case when event.event_type_code = 'assignment_changed' then (
            select profile.display_name
            from public.profiles profile
            where profile.id = nullif(event.new_values ->> 'assignee_id', '')::uuid
          ) else null end,
          'labelsBefore', case when event.event_type_code = 'labels_changed' then coalesce((
            select jsonb_agg(label.name::text order by label.sort_order, label.name)
            from jsonb_array_elements_text(coalesce(event.previous_values -> 'label_ids', '[]'::jsonb)) value
            join public.labels label on label.id = value::uuid
          ), '[]'::jsonb) else '[]'::jsonb end,
          'labelsAfter', case when event.event_type_code = 'labels_changed' then coalesce((
            select jsonb_agg(label.name::text order by label.sort_order, label.name)
            from jsonb_array_elements_text(coalesce(event.new_values -> 'label_ids', '[]'::jsonb)) value
            join public.labels label on label.id = value::uuid
          ), '[]'::jsonb) else '[]'::jsonb end,
          'workLog', case
            when event.event_type_code in (
              'work_log_submitted', 'work_log_corrected', 'work_log_withdrawn'
            ) then (
              select jsonb_build_object(
                'workedBy', jsonb_build_object(
                  'id', worked_by.id,
                  'displayName', worked_by.display_name
                ),
                'loggedBy', jsonb_build_object(
                  'id', logged_by.id,
                  'displayName', logged_by.display_name
                ),
                'submittedAt', batch.created_at,
                'editedAt', batch.edited_at,
                'withdrawnAt', batch.withdrawn_at,
                'entries', case
                  when batch.withdrawn_at is null
                    and batch.work_item_id = target_work_item_id
                    and event.id = (
                      select latest.id
                      from public.work_item_events latest
                      where latest.subject_type = 'work_log_batch'
                        and latest.subject_id = batch.id
                        and latest.event_type_code in (
                          'work_log_submitted', 'work_log_corrected', 'work_log_withdrawn'
                        )
                      order by latest.occurred_at desc, latest.id desc
                      limit 1
                    )
                  then coalesce((
                    select jsonb_agg(jsonb_build_object(
                      'id', entry.id,
                      'workDate', entry.work_date,
                      'workTypeCode', entry.work_type_code,
                      'workTypeLabel', work_type.display_label,
                      'description', entry.description,
                      'relationship', case when batch.worked_by = (
                        select assignment.assignee_id
                        from public.work_item_assignments assignment
                        where assignment.work_item_id = batch.work_item_id
                          and assignment.started_on <= entry.work_date
                          and (
                            assignment.ended_on is null
                            or assignment.ended_on >= entry.work_date
                          )
                        order by assignment.started_on desc, assignment.started_at desc
                        limit 1
                      ) then 'primary' else 'contributor' end
                    ) order by entry.work_date, entry.position)
                    from public.work_log_entries entry
                    join public.work_type_definitions work_type
                      on work_type.code = entry.work_type_code
                    where entry.batch_id = batch.id and entry.withdrawn_at is null
                  ), '[]'::jsonb)
                  else '[]'::jsonb
                end
              )
              from public.work_log_batches batch
              join public.profiles worked_by on worked_by.id = batch.worked_by
              join public.profiles logged_by on logged_by.id = batch.logged_by
              where batch.id = event.subject_id
            )
            else null
          end
        ) order by event.occurred_at, event.id
      )
      from public.work_item_events event
      join public.profiles event_actor on event_actor.id = event.actor_id
      where event.work_item_id = target_work_item_id
        and event.event_type_code in (
          'created', 'core_fields_changed', 'labels_changed', 'assignment_changed',
          'status_changed', 'reopened', 'blocker_created', 'blocker_resolved',
          'subtask_added', 'subtask_renamed', 'subtask_reordered',
          'subtask_completed', 'subtask_reopened', 'subtask_withdrawn',
          'work_log_submitted', 'work_log_corrected', 'work_log_withdrawn',
          'archived', 'restored'
        )
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_work_item_history(uuid) from public;
grant execute on function public.get_work_item_history(uuid) to authenticated;

comment on function public.get_work_item_history(uuid) is
  'Returns sanitized Phase 5 Work Item history and current actual-date index for an eligible application principal.';

commit;
