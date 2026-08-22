# Work Item specification

**Version:** 1.2
**Decision date:** 2026-07-16  
**Status:** Approved MVP baseline with D-110 route-backed Ticket Details and D-118 metric/deadline amendments

The Work Item page is the complete source for a ticket's current state, planned dates, actual work, ownership and contribution, subtasks, discussion, blockers, and preserved history.

## Team-ready amendment

Modernization Slice 4 retains `/work-items/:displayId` as the canonical route but makes Ticket Details the primary operational presentation: a wider right overlay over All Tickets on desktop and full-screen route-backed view on mobile. Direct visits still establish a usable Work Items context. Browser Back/close preserves URL-backed list state and restores launcher focus where possible.

- Ticket name, description, status, one primary assignee, Area, planned start, next deadline, labels, and Figma URL are edited inline through their existing permissioned operations; no general Edit mode is added.
- Contributors remain read-only and derived from work logs. The reviewed multi-assignee direction is intentionally deferred until after rollout.
- The work calendar shows Sunday–Thursday rows from first through latest valid log week, preserves internal empty weeks, and visualizes log counts rather than effort.
- Activity & Work Log merges ticket-change events and dated work entries by effective activity date. Comments remain a separate final section even though meaningful comment activity updates Last Activity.
- Existing blocker, subtask, comment, PDF, audit/history, and direct-route contracts remain unchanged unless the handoff explicitly refines their presentation.

## 1. Header and at-a-glance summary

### Primary row

- Ticket display ID and title
- Workflow status and separate Blocked indicator
- Open in Figma when a Figma URL exists
- Log Work for Designer, Lead, Manager, and Admin-privileged users
- Edit for users permitted to edit the ticket
- Overflow actions, including eligible archive/restore and Export work item

### Summary row

- Area/Squad
- Labels, with visual overflow such as `+n`
- Primary assignee and derived contributors
- Next Deadline with overdue/due-soon treatment
- Derived subtask completion badge
- Days Active

`Days Active` is the number of distinct Sunday–Thursday dates on which anyone recorded valid ticket work. Multiple people or entries on the same ticket and date still count once. Friday/Saturday work remains visible but does not increase the metric. It is not a duration or effort measure.

On narrow screens the summary may wrap or become an expandable summary block, but the status, Next Deadline, Area/Squad, and Days Active remain easy to reach.

## 2. Page hierarchy

Use this content order:

1. Header and at-a-glance summary
2. Active blocker, when present
3. Details and description
4. Subtasks
5. Recorded work overview and Work Dates grid
6. Vertical activity timeline
7. Comments

Desktop may use a secondary details column as long as this hierarchy and the prominent blocker state are preserved. Mobile uses a single readable flow.

## 3. Active blocker

When a blocker is active, show it prominently near the top rather than burying it in metadata.

- Reason
- Who marked it and when
- Optional expected-resolution date
- Resolve action for an authorized user
- Resolution requires closing the current blocker record before moving the ticket to Backlog, Paused, or Done

Resolved blockers move into history and are never deleted.

## 4. Details

Show:

- Description
- Area/Squad
- Primary assignee and contributors
- Planned start and Next Deadline
- Labels
- Figma direct link
- Created date
- First actual work date, when available
- Last worked on
- Last activity time, clearly distinguished from Last worked on

Planned dates and actual work dates must be visually separated. Never imply continuous work between planned start and Next Deadline.

Status and primary assignee may use direct controlled actions. Other editable fields may use an Edit work item flow. All changes remain subject to position/Admin-privilege permissions and audit history.

## 5. Subtasks

- Show the full one-level checklist only on this page.
- Allow authorized users to add, rename, reorder, complete, reopen, and withdraw checklist items.
- Preserve creator/completer and timestamps.
- Completing all subtasks does not complete the parent automatically.
- Moving the parent to Done with incomplete subtasks warns but may proceed.
- Subtasks do not receive independent assignees, statuses, dates, work logs, comments, labels, or Figma URLs.

## 6. Work Dates grid

The Work Dates grid is a compact visual index of actual work, not a calendar.

