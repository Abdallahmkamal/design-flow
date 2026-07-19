# Notifications specification

**Version:** 1.0  
**Decision date:** 2026-07-16  
**Status:** Approved for MVP planning

Notifications provide a narrow in-app awareness layer for personally relevant ticket events. They complement Dashboard attention signals; they do not become an email, push, reminder, or subscription platform.

## 1. Experience

- Show a notification bell with unread count.
- Open a chronological in-app list, newest first.
- Allow the recipient to mark one notification or all notifications as read.
- Each notification deep-links to the relevant Work Item.
- Paginate or progressively load older notifications.
- Do not provide manual notification deletion in the MVP.

## 2. Recipients

Primary assignees are the only automatic recipients in the MVP.

- Eligible primary-assignee positions are Designer, Lead, and Manager.
- Admin privilege does not create notifications by itself and does not change recipient rules.
- Leads and Managers are not notified about every event in their reporting groups; they use Dashboard and Reports for oversight.
- A user never receives a notification for their own action.

## 3. Notification events

Create an in-app notification when another person:

1. Assigns a ticket to the recipient.
2. Reassigns a ticket away from the recipient.
3. Changes the status of a ticket currently assigned to the recipient.
4. Creates a blocker on a ticket currently assigned to the recipient.
5. Resolves a blocker on a ticket currently assigned to the recipient.
6. Adds a comment to a ticket currently assigned to the recipient.

Rules:

- Assignment notifications identify whether the recipient became or ceased to be primary assignee.
- Status notifications identify the new status.
- Blocker notifications do not need to copy sensitive/free-text blocker content into the notification body; the Work Item remains the source.
- Comment notifications do not copy the comment body. If a comment is later edited or withdrawn, the notification remains a link to the current permitted Work Item state.
- Comment edits, withdrawals, subtask changes, labels, dates, Figma changes, contributor work logs, and ordinary field edits do not create notifications in the MVP.
- Generate notifications transactionally/idempotently with their source event so retries cannot create duplicates.

## 4. Read state and permissions

- Only the recipient may read or update their notification read state.
- Opening a notification may mark it read.
- `Mark all as read` affects only the current recipient.
- A notification never grants access. Opening it still applies current Work Item permissions.
- Inactive accounts receive no normal notification access, while existing records may remain for audit/debugging.

## 5. Deliberate MVP exclusions

- Email notifications
- Browser, desktop, or mobile push notifications
- SMS or messaging-platform delivery
- Due-soon, overdue, stale, or scheduled reminders
- Daily or weekly digests
- Mentions
- Notification preferences or per-event subscriptions
- Lead/Manager group-wide notifications
- Contributor work-log notifications
- Read receipts visible to other people

## 6. Acceptance criteria

- The unread count matches unread records for the signed-in recipient.
- Assignment-to and assignment-away events notify the correct person once.
- Status, blocker, and comment events notify only the current primary assignee when performed by someone else.
- Self-actions never create a notification.
- Every item links to the relevant Work Item without bypassing permissions.
- Comment and blocker free text is not duplicated into notification content.
- Mark-one and mark-all read actions cannot affect another user.
- Event retries do not duplicate notifications.
- No scheduled job or external delivery provider is required for the MVP notification feature.
