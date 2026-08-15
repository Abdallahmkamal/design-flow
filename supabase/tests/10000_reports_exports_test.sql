begin;

select plan(56);

select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000007',true);
set local role authenticated;

select set_config('design_flow.report_item',(
  public.create_work_item(
    '[SYNTHETIC TEST] Phase 6 report source','[SYNTHETIC TEST] PDF description',
    '50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',
    (current_date-5),(current_date+2),
    'https://www.figma.com/design/synthetic-phase-6',array['60000000-0000-4000-8000-000000000001']::uuid[],
    '91000000-0000-4000-8000-000000000001'
  )->>'id'
),true);
select public.transition_work_item_status(
  current_setting('design_flow.report_item')::uuid,'in_progress','backlog',
  (select updated_at from public.work_items where id=current_setting('design_flow.report_item')::uuid),
  false,'91000000-0000-4000-8000-000000000002'
);
select public.submit_work_log(
  'ticket',current_setting('design_flow.report_item')::uuid,null,
  '10000000-0000-4000-8000-000000000002',
  jsonb_build_array(
    jsonb_build_object('work_date',current_date-2,'work_type_code','ui_visual_design','description','[SYNTHETIC TEST] Primary source'),
    jsonb_build_object('work_date',current_date-1,'work_type_code','review_iteration','description','[SYNTHETIC TEST] Second date')
  ),null,'91000000-0000-4000-8000-000000000003'
);
select public.submit_work_log(
  'ticket',current_setting('design_flow.report_item')::uuid,null,
  '10000000-0000-4000-8000-000000000003',
  jsonb_build_array(jsonb_build_object('work_date',current_date-1,'work_type_code','team_support_collaboration','description','[SYNTHETIC TEST] Contribution')),
  null,'91000000-0000-4000-8000-000000000004'
);
select public.submit_work_log(
  'standalone_visual',null,'50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000003',
  jsonb_build_array(jsonb_build_object('work_date',current_date-1,'work_type_code','new_visual_asset','description','[SYNTHETIC TEST] Standalone source')),
  null,'91000000-0000-4000-8000-000000000005'
);
reset role;