- Use five columns on desktop.
- Start with the ticket's first distinct actual work date and end with its latest.
- Include only dates with valid recorded ticket work; do not insert empty calendar dates.
- Sort the cells chronologically.
- Friday and Saturday appear normally when work was actually logged.
- Show the date, involved designer avatars/count, and a compact work-type summary.
- Multiple people or entries on one date remain inside one date cell.
- Selecting a cell navigates or filters the vertical timeline to that date.
- For long tickets, the default may show the most recent rows with Show all to reveal the full grid.
- Mobile may use fewer columns or horizontal movement without changing the date semantics.

Label the component **Work Dates** so it cannot be mistaken for a continuous calendar or scheduled work plan.

## 7. Vertical timeline

The vertical timeline is the primary history presentation. It groups meaningful activity by date and supports filtering where useful.

Include:

- Ticket creation
- Valid work logs, showing actual work date, designer, primary/contributor relationship, work type, and optional description
- Status transitions, including Done and reopen events
- Primary-assignee changes
- Blocker creation and resolution
- Meaningful field and label changes
- Work-log corrections and withdrawals
- Subtask changes
- Archive and restore events

A multi-date submission may appear as a grouped event, but every actual work date and its type remains visible and independently addressable. Comments remain in their own section rather than being treated as reported work.

Do not add a conventional monthly calendar in the MVP. The Work Dates grid supplies the approved visual overview while the timeline supplies the full narrative and audit trail.

## 8. Comments

- Keep comments separate from work logs and the reporting timeline.
- Show plain-text comments in conversation order with author and timestamp.
- Authors may edit their own comments; Leads, Managers, and Admin-privileged users may moderate under the approved rules.
- Edited and withdrawn states remain explicit without exposing withdrawn bodies in normal view.
- Comments update Last activity, never Last worked on or work reporting.

## 9. Export work item

Designer, Lead, Manager, and Admin-privileged users may export a visible Work Item. Viewer may read the Work Item and its normal history but cannot export it and cannot hold Admin privilege.

The MVP export is a human-readable PDF containing:

- Ticket ID/title and generation metadata
- Current status and blocker state
- Description
- Area/Squad and labels
- Primary assignee and contributors
- Planned dates, first/last actual work dates, and Days Active
- Clickable Figma URL without embedding or fetching Figma content
- Current and historical blockers
- Subtasks and completion states
- Chronological work logs
- Status and assignment history
- Meaningful field-change events

Provide an **Include comments** option that is off by default. The normal export represents withdrawn content only as a withdrawal event and does not reveal its former body.

The Work Item PDF is distinct from Reports CSV exports. A machine-oriented ticket audit package is deferred unless a later portability need justifies it.

## 10. Actions and permissions

- Designer may log work on any visible ticket; non-primary work produces derived contribution.
- Lead, Manager, and Admin-privileged users may log on another person's behalf.
- Figma opens directly and does not trigger page or row navigation.
- Archive/restore appears only to Lead, Manager, and Admin-privileged users and only under eligible status rules.
- A Viewer remains read-only, receives no mutating actions, and cannot hold Admin privilege.

## 11. Acceptance criteria

- The header exposes Area/Squad, labels, Next Deadline, ownership, subtask progress, and Days Active without requiring navigation into details.
- Days Active counts distinct valid Sunday–Thursday ticket work dates without double-counting people or entries; Friday/Saturday logs remain visible without increasing it.
- The blocker remains independent from status and is prominent when active.
- Planned and actual dates cannot be confused visually or semantically.
- Subtasks remain parent-only checklist records.
- Work Dates contains only actual work dates, uses five desktop columns, and includes manually logged Friday/Saturday work.
- Selecting a Work Dates cell reaches the matching timeline activity.
- The vertical timeline preserves ownership, workflow, blocker, work-log, and meaningful field history.
- PDF export contains the approved snapshot/history sections, keeps comments opt-in, and never exposes withdrawn bodies.
- Ticket work, comments, and system/audit history remain distinguishable.
- Mobile preserves the content hierarchy and independent Figma/Log Work actions.
