begin;

select plan(27);

insert into public.operation_requests (
  id,
  operation_code,
  actor_id,
  request_hash,
  state,
  result,
  completed_at
)
values (
  '70000000-0000-4000-8000-000000000001',
  'permission_test_fixture',
  '10000000-0000-4000-8000-000000000007',
  encode(
    extensions.digest(
      '70000000-0000-4000-8000-000000000001',
      'sha256'
    ),
    'hex'
  ),
  'completed',
  '{"synthetic": true}'::jsonb,
  statement_timestamp()
);

insert into public.work_items (
  id,
  title,
  area_id,
  created_by
)
values (
  '70000000-0000-4000-8000-000000000002',
  '[SYNTHETIC TEST] Permission fixture',
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002'
);

insert into public.work_item_events (
  id,
  work_item_id,
  event_type_code,
  actor_id,
  subject_type,
  subject_id,
  new_values,
  operation_id
)
values (
  '70000000-0000-4000-8000-000000000003',
  '70000000-0000-4000-8000-000000000002',
  'comment_added',
  '10000000-0000-4000-8000-000000000004',
  'comment',
  null,
  '{"synthetic": true}'::jsonb,
  '70000000-0000-4000-8000-000000000001'
);

insert into public.notifications (
  id,
  recipient_id,
  actor_id,
  work_item_id,
  source_event_id,
  notification_type_code
)
values (
  '70000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004',
  '70000000-0000-4000-8000-000000000002',
  '70000000-0000-4000-8000-000000000003',
  'comment_added'
);

insert into public.admin_audit_events (
  id,
  event_type_code,
  actor_id,
  subject_type,
  subject_id,
  new_values,
  operation_id
)
values (
  '70000000-0000-4000-8000-000000000005',
  'team_timezone_changed',
  '10000000-0000-4000-8000-000000000007',
  'team_settings',
  null,
  '{"synthetic": true}'::jsonb,
  '70000000-0000-4000-8000-000000000001'
);

insert into public.comments (
  id,
  work_item_id,
  author_id,
  body
)
values (
  '70000000-0000-4000-8000-000000000006',
  '70000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000002',
  '[SYNTHETIC TEST] Visible comment'
);

