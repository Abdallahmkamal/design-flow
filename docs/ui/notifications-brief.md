# Notifications brief

**Status:** Approved for Phase 5 implementation — 2026-07-26

**Route:** `/notifications`

**Phase:** 5 — Operational Experience

## Purpose, users, and entry

Provide a narrow personal inbox for approved Work Item events. Every valid
active principal may open only their own inbox and update only their own read
state. Admin privilege and reporting position do not broaden recipients or
inbox access. Inactive and password-restricted accounts receive no normal
access; Viewer+Admin remains invalid.

The application header shows a decorative bell, visible `Notifications` label,
and unread count. The control is a native navigation link to
`/notifications`, not an icon-only Button or a long scrolling popover. The
accessible name includes the unread count when nonzero.

## Information hierarchy and actions

1. Inbox heading and unread summary.
2. `Mark all as read`, shown only when unread records exist.
3. Newest-first chronological notification list.
4. Per-item unread state, safe event summary, actor/time, Work Item link, and
   `Mark as read` where needed.
5. Existing numbered `Pagination` below the list, with a fixed 25-item page and
   no user page-size control.

Opening a notification may mark that row read, then follows the native Work
Item link. Work Item authorization is re-applied at navigation time; a retained
notification never grants access. There is no delete action.

## Event and data rules

Notifications are created in the same transaction as their source
`work_item_events` row and are unique by recipient, type, and source event.
Only another person's approved action may produce one:

- assigned to the recipient or reassigned away from the recipient;
- status changed while the recipient is primary assignee;
- blocker created or resolved while the recipient is primary assignee; or
- comment added while the recipient is primary assignee.

Summaries may identify ticket, actor, assignment direction, new status, or
blocker/comment event type. They never copy comment bodies, blocker reasons, or
other free text. Comment edit/withdrawal, work logs, subtasks, labels, dates,
Figma/core edits, due/stale conditions, self-events, and group-wide events do
not notify. Email, push, reminders, digests, mentions, preferences, and
subscriptions remain absent.

Mark-one and mark-all are direct recipient-filtered `read_at` updates protected
by RLS. Repeating either action is a no-op. No browser path may insert, delete,
change recipient/content, or mutate another recipient's row.

## Components and ownership

Reuse `Badge` for the textual unread count, `Button` for visible-label read
actions, and `Pagination` for older records. Feature-own `NotificationHeaderLink`,
`NotificationList`, and `NotificationItem`. The feature API owns recipient-only
queries and read-state updates; shared UI never calls Supabase.

The header link uses native link semantics plus a decorative bell, so the
existing Button contract needs no icon-only extension. The list is a semantic
`ul`; it is not a table, Menu, Popover, Drawer, or notification-preference
surface.

## Desktop, mobile, and interaction

Desktop uses one moderate-width chronological list with actions aligned but
never available only on hover. Mobile keeps the same order, wraps event/ticket
text, and places read actions after their item content. Pagination may wrap
without horizontal overflow.

Links and Buttons use native keyboard behavior and visible focus. Mark-one
announces the updated item without moving focus unexpectedly. Mark-all confirms
the new unread total and returns focus to the inbox heading/action context.
Pagination announces page/range changes. The unread badge has a textual label
and is not communicated by color alone.

## Required states

- Header count and inbox loading are independent, each with an accessible busy
  status and no fabricated zero.
- Empty reads `You're all caught up`/`No notifications yet` as appropriate and
  offers no fake action. There is no search, so no-results is not applicable.
- Query failure retains shell access and offers Retry; a read-state failure
  leaves the item unread and announces that precise failure.
- A Work Item that is no longer accessible yields the normal permission/not-
  found destination without exposing hidden ticket data.
- Long names and ticket titles wrap; no notification free text is stored or
  displayed beyond the approved safe summary.

## References and acceptance

Presentation and behavior reuse ready notes in
`references/astryx/{button,badge,pagination,patterns,accessibility}.md`.
Vodafone color/type and existing aliases remain authoritative; no new shared
component or presentation fallback is proposed.

Acceptance requires recipient-isolated list/count/mutations for all seven valid
principals; inactive/password-restricted/Viewer+Admin denial; transactional and
retry idempotency for every approved producer; self-event and excluded-event
proof; mark-one/all isolation; newest-first pagination; safe Work Item links;
no copied comment/blocker text; desktop/mobile/keyboard/axe and Light/Dark
checks; and staging verification with labelled synthetic records only.

## Open questions

None. Approval includes the fixed 25-item inbox page size. Material changes
require a new readiness decision.
