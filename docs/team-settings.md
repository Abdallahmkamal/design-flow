# Team and Settings specification

**Version:** 1.0  
**Decision date:** 2026-07-16  
**Status:** Approved for MVP planning

Team and Settings separates the whole-team directory from Admin-only portal administration. Organizational position and Admin privilege remain independent for Designer, Lead, and Manager; Viewer is never eligible for Admin privilege.

## 1. Team directory

The Team directory is visible to every active portal user and shows active people only.

Show:

- Display name
- Organizational position: Viewer, Designer, Lead, or Manager
- Separate Admin badge when applicable
- `Reports to` relationship:
  - Designer → Lead
  - Lead → Manager
  - Manager → none
  - Viewer → none unless a later approved model says otherwise

Do not show work email, authentication status, last sign-in, password actions, or other account-management information in the shared directory.

The directory may support simple search and position/reporting-group filters. It does not duplicate Dashboard workload metrics or create a performance-oriented people view.

## 2. Settings access

Only Admin-privileged users may access Settings. Manager position by itself does not grant Settings access.

Settings contains:

1. Members and access
2. Areas/Squads
3. Labels
4. General
5. Administration audit

## 3. Members and access

Admin-privileged users may:

- Create an account using display name, work email, organizational position, reporting supervisor where required, and initial Admin-privilege state
- Issue a temporary password and require a password change at first sign-in
- Reset a forgotten password with a new temporary password
- Change organizational position
- Grant or remove Admin privilege
- Assign or change reporting relationships
- Deactivate or reactivate an account
- View last sign-in for access/security support only
- View account creation and most recent access-administration dates

Rules:

- Public registration remains disabled.
- Position and Admin privilege are separate controls for Designer, Lead, and Manager. Viewer + Admin is invalid.
- Creating a Viewer with Admin privilege or granting Admin privilege to an existing Viewer is rejected.
- Changing an Admin-privileged account to Viewer must remove Admin privilege in the same atomic operation.
- A Designer reports to a Lead; a Lead reports to a Manager; a Manager has no required parent.
- Position and reporting-line changes are validated together and preserve effective-date history.
- Deactivation blocks normal access but never removes historical attribution.
- Accounts with historical activity are never hard-deleted.
- The system must not permit removal or deactivation of the final active Admin-privileged account.
- Password values and temporary credentials never appear in audit history.
- Last sign-in is an account-support signal only and never appears in Dashboard or performance reporting.

## 4. Areas/Squads

Admin-privileged users may:

- Create
- Rename
- Reorder
- Archive
- Reactivate

Before archiving, show the number of current and historical tickets using the value. Archiving removes it from new selection while preserving existing and historical references. Used Areas/Squads are never hard-deleted.

Every ticket continues to require one active Area/Squad at creation or reassignment.

## 5. Labels

Admin-privileged users may:

- Create
- Rename
- Reorder
- Archive
- Reactivate

Show usage count before archiving. Archived labels remain visible on historical tickets but are unavailable for new application. Used labels are never hard-deleted.

## 6. General

The MVP exposes one configurable value:

- **Team timezone** — used to display timestamps and determine team-local `today` boundaries.

Changing timezone does not alter stored UTC timestamps or explicit `work_date` values. The change is audited.

The following remain product-controlled and are not editable in Settings:

- Organizational-position vocabulary and base capabilities
- Status vocabulary, workflow rules, and archive eligibility
- Ticket and standalone visual-work types
- Sunday–Thursday working days and Friday/Saturday weekend rules
- Five-working-day stale threshold
- Due-soon window
- Dashboard cards and people signals
- Report metric formulas and CSV schemas

These rules remain change-safe through stable codes, centralized configuration/policy, versioned migrations, and tests; `not configurable in Settings` does not mean permanently unchangeable.

## 7. Administration audit

Provide an Admin-only, read-only chronological log covering:

- Account creation
- Position changes
- Admin-privilege grants/removals
- Reporting-line changes
- Account deactivation/reactivation
- Password reset action, without password or credential content
- Area/Squad creation, rename, reorder, archive, and reactivation
- Label creation, rename, reorder, archive, and reactivation
- Team-timezone changes

Each event records:

- Event type
- Actor
- Affected subject
- Occurred at
- Previous and new values where applicable

Audit events are append-only and cannot be edited or deleted through the product.

## 8. Deliberate MVP exclusions

- Custom positions or custom permission builders
- Editable statuses, workflow transitions, or work-type vocabularies
- Notification settings
- Availability or leave settings
- Branding or product-name settings
- Storage, attachment, or Figma-integration settings
- OAuth/SSO configuration
- API keys, webhooks, or third-party integrations
- Backup/deployment controls in the product UI

## 9. Acceptance criteria

- The shared directory exposes position, Admin badge, and Reports to without exposing email or authentication details.
- Admin privilege can coexist with Designer, Lead, or Manager and never changes reporting-line/default-scope semantics; Viewer + Admin is rejected.
- Manager without Admin privilege cannot access Settings.
- Account creation, position changes, Admin changes, and reporting-line changes enforce the approved hierarchy.
- The final active Admin-privileged account cannot be removed or deactivated.
- Deactivation preserves historical ticket, work, comment, and report attribution.
- Areas/Squads and labels use archive/reactivate behavior and disclose usage before archive.
- Team timezone changes affect display/local-day boundaries without rewriting stored work dates or timestamps.
- Every approved administration action produces an append-only audit event without secrets.
- No fixed product vocabulary or threshold becomes casually Admin-editable.
