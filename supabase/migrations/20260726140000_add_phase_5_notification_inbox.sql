-- Design Flow Phase 5, slice 3: recipient-only notification inbox reads.

begin;

create function public.get_notification_unread_count()
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  unread_count integer;
begin
  actor := private.require_application_user_read();
  select count(*)::integer into unread_count
  from public.notifications notification
  where notification.recipient_id = actor.id and notification.read_at is null;
  return unread_count;
end;
$$;

create function public.get_notification_inbox(requested_page integer default 1)
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
  if requested_page is null or requested_page < 1 then
    raise exception using errcode = 'P0001', message = 'DF_VALIDATION';
  end if;

  select jsonb_build_object(
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', page.id,
        'type', page.notification_type_code,
        'actor', jsonb_build_object('id', page.actor_id, 'displayName', page.actor_name),
        'workItem', jsonb_build_object(
          'id', page.work_item_id,
          'displayId', page.display_id,
          'title', page.title
        ),
        'statusLabel', page.status_label,
        'createdAt', page.created_at,
        'readAt', page.read_at
      ) order by page.created_at desc, page.id desc)
      from (
        select
          notification.*,
          event_actor.display_name as actor_name,
          item.display_id,
          item.title,
          status.display_label as status_label
        from public.notifications notification
        join public.profiles event_actor on event_actor.id = notification.actor_id
        join public.work_items item on item.id = notification.work_item_id
        left join public.work_item_events event on event.id = notification.source_event_id
        left join public.work_item_statuses status
          on status.code = event.new_values ->> 'status_code'
        where notification.recipient_id = actor.id
        order by notification.created_at desc, notification.id desc
        limit 25 offset ((requested_page - 1) * 25)
      ) page
    ), '[]'::jsonb),
    'unreadCount', (
      select count(*) from public.notifications notification
      where notification.recipient_id = actor.id and notification.read_at is null
    ),
    'totalCount', (
      select count(*) from public.notifications notification
      where notification.recipient_id = actor.id
    ),
    'page', requested_page,
    'pageSize', 25
  ) into result;
  return result;
end;
$$;

revoke all on function public.get_notification_unread_count() from public;
revoke all on function public.get_notification_inbox(integer) from public;
grant execute on function public.get_notification_unread_count() to authenticated;
grant execute on function public.get_notification_inbox(integer) to authenticated;

comment on function public.get_notification_inbox(integer) is
  'Returns only the authenticated recipient notification page with safe event summaries and no comment/blocker free text.';

commit;
