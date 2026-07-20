# MVP product specification

**Version:** 1.0 — approved MVP product and UI baseline  
**Checkpoint date:** 2026-07-16  
**Status:** Approved product documentation checkpoint; technical and build plans approved

**Last amended:** 2026-07-20 — D-101 adds the single-person recorded ticket activity drill-down

This document is the current product source of truth for Design Flow. It records approved MVP behavior, not every idea discussed while reaching it. Open decisions are listed at the end and must not be invented during implementation.

## 1. Product purpose

Build a lightweight, mobile-first work-management portal for one internal UX/design team. It replaces only the limited Jira behavior the team needs; it is not a Jira clone.

The portal must answer:

- What is each designer responsible for now?
- What did each designer actually work on, and on which dates?
- How did a work item evolve, including pauses, reopenings, blockers, assistance, and completion?
- How much capacity is going to ticket work versus standalone visual/graphic requests?
- What can Leads and Managers export as an understandable weekly or monthly record?

### Product constraints

- Keep the MVP lean and build it module by module.
- Keep normal usage within free hosting and Supabase allowances.
- Store structured work records and one optional Figma URL; do not upload files.
- Do not store sensitive customer or production data.
- Preserve auditability and portable CSV exports.
- Provide a human-readable Work Item PDF export for Designer, Lead, Manager, and any Admin-privileged user; comments are optional and off by default.
- Prefer explainable metrics over productivity scores.

### UI-system architecture

- Vodafone Foundations are authoritative for product color and typography, including semantic color modes and role-based text styles.
- Design Flow owns its shared component library under `src/ui/`.
- Astryx is the preferred reference baseline for non-color, non-typographic component presentation and engineering: anatomy, proportions, density, sizing, internal spacing, shape, border and elevation geometry, motion, interactions, accessibility, keyboard behavior, states, responsiveness, and implementation recommendations.
- Distilled Astryx guidance lives under `references/astryx/`. Notes link and date official sources, record verified presentation measurements where available, and summarize project application without copying source code, styling files, component APIs, or documentation wholesale.
- Design Flow translates verified Astryx presentation into centralized semantic aliases documented in the design-system contract. If official guidance does not expose a required value, record the gap and approve an explicit Design Flow fallback before implementation rather than claiming exact Astryx fidelity.
- Product behavior, mandatory accessibility, Vodafone color, and Vodafone typography may require a documented deviation from Astryx geometry; such a deviation must be explicit and tested.
- Detailed ownership, precedence, and component Definition of Done are in [ui-architecture.md](ui-architecture.md).

## 2. Team and access model

The MVP serves one team. There are no organizations, workspaces, team switching, multi-team memberships, or tenant selectors.

### Authentication

- Use Supabase email-and-password authentication.
- Public sign-up is disabled.
- Admin-privileged users create individual accounts using work email addresses and temporary passwords.
- The user must choose a new password after first sign-in.
- Forgotten passwords are reset by an Admin-privileged user in the MVP; self-service email reset can be added later.
- Never use one shared team account.

### Organizational positions and Admin privilege

Organizational position and portal administration are separate axes. The fixed base positions are Viewer, Designer, Lead, and Manager. `Admin` is an independent privilege that may be attached to Designer, Lead, or Manager, but never to Viewer.

| Capability | Viewer | Designer | Lead | Manager |
|---|:---:|:---:|:---:|:---:|
| View dashboard, tickets, work history, and reports | Yes | Yes | Yes | Yes |
| View ticket comments and Figma links | Yes | Yes | Yes | Yes |
| Create tickets | No | Yes | Yes | Yes |
| Edit a created, assigned, or contributed ticket | No | Yes | Yes | Yes |
| Edit any ticket | No | No | Yes | Yes |
| Apply existing labels | No | Yes | Yes | Yes |
| Log work on a ticket | No | Yes | Yes | Yes |
| Log work on another person's behalf | No | No | Yes | Yes |
| Add and edit own comments | No | Yes | Yes | Yes |
| Moderate comments | No | No | Yes | Yes |
| Mark or resolve blockers on accessible tickets | No | Yes | Yes | Yes |
| Archive or restore eligible tickets | No | No | Yes | Yes |
| Export team reports | No | No | Yes | Yes |
| Manage Areas/Squads and labels | No | No | No | No |
| Manage accounts, positions, Admin privilege, and system settings | No | No | No | No |