insert into public.comments(id,work_item_id,author_id,body,created_at,withdrawn_by,withdrawn_at)
values('71000000-0000-4000-8000-000000000006',current_setting('design_flow.report_item')::uuid,
  '10000000-0000-4000-8000-000000000002','[SYNTHETIC TEST] Withdrawn secret body',statement_timestamp(),
  '10000000-0000-4000-8000-000000000004',statement_timestamp());

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select lives_ok($$select public.get_reports(jsonb_build_object('tab','tickets','periodStart',current_date-10,'periodEnd',current_date))$$,'Viewer reads Reports');
select is(public.get_reports()->>'defaultScopeKey','all','Viewer receives the whole-team read-only default');
select is((public.get_reports(jsonb_build_object('tab','tickets','periodStart',current_date-10,'periodEnd',current_date))->>'canExport')::boolean,false,'Viewer has no CSV control capability');
select throws_ok($$select public.export_report_rows('tickets','{}')$$,'P0001','DF_FORBIDDEN','Viewer cannot export CSV');
select throws_ok($$select public.get_work_item_export((select display_id from public.work_items where id=current_setting('design_flow.report_item')::uuid),false)$$,'P0001','DF_FORBIDDEN','Viewer cannot export PDF');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select is(public.get_reports(jsonb_build_object('tab','designers','periodStart',current_date-10,'periodEnd',current_date))->>'defaultScopeKey','me','Designer Reports defaults to Me');
select is((public.get_reports(jsonb_build_object('tab','designers','periodStart',current_date-10,'periodEnd',current_date))->>'canExport')::boolean,true,'Designer can export personal CSV');
select is((public.get_reports(jsonb_build_object('tab','designers','periodStart',current_date-10,'periodEnd',current_date))->>'totalCount')::integer,1,'Designer summary has one scoped person');
select is(jsonb_array_length(public.export_report_rows('designers',jsonb_build_object('periodStart',current_date-10,'periodEnd',current_date))->'rows'),1,'Designer exports one personal Designers row');
select throws_ok($$select public.get_reports(jsonb_build_object('scopeKey','all'))$$,'P0001','DF_FORBIDDEN','Designer cannot forge an all-people Reports read');
select is(jsonb_array_length(public.get_reports(jsonb_build_object('tab','designers','periodStart',current_date-10,'periodEnd',current_date))->'recordedActivity'),2,'Recorded activity preserves two valid entry rows');
select is((public.get_reports(jsonb_build_object('tab','designers','periodStart',current_date-10,'periodEnd',current_date))->'rows'->0->>'ticket_days')::integer,2,'Same ticket on two dates reconciles two ticket-days');
select is(jsonb_array_length(public.get_reports(jsonb_build_object('tab','designers','periodStart',current_date-10,'periodEnd',current_date))->'designerTickets'),1,'Individual designer owned/contribution disclosure reconciles one ticket');
select lives_ok(format('select public.get_work_item_export(%L,false)',(select display_id from public.work_items where id=current_setting('design_flow.report_item')::uuid)),'Designer can export visible Work Item PDF projection');
select is(jsonb_array_length(public.get_work_item_export((select display_id from public.work_items where id=current_setting('design_flow.report_item')::uuid),false)->'comments'),0,'PDF comments default off');
select is(public.get_work_item_export((select display_id from public.work_items where id=current_setting('design_flow.report_item')::uuid),true)->'comments'->0->>'body',null,'PDF never exposes withdrawn comment body');
select throws_ok($$select public.export_report_rows('tickets',jsonb_build_object('scopeKey','all'))$$,'P0001','DF_FORBIDDEN','Designer cannot forge an all-people CSV scope');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
set local role authenticated;
select is(public.get_reports()->>'defaultScopeKey','all','Designer Admin defaults Reports to All');
select is((public.get_reports()->>'canExport')::boolean,true,'Designer Admin receives CSV capability');
select is(jsonb_array_length(public.export_report_rows('tickets',jsonb_build_object('scopeKey','all','periodStart',current_date-10,'periodEnd',current_date))->'rows'),1,'Tickets CSV includes every matching ticket once');
select is(jsonb_array_length(public.export_report_rows('visual_work',jsonb_build_object('periodStart',current_date-10,'periodEnd',current_date))->'rows'),1,'Visual CSV stays separate');
select ok(public.export_report_rows('designers',jsonb_build_object('periodStart',current_date-10,'periodEnd',current_date))->'rows'->0 ? 'ticketsAssigned','Authorized Designers CSV uses the approved summary schema');
select is((public.export_report_rows('designers',jsonb_build_object('scopeKey','people','peopleIds',jsonb_build_array('10000000-0000-4000-8000-000000000002'),'areaIds',jsonb_build_array('50000000-0000-4000-8000-000000000002'),'periodStart',current_date-10,'periodEnd',current_date))->'rows'->0->>'workLogEntries')::integer,0,'Designers CSV metrics apply the current Area filter');
select is(jsonb_array_length(public.export_report_rows('tickets',jsonb_build_object('scopeKey','all','areaIds',jsonb_build_array('50000000-0000-4000-8000-000000000002'),'periodStart',current_date-10,'periodEnd',current_date))->'rows'),0,'Tickets CSV applies the current Area filter');
select is(jsonb_array_length(public.export_report_rows('visual_work',jsonb_build_object('scopeKey','all','areaIds',jsonb_build_array('50000000-0000-4000-8000-000000000002'),'periodStart',current_date-10,'periodEnd',current_date))->'rows'),0,'Visual CSV applies the current Area filter');
select is(jsonb_array_length(public.export_report_rows('visual_work',jsonb_build_object('scopeKey','all','areaUnassigned',true,'periodStart',current_date-10,'periodEnd',current_date))->'rows'),0,'Visual CSV preserves the explicit Unassigned Area filter');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
set local role authenticated;
select is(public.get_reports()->>'defaultScopeKey','lead:10000000-0000-4000-8000-000000000004','Lead keeps group default');
select lives_ok($$select public.export_report_rows('tickets','{}')$$,'Lead exports CSV');
select lives_ok($$select public.get_work_item_export((select display_id from public.work_items where id=current_setting('design_flow.report_item')::uuid),false)$$,'Lead exports PDF');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
set local role authenticated;
select is(public.get_reports()->>'defaultScopeKey','all','Lead Admin defaults Reports to All');
select lives_ok($$select public.export_report_rows('designers','{}')$$,'Lead Admin exports Designers CSV');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000006',true);
set local role authenticated;
select is(public.get_reports()->>'defaultScopeKey','all','Manager defaults Reports to All');
select lives_ok($$select public.export_report_rows('tickets','{}')$$,'Manager exports Tickets CSV');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000007',true);
set local role authenticated;
select is(public.get_reports()->>'defaultScopeKey','all','Manager Admin defaults Reports to All');
select lives_ok($$select public.export_report_rows('visual_work','{}')$$,'Manager Admin exports visual CSV');
select is((public.get_reports(jsonb_build_object('tab','tickets','scopeKey','all','periodStart',current_date-10,'periodEnd',current_date))->'cards'->>'ticketsWorkedOn')::integer,1,'Ticket card reconciles one worked-on ticket');
select is(jsonb_array_length(public.get_reports(jsonb_build_object('tab','tickets','scopeKey','all','periodStart',current_date-10,'periodEnd',current_date))->'cardSources'->'ticketsWorkedOn'),1,'Ticket card source preview reconciles independently of paginated detail rows');
select is((public.get_reports(jsonb_build_object('tab','tickets','scopeKey','all','periodStart',current_date-10,'periodEnd',current_date))->'rows'->0->>'activeWorkDays')::integer,2,'Ticket active days deduplicate people on the same date');
select is((public.get_reports(jsonb_build_object('tab','visual_work','scopeKey','all','periodStart',current_date-10,'periodEnd',current_date))->'cards'->>'visualActivityDays')::integer,1,'Visual activity-day reconciles separately');
select is(jsonb_array_length(public.get_reports(jsonb_build_object('tab','visual_work','scopeKey','all','periodStart',current_date-10,'periodEnd',current_date))->'cardSources'->'visualActivityDays'),1,'Visual activity-day card source preview reconciles separately');
select is((public.get_reports(jsonb_build_object('tab','tickets','scopeKey','all','statuses',jsonb_build_array('backlog'),'periodStart',current_date-10,'periodEnd',current_date))->>'totalCount')::integer,0,'Ticket status filter reconciles');
select is((public.get_reports(jsonb_build_object('tab','tickets','scopeKey','all','labelIds',jsonb_build_array('60000000-0000-4000-8000-000000000002'),'periodStart',current_date-10,'periodEnd',current_date))->>'totalCount')::integer,0,'Ticket label filter reconciles');
select is((public.get_reports(jsonb_build_object('tab','tickets','scopeKey','all','workTypes',jsonb_build_array('ui_visual_design'),'periodStart',current_date-10,'periodEnd',current_date))->>'totalCount')::integer,1,'Ticket work-type filter reconciles');
select is((public.get_reports(jsonb_build_object('tab','tickets','scopeKey','all','blocked','blocked','periodStart',current_date-10,'periodEnd',current_date))->>'totalCount')::integer,0,'Blocked filter reconciles');
select is((public.get_reports(jsonb_build_object('tab','tickets','scopeKey','all','due','no_due_date','periodStart',current_date-10,'periodEnd',current_date))->>'totalCount')::integer,0,'Due-state filter reconciles');
select is((public.get_reports(jsonb_build_object('tab','tickets','scopeKey','all','archived','archived','periodStart',current_date-10,'periodEnd',current_date))->>'totalCount')::integer,0,'Archived-state filter reconciles');
select is((public.get_reports(jsonb_build_object('tab','tickets','scopeKey','all','stale','stale','periodStart',current_date-10,'periodEnd',current_date))->>'totalCount')::integer,0,'Sunday-through-Thursday stale filter reconciles recent actual work');
select is((public.get_reports(jsonb_build_object('tab','visual_work','scopeKey','all','visualTypes',jsonb_build_array('new_visual_asset'),'periodStart',current_date-10,'periodEnd',current_date))->>'totalCount')::integer,1,'Visual-work type filter reconciles');
select is((public.get_reports(jsonb_build_object('tab','visual_work','scopeKey','all','edited','not_edited','periodStart',current_date-10,'periodEnd',current_date))->>'totalCount')::integer,1,'Visual edited-state filter reconciles');
select is((public.get_reports(jsonb_build_object('tab','visual_work','scopeKey','all','loggedBy','10000000-0000-4000-8000-000000000007','periodStart',current_date-10,'periodEnd',current_date))->>'totalCount')::integer,1,'Visual submitter filter reconciles without moving work credit');
select throws_ok($$select public.export_report_rows('unapproved','{}')$$,'P0001','DF_VALIDATION','Unapproved export type is rejected');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000008',true);
set local role authenticated;
select throws_ok($$select public.get_reports()$$,'P0001','DF_ACCOUNT_INACTIVE','Inactive principal cannot read Reports');
select throws_ok($$select public.get_work_item_export('DF-000001',false)$$,'P0001','DF_ACCOUNT_INACTIVE','Inactive principal cannot export PDF');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000009',true);
set local role authenticated;
select throws_ok($$select public.get_reports()$$,'P0001','DF_PASSWORD_CHANGE_REQUIRED','Password-restricted principal cannot read Reports');
select throws_ok($$select public.export_report_rows('tickets','{}')$$,'P0001','DF_PASSWORD_CHANGE_REQUIRED','Password-restricted principal cannot export');
reset role;

select is_empty('select 1 from public.profiles where position_code=''viewer'' and is_admin','Viewer Admin remains rejected');

select * from finish();
rollback;