insert into public.comments (
  id,
  work_item_id,
  author_id,
  body,
  withdrawn_by,
  withdrawn_at
)
values (
  '70000000-0000-4000-8000-000000000007',
  '70000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000002',
  '[SYNTHETIC TEST] Withdrawn body must remain hidden',
  '10000000-0000-4000-8000-000000000004',
  statement_timestamp()
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select is(
  format(
    '%s|%s|%s',
    private.is_application_user(),
    (select count(*) from public.team_directory),
    (select count(*) from public.work_item_statuses)
  ),
  't|8|6',
  'Viewer receives the approved whole-team read surface'
);
select is(
  format(
    '%s|%s|%s|%s|%s',
    private.current_is_admin(),
    private.can_export_reports(),
    private.can_export_work_item(),
    private.can_manage_settings(),
    private.can_moderate_comments()
  ),
  'f|f|f|f|f',
  'Viewer has no Admin, export, settings, or moderation capability'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);
set local role authenticated;

select is(
  format(
    '%s|%s|%s',
    private.is_application_user(),
    (select count(*) from public.team_directory),
    (select count(*) from public.work_item_statuses)
  ),
  't|8|6',
  'Designer receives the approved whole-team read surface'
);
select is(
  format(
    '%s|%s|%s|%s|%s',
    private.current_is_admin(),
    private.can_export_reports(),
    private.can_export_work_item(),
    private.can_manage_settings(),
    private.can_moderate_comments()
  ),
  'f|f|t|f|f',
  'Designer receives only the approved base capabilities'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000003',
  true
);
set local role authenticated;

select is(
  format(
    '%s|%s|%s',
    private.is_application_user(),
    (select count(*) from public.team_directory),
    (select count(*) from public.work_item_statuses)
  ),
  't|8|6',
  'Designer + Admin receives the approved whole-team read surface'
);
select is(
  format(
    '%s|%s|%s|%s|%s',
    private.current_is_admin(),
    private.can_export_reports(),
    private.can_export_work_item(),
    private.can_manage_settings(),
    private.can_moderate_comments()
  ),
  't|t|t|t|t',
  'Designer + Admin receives the independent Admin overlay'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000004',
  true
);
set local role authenticated;

select is(
  format(
    '%s|%s|%s',
    private.is_application_user(),
    (select count(*) from public.team_directory),
    (select count(*) from public.work_item_statuses)
  ),
  't|8|6',
  'Lead receives the approved whole-team read surface'
);
select is(
  format(
    '%s|%s|%s|%s|%s',
    private.current_is_admin(),
    private.can_export_reports(),
    private.can_export_work_item(),
    private.can_manage_settings(),
    private.can_moderate_comments()
  ),
  'f|t|t|f|t',
  'Lead receives operational, export, and moderation capability without Settings'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000005',
  true
);
set local role authenticated;

select is(
  format(
    '%s|%s|%s',
    private.is_application_user(),
    (select count(*) from public.team_directory),
    (select count(*) from public.work_item_statuses)
  ),
  't|8|6',
  'Lead + Admin receives the approved whole-team read surface'
);
select is(
  format(
    '%s|%s|%s|%s|%s',
    private.current_is_admin(),
    private.can_export_reports(),
    private.can_export_work_item(),
    private.can_manage_settings(),
    private.can_moderate_comments()
  ),
  't|t|t|t|t',
  'Lead + Admin receives the independent Admin overlay'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000006',
  true
);
set local role authenticated;

select is(
  format(
    '%s|%s|%s',
    private.is_application_user(),
    (select count(*) from public.team_directory),
    (select count(*) from public.work_item_statuses)
  ),
  't|8|6',
  'Manager receives the approved whole-team read surface'
);
select is(
  format(
    '%s|%s|%s|%s|%s',
    private.current_is_admin(),
    private.can_export_reports(),
    private.can_export_work_item(),
    private.can_manage_settings(),
    private.can_moderate_comments()
  ),
  'f|t|t|f|t',
  'Manager receives operational, export, and moderation capability without Settings'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000007',
  true
);
set local role authenticated;

select is(
  format(
    '%s|%s|%s',
    private.is_application_user(),
    (select count(*) from public.team_directory),
    (select count(*) from public.work_item_statuses)
  ),
  't|8|6',
  'Manager + Admin receives the approved whole-team read surface'
);
select is(
  format(
    '%s|%s|%s|%s|%s',
    private.current_is_admin(),
    private.can_export_reports(),
    private.can_export_work_item(),
    private.can_manage_settings(),
    private.can_moderate_comments()
  ),
  't|t|t|t|t',
  'Manager + Admin receives the independent Admin overlay'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000008',
  true
);
set local role authenticated;

select is(
  format(
    '%s|%s|%s|%s',
    private.is_application_user(),
    (select count(*) from public.team_directory),
    (select count(*) from public.work_item_statuses),
    (select count(*) from public.profiles)
  ),
  'f|0|0|0',
  'inactive principals receive no normal or own-account application rows'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000009',
  true
);
set local role authenticated;

select is(
  format(
    '%s|%s|%s|%s',
    private.is_application_user(),
    (select count(*) from public.team_directory),
    (select count(*) from public.work_item_statuses),
    (select count(*) from public.profiles)
  ),
  'f|1|0|1',
  'password-restricted principals receive only their own minimal profile row'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.admin_audit_events),
  0,
  'a non-Admin cannot read Admin audit events'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000003',
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.admin_audit_events),
  1,
  'an Admin-privileged principal can read Admin audit events'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.notifications),
  1,
  'a recipient can read their own notification'
);

select is(
  format(
    '%s|%s',
    (select count(*) from public.visible_comments),
    (
      select count(*)
      from public.visible_comments
      where withdrawn_at is not null and body is not null
    )
  ),
  '2|0',
  'the comment view retains withdrawal markers without withdrawn bodies'
);

select throws_ok(
  $$select count(*) from public.comments$$,
  '42501',
  null,
  'the browser cannot bypass the masked comment view'
);

with updated_notification as (
  update public.notifications
  set read_at = '2099-01-01 00:00:00+00'
  where id = '70000000-0000-4000-8000-000000000004'
  returning id
)
select is(
  (select count(*)::integer from updated_notification),
  1,
  'a recipient can mark their own notification read'
);

select isnt(
  (
    select read_at
    from public.notifications
    where id = '70000000-0000-4000-8000-000000000004'
  ),
  '2099-01-01 00:00:00+00'::timestamptz,
  'the database replaces a client-supplied read time with its server timestamp'
);

update public.notifications
set read_at = null
where id = '70000000-0000-4000-8000-000000000004';

select ok(
  (
    select read_at is not null
    from public.notifications
    where id = '70000000-0000-4000-8000-000000000004'
  ),
  'a recipient cannot mark a read notification unread'
);

select throws_ok(
  $$
    update public.notifications
    set recipient_id = '10000000-0000-4000-8000-000000000001'
    where id = '70000000-0000-4000-8000-000000000004'
  $$,
  '42501',
  null,
  'the browser cannot change any notification column except read_at'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.notifications),
  0,
  'a non-recipient cannot read another principal notification'
);

with updated_notification as (
  update public.notifications
  set read_at = statement_timestamp()
  where id = '70000000-0000-4000-8000-000000000004'
  returning id
)
select is(
  (select count(*)::integer from updated_notification),
  0,
  'a non-recipient cannot update another principal notification'
);

reset role;

select * from finish();

rollback;