Admin privilege grants every operational capability plus accounts, positions, reporting lines, Areas/Squads, labels, and Settings management to an eligible Designer, Lead, or Manager. It does not replace that position, change the reporting line, or determine the default people filter. For example, a Lead with Admin privilege remains a Lead reporting to a Manager and defaults to that Lead's group while retaining the ability to switch to any scope and administer the portal. Account creation and access-management operations must reject Viewer + Admin; changing an Admin-privileged account to Viewer must remove Admin privilege in the same atomic operation.

Viewer is trusted internal, whole-team read-only access:

- Viewer defaults to All people and may read Dashboard, All Tickets, Work Items, comments, work history, Reports, archived history, and Figma links.
- A Viewer cannot hold Admin privilege and cannot create, edit, comment, log work, manage blockers, archive/restore, export, or access Settings.
- Viewer is not restricted by Area/Squad in the MVP.
- Viewer is not a PO, external stakeholder, or requester role. If that need appears later, create a separate restricted access/request-form model rather than changing Viewer semantics.

### Reporting hierarchy and people scope

- A Designer reports to at most one Lead at a time.
- A Lead reports to at most one Manager at a time.
- A Manager has no required parent in the MVP.
- A Lead group contains that Lead plus their direct-report Designers.
- A Manager group contains that Manager, their direct-report Leads, and the Designers beneath those Leads.
- Reporting lines preserve effective-date history for period-accurate filters and exports.
- The current organization has one Manager, but the model must not hard-code a one-Manager limit.
- Reporting groups are hierarchy-based filter presets inside the single team; they are not teams, workspaces, tenant boundaries, or data-visibility boundaries.
- Admin-privileged users manage reporting relationships.
- Designers default to Me; Leads default to their Lead group; Managers default to their Manager group; Viewers default to All.
- Admin privilege never changes the base-position default. Every Lead and Manager may view All, another Lead/Manager group, or specific people.
- The shared people scope applies to Dashboard, All Tickets, and Reports. It does not restrict ticket assignee choices.
- The Team directory shows organizational position, a separate Admin badge where applicable, and `Reports to`: Designer → Lead, Lead → Manager, Manager → none.

## 3. MVP modules

1. **Dashboard** — approved position-aware overview with scoped cards, attention signals, workload by person, recent recorded work, and quick actions. See [dashboard.md](dashboard.md).
2. **All Tickets** — approved searchable/filterable list with position-aware people scope, explicit ownership/contribution relationships, responsive ticket summaries, and direct Figma access. See [all-tickets.md](all-tickets.md).
3. **Work Item** — approved complete ticket view with glanceable metadata, parent-only subtasks, a five-column actual Work Dates grid, vertical history timeline, comments, and PDF export. See [work-item.md](work-item.md).
4. **Log Work** — ticket work by default, with an alternative standalone visual-work mode, an optional independently authorized status change, and an independent Create New Ticket path that returns to the unfinished log draft.
5. **Reports** — approved Tickets, Designers, and Visual Work views with neutral charts, a single-person cross-ticket recorded-activity drill-down, source drill-down, and filtered CSV exports. See [reporting.md](reporting.md) and [reports-ui.md](reports-ui.md).
6. **Team and Settings** — approved shared directory plus Admin-only accounts, positions/Admin privilege, reporting hierarchy, Areas/Squads, labels, team timezone, and administration audit. See [team-settings.md](team-settings.md).
7. **Notifications** — approved narrow in-app inbox for primary-assignee assignment, status, blocker, and comment events. See [notifications.md](notifications.md).

## 4. Work items

### Fields

| Field | Rule |
|---|---|
| Ticket ID | Generated automatically |
| Title | Required |
| Area/Squad | Required; selected from an Admin-managed list |
| Status | Required; defaults to Backlog |
| Primary assignee | Optional in Backlog; required for active statuses |
| Description | Optional |
| Planned start date | Optional |
| Due date | Optional |
| Labels | Optional; multiple allowed; selected from an Admin-managed list |
| Figma URL | Optional; one URL only |
| Priority | Does not exist in the MVP |
| Project | Does not exist in the MVP |

