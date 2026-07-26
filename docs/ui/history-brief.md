# Work Item History brief

**Status:** Phase 5 complete — staging acceptance verified on 2026-07-26

**Route:** `/work-items/:displayId`

**Phase:** 5 — Operational Experience

## Purpose and users

Finish the Work Item's authoritative actual-date index and audit narrative so
planned dates, actual `work_date`, and system occurrence timestamps cannot be
confused. Every valid active principal may read sanitized team history. Viewer
is read-only. Existing capability flags continue to own Log Work correction and
withdrawal actions; no history view grants mutation authority.

Entry is the Work Item route from All Tickets, Dashboard source drill-down, or
Notifications. A Dashboard recent-work link may target a specific actual-date
cell/event. Comments remain in their separate conversation section.

## Information hierarchy and date semantics

The existing Work Item hierarchy remains: details separate planned start/due
dates from first/last actual work dates and Last activity; **Work Dates** then
indexes valid actual work; the vertical timeline follows as the complete
sanitized narrative.

- Work Dates contains only distinct non-withdrawn ticket `work_date` values,
  first to last, five columns on desktop. It never inserts empty dates or
  implies a continuous schedule. Friday/Saturday appear when actually logged.
- Each cell shows date, involved people/count, and compact work types. Selecting
  it focuses the matching actual-date records in the timeline.
- Timeline system events retain their team-local occurrence date/time and
  actor. Work-log rows additionally label every actual `work_date`; backfilled
  work therefore shows both when work happened and when it was submitted.
- A multi-date submission may remain grouped by its source event, but each
  actual date/type has its own anchor and can be reached from Work Dates or a
  Dashboard drill-down.

## Timeline content and rules

Include ticket creation, valid work logs, corrections/withdrawals, status and
reopen transitions, assignee changes, blocker create/resolve, meaningful
field/label changes, subtasks, archive, and restore. Work entries identify
`worked_by`, primary/contributor relationship effective on that actual date,
work type, and optional permitted description.

Correction preserves original/audit context while presenting the current valid
dates. Withdrawal removes entries from Work Dates, contributor/current
first-last-work derivations, and active work days, while keeping a sanitized
withdrawal event. Normal history never reveals withdrawn comment/work bodies or
restricted revisions. Ticket work, system/audit events, and comments remain
visually and semantically distinct.

## Components and ownership

Reuse `Avatar`, `Badge`, `Button`, and the existing Work Item compositions
`WorkDatesGrid`, `LifecycleTimeline`, and `WorkLogTimelineEvent`. Extend those
feature compositions rather than adding Calendar, Tabs, Timeline, or Card as
new shared primitives. Work Dates/timeline read through the feature API/domain
layer; shared UI never calls Supabase.

## Desktop, mobile, and interaction

Desktop retains five Work Dates columns and a single vertical narrative with
clear event-type/date hierarchy. Mobile uses fewer columns or contained
horizontal movement for the index only; the timeline stays in normal document
flow without horizontal scrolling. Date cells are native links/buttons with
complete accessible names.

Work Dates selection updates the URL fragment/date target, focuses the timeline
date heading or first matching record, and announces the number of matches.
Native Tab/Shift+Tab and Enter/Space behavior is preserved. Focus after a
successful correction/withdrawal returns to the refreshed event/date context;
removed targets fall back to the Work Dates heading with an explanation.

## Required states

- Loading preserves section headings and distinguishes detail, Work Dates, and
  timeline loading.
- No recorded work shows explicit actual-work absence without hiding lifecycle
  history or presenting planned dates as a substitute.
- A requested actual date with no current valid entries explains that it was
  corrected/withdrawn or is unavailable and offers return to all history.
- Errors preserve readable Work Item context and offer scoped Retry. Permission
  loss uses the normal Work Item boundary.
- Long descriptions, names, labels, and event details wrap; recent-row
  disclosure never makes older history inaccessible.

## References and acceptance

Presentation and behavior reuse ready notes in
`references/astryx/{avatar,badge,button,table,patterns,accessibility}.md` plus
the approved Phase 3/4 Work Item and Log Work briefs. Vodafone color/type and
existing aliases remain authoritative; no new shared component or presentation
fallback is proposed.

Acceptance requires five-column desktop actual-date indexing; mobile and
keyboard access; Friday/Saturday and multi-person/date cases; deep links from
Dashboard; explicit actual-versus-submitted timestamps; complete sanitized
lifecycle coverage; correction/withdrawal recalculation; no withdrawn-body
leak; Viewer and all capability overlays; empty/error/long-content states;
axe/Light/Dark checks; and staging verification against labelled synthetic
history.

## Open questions

None. Material changes require a new readiness decision.

## Staging acceptance evidence

- DF-000003 exposed distinct actual Work Dates for Jul 21 and Jul 22, with deep
  links into the matching work-log timeline events.
- Timeline entries retained later submission timestamps and actor attribution;
  the details rail separately showed planned start, due date, first/last worked
  dates, last system activity, and 2 active work days.
- Synthetic correction links remained permission-gated, withdrawn content was
  absent, and standalone Visual Work remained outside ticket history.
- Automated coverage verifies correction/withdrawal recalculation, Viewer and
  all capability overlays, mobile/keyboard/axe behavior, and denial states.