The Figma URL may point to a Figma design file, page, node, prototype, FigJam board, or Make file. The portal stores only the URL and does not fetch or cache Figma content.

### Areas/Squads and labels

- Only Admin-privileged users create, rename, order, archive, or reactivate Areas/Squads and labels.
- Designers, Leads, and Managers may apply existing labels to tickets they can edit.
- Archived values remain visible on historical tickets but are unavailable for new selection.
- Used values are archived, not hard-deleted.

### Statuses

The fixed MVP status set is:

1. Backlog
2. To do
3. In Progress
4. In Review
5. Done
6. Paused

The normal path is `Backlog -> To do -> In Progress -> In Review -> Done`, but authorized users may move backward. Every transition is recorded.

Workflow-status badges use the centralized color tokens in [design-system.md](design-system.md). Their non-color presentation, including border presence and geometry, follows the verified Astryx Badge reference required before implementation. Blocked and Archived use separate indicator color tokens and do not become workflow statuses. Components never persist or independently hardcode resolved colors or presentation values.

Status reporting groups:

- **Active workload:** To do, In Progress, and In Review.
- **Backlog:** reported separately and not treated as active workload.
- **Paused:** reported separately and excluded from overdue counts.
- **Completed:** tickets that entered Done during the selected period.
- Moving a Done ticket to another status records a reopen event; previous completion history remains.

### Planned dates versus actual work

Planned start and due date describe an expected delivery window. They do not imply that the designer worked on every date in the window. Actual work comes only from work-log entry dates.

Maintain separate timestamps:

| Timestamp | Meaning |
|---|---|
| `created_at` | Ticket creation time |
| `updated_at` | Last change to a core ticket field |
| `last_worked_on` | Latest actual date in a non-withdrawn ticket work log |
| `last_activity_at` | Latest system activity time: log submission/edit, comment, blocker, or field change |
| `completed_at` | Most recent time the ticket entered Done |

The All Tickets list should show **Last worked on** rather than using an ambiguous Last updated value.

At ticket level, **Active work days** is the number of distinct valid ticket `work_date` values across all designers. Multiple entries or people on the same ticket/date count once.

### Planned until

`Planned until` is the latest due date among a person's current unarchived owned tickets in To do, In Progress, or In Review. It is a planning outlook, not a promise of availability or capacity.

- Contributor activity does not affect it.
- Partial due-date coverage must remain visible, for example `Planned until 28 Aug · 2 without due dates`.
- If active owned work has no due dates, show `No due dates set`.
- If the person has no active owned tickets, show `No active owned tickets`.
- Do not add manual availability periods or call the date `Available from`.

## 5. Ownership and contribution

- Every active ticket has exactly one primary assignee.
- Primary assignees must have Designer, Lead, or Manager position; Viewer is not assignable.
- A designer becomes a contributor automatically when valid work is logged for a ticket while that designer is not its primary assignee for that work date.
- Contributors are derived from actual work; they are not manually maintained.
- `worked_by` identifies the person who performed the work. `logged_by` identifies the person who entered it.
- A Lead, Manager, or Admin-privileged user logging on behalf of a designer credits the designer, not the person entering the log.
- Preserve primary-assignee history so past work and completion are attributed to the correct person.
- A ticket appears once in ticket totals regardless of contributor count.
- Completion credit belongs to the primary assignee when the ticket enters Done; contributors remain visible separately.

## 6. Blockers

Blocked is a structured state, not a status and not a label.

- Blockers apply to To do, In Progress, and In Review tickets.
- Allow one active blocker per ticket in the MVP.
- A blocker requires a reason.
- Expected resolution date is optional.
- Record who blocked it, when it began, who resolved it, when it ended, and an optional resolution note.
- A blocked ticket keeps its workflow status, for example `In Progress + Blocked`.
- An active blocker must be closed before the ticket moves to Backlog, Paused, or Done.
- Blocking and resolution appear in ticket history and reporting.

## 7. Subtasks

Subtasks are checklist items inside the parent Work Item page, not hidden full tickets.

- Support one level only; subtasks cannot contain subtasks.
- A subtask has title, position, completion state, creator/time, and completer/time.
- Subtasks do not have independent status, assignee, dates, priority, Figma URL, comments, or work logs.
- All Tickets shows only the parent ticket plus a derived completion badge such as `2/4`.
- Subtasks do not count as tickets or completed work in reports.
- Completing all subtasks does not automatically mark the parent Done.
- Marking a parent Done with incomplete subtasks shows a warning but may proceed.

## 8. Comments

Comments preserve discussion and context; they are not work logs.

- Plain text only on the parent Work Item page.
- No attachments, reactions, threads, replies, or mentions in the MVP.
- Users may edit their own comments; edited comments show an Edited indicator.
- Leads, Managers, and Admin-privileged users may moderate comments.
- Withdrawing a comment hides it from normal view but preserves its audit record.
- Comments change `last_activity_at`, but never `last_worked_on`, contribution, or work reporting.
- No comments on subtasks or standalone visual work.

## 9. Ticket work logging

### Default flow

Log Work opens in ticket mode. The work-item selector is visible immediately. A secondary action switches to standalone visual work; users are not first prompted to choose a context.

Each ticket-work submission has:

- Work item.
- `worked_by`, defaulting to the current user.
- `logged_by`, recorded automatically.
- One to five work-log entries.
- Optional blocker action, recorded once rather than copied per date.

Each entry has:

- Work date.
- Required work type.
- Optional description.

Description is optional for every work type, including Other.

### Integrated ticket actions

Ticket-mode Log Work adds two launch paths without combining their domain operations:

- **Create New Ticket** is available only to a caller with the existing ticket-creation capability. The client preserves the unfinished Log Work draft while launching the normal ticket-creation flow. After `create_work_item` succeeds, Log Work resumes with the returned Work Item selected and every existing draft value preserved. Ticket creation does not submit work or change status.
- **Optional status change** is available only when the caller independently satisfies the existing status-transition capability for the selected Work Item. Permission to log work on a visible ticket does not grant permission to change its status, and a prospective contribution from the unfinished log is not used to pre-authorize the transition.
- On final submission, `submit_work_log` runs first as the primary action. Only after it succeeds does the client call `transition_work_item_status` when a different target status was requested.
- If work-log submission fails, no status transition is attempted and the draft remains available. If the work log succeeds but the status transition fails, the log remains committed; the interface reports the successful log and failed status separately and permits only the status action to be retried after authoritative state is refreshed.
- Each operation uses its own operation ID and keeps its existing validation, history, audit, notification, and retry behavior. There is no combined Log Work/create/status transaction or automatic compensation across them.

Create New Ticket and optional status change do not appear in standalone visual-work mode, which has no Work Item lifecycle.

### Ticket work types

1. Planning & alignment
2. Discovery & research
3. Mapping & information architecture
4. Ideation & wireframing
5. UI & visual design
6. Prototyping & interaction
7. Design system
8. Testing & validation
9. Review & iteration
10. Documentation & handoff
11. Design QA & implementation support
12. Team support & collaboration
13. Other

Use one primary work type per date. If materially different work happened on the same ticket and date, a separate entry may be logged.

### Date behavior

- Single-date entry is the default and defaults to today.
- Past dates are allowed; future dates are not.
- Users may add multiple dates, up to five selected dates in one submission.
- The working week is Sunday through Thursday.
- Friday and Saturday are excluded by default but can be selected manually when work actually happened.
- Week-based reporting periods span Sunday through Saturday so manually recorded Friday/Saturday work remains visible; five-working-day calculations continue to skip Friday and Saturday.
- Multiple dates appear as a list, not a calendar.
- Every row has its own work-type selector and optional description.
- An Apply to all shortcut may copy one work type to all rows before individual adjustment.
- The submission history may group the entries, while calendar/report calculations use each date separately.

Store actual `work_date` separately from submission `created_at`. A backfilled entry appears in the reporting period when work happened, while audit history shows when it was entered.

### Corrections and withdrawal

- Designers may edit any log where they are `worked_by`, including logs entered on their behalf.
- Leads, Managers, and Admin-privileged users may edit any work log.
- Only Leads, Managers, and Admin-privileged users may change `worked_by` to another designer.
- There is no correction time limit in the MVP.
- Edits record previous value, new value, editor, and edit time.
- Withdrawn logs disappear from normal activity and reports but remain in the audit trail.
- Withdrawing or correcting logs recalculates contributors, `last_worked_on`, and report aggregates.

## 10. Standalone visual work

Standalone visual work records small visual/graphic requests that do not justify a ticket. It is a secondary mode, never the default.

Shared submission fields:

- `worked_by` and automatic `logged_by`.
- Optional related Area/Squad.
- One to five selected dates using the same weekday, backdating, and list rules as ticket work.

Each date has a required visual-work type and optional description.

Fixed visual-work types:

1. New visual asset
2. Resizing & adaptation
3. Presentation support
4. Image editing
5. Illustration & iconography
6. Other visual work

Standalone visual work has no ticket ID, status, assignee, contributor, blocker, subtask, comment, planned date, due date, Figma URL, or label.

If visual work becomes substantial enough to require ownership, collaboration, planned dates, or lifecycle tracking, create a normal ticket instead.

## 11. Archiving and retention

- Only Backlog, Paused, and Done tickets are eligible for archiving.
- Only Leads, Managers, and Admin-privileged users may archive or restore tickets.
- Archiving does not change status.
- Restoring returns the ticket with the same status.
- Archived tickets are excluded from the default All Tickets view but remain searchable through an Archived filter.
- Archived records remain in historical reports and CSV exports.
- No automatic archive and no permanent deletion through the product in the MVP.

## 12. Reporting foundation

Reports are separate views for:

- Tickets
- Designers
- Visual Work

Designer selection is a normal multi-select filter:

- One designer produces an individual view.
- Two designers produce a neutral side-by-side view without a Compare button or versus language.
- Multiple/all designers produce the team overview.

Do not produce a combined productivity score or claim that activity counts equal effort, quality, or complexity. See [reporting.md](reporting.md) for approved definitions.

## 13. Team and Settings foundation

- The shared Team directory shows active people, position, separate Admin badge, and Reports to; it hides work email and authentication details.
- Only Admin-privileged users access Settings.
- Members/access supports closed account provisioning, position/Admin management, hierarchy changes, temporary-password resets, and deactivate/reactivate without hard deletion.
- Areas/Squads and labels are Admin-managed archiveable vocabularies with usage disclosure.
- One team timezone controls timestamp display and team-local day boundaries without rewriting UTC timestamps or explicit work dates.
- Administration changes create append-only audit events without passwords or credential content.
- Product-controlled positions, statuses, work types, calendar rules, thresholds, cards, metrics, and CSV schemas are not editable through Settings.

See [team-settings.md](team-settings.md) for the approved UI and acceptance criteria.

## 14. Notifications foundation

- Use an in-app bell, unread count, chronological list, mark-one/all read, and Work Item deep links.
- Notify the affected primary assignee when another person assigns/reassigns them, changes their ticket status, creates/resolves its blocker, or adds a comment.
- Never notify a user about their own action.
- Do not copy comment bodies or blocker reasons into notifications.
- Admin privilege does not affect recipient selection.
- Leads/Managers use Dashboard and Reports instead of receiving every reporting-group event.
- Exclude email, push, scheduled reminders, digests, mentions, preferences, and contributor-work notifications.

See [notifications.md](notifications.md) for exact triggers and permissions.

## 15. Explicit MVP exclusions

- Multi-team tenancy or workspaces
- PO request forms or PO accounts
- Area/Squad-restricted Viewer access or external stakeholder access
- Microsoft/OAuth sign-in
- Public sign-up
- Multiple equal assignees
- Projects, epics, or nested subtasks
- Priority
- Generic links, file attachments, or file storage
- Blocked as a workflow status or label
- Cancelled/Not proceeding status
- Hours, effort points, or a productivity score
- Explicit Compare action or competitive ranking language
- Saved report configurations or Reports PDF output
- Manual availability statuses, availability date ranges, or inferred capacity promises
- Ticket-like lifecycle for standalone visual work
- Custom positions or permission builders
- Editable status/work-type/workflow configuration
- Branding, integrations, webhooks, API keys, or deployment controls in Settings
- Notification email/push, scheduled reminders, digests, mentions, preferences, or group-wide subscriptions

## 16. Planning status after v1.0

No pre-implementation product or technical decision remains open. The approved implementation order and phase gates are defined in [build-plan.md](build-plan.md). Any discovery that would change product behavior, permissions, stored meaning, architecture, or phase dependencies must be surfaced and approved through the documented change rule.
