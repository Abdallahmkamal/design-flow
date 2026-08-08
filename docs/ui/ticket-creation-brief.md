# Ticket creation brief

**Status:** Phase 3 complete — staging acceptance verified on 2026-07-22

**Route:** `/work-items/new`

**Phase:** 3 — Work-item Foundation

> **Team-ready amendment (2026-08-08):** Modernization Slice 2 and `team-ready-ui-handoff.md` supersede the full-page presentation with the shared overlay and nested Log Work workflow. A fresh form defaults the one primary assignee to the eligible creator; multi-assignee support is consciously deferred until after rollout.

## Purpose

Create one Work Item in Backlog with its initial core fields, optional ownership,
labels, and Figma destination. The result is reusable by later launch contexts
without coupling creation to work logging or a status transition.

## Primary users and permissions

- Designer, Designer+Admin, Lead, Lead+Admin, Manager, and Manager+Admin may
  create.
- Viewer is denied and sees a permission explanation before any mutation can be
  attempted.
- The existing auth boundary handles inactive and password-restricted accounts.
  Viewer+Admin is an invalid account state, not an enhanced Viewer.

## Entry points

- `Create ticket` from All Tickets for an authorized principal.
- Direct authenticated navigation to `/work-items/new`.
- A later Phase 4 Log Work launch may call the same creation surface with a
  safe completion callback; Phase 3 does not expose that launch path.
- Cancel returns to the validated same-origin All Tickets return URL when one
  exists, otherwise `/work-items`.

## Primary and secondary actions

- Primary: **Create ticket**.
- Secondary: **Cancel**.
- There is no status selector, Log Work action, save-and-create-another action,
  or destructive action.

## Information hierarchy

1. Page title and short statement that the new ticket starts in Backlog.
2. Validation/error summary when present.
3. Required identity and Area/Squad fields.
4. Optional ownership, description, planned dates, labels, and Figma URL.
5. Fixed status summary and form actions.

## Content and fields

| Field | Requirement | Component and content rule |
| --- | --- | --- |
| Title | Required, nonblank | Input |
| Area/Squad | Required active value | Select |
| Primary assignee | Optional active Designer/Lead/Manager | Select with `Unassigned` option |
| Description | Optional plain text | Textarea, three-row start |
| Planned start | Optional planned date | Input `type="date"` |
| Due date | Optional planned date | Input `type="date"` |
| Labels | Optional active unique values | Labelled Checkbox group |
| Figma URL | Optional HTTPS `figma.com` or subdomain URL without credentials | Input `type="url"` with visible helper text |
| Status | Fixed | Read-only Backlog Badge and explanation; never a form value chosen by the user |

No project, priority, attachment, generic link, second assignee, work date, work
type, requested status, or work-log content is accepted. The brief adds no
planned-start/due ordering rule that is absent from the domain contract.

## Business rules

- Submit one `create_work_item` request with a client-generated operation ID.
  Network retry reuses that ID and identical payload; changed intent receives a
  new ID.
- The server always writes the initial Backlog status and returns Work Item UUID
  plus display ID.
- Creation atomically writes the initial Work Item, status history, optional
  assignment/labels, safe event set, and eligible assignment notification.
- The flow cannot call `submit_work_log` or `transition_work_item_status` and
  cannot imply either operation succeeded.
- Active controlled values and assignee eligibility are revalidated by the RPC.
  Browser filtering is guidance, not authorization.

## Components to reuse, extend, or create

- Reuse Button, Input, Select, Checkbox, Badge, and shell SkipLink.
- Create Textarea as defined by `ui-component-map.md`.
- `WorkItemForm` is feature-owned and reusable by create/edit while keeping
  operation-specific submit mapping outside shared UI.
- No Modal, Drawer, Radio, Tabs, Avatar, or date-picker component is introduced.

## Desktop layout

- Use a focused full-page form within the existing page surface and content
  width; do not present creation in an overlay.
- Related fields may share a two-column row when both labels, errors, and long
  values remain readable. Title and description span the form width.
- Actions follow the form in DOM order. The primary action is visually first in
  importance without becoming sticky over content.

## Mobile layout

- One ordered column: title, Area/Squad, assignee, description, planned start,
  due date, labels, Figma URL, fixed status, actions.
- Controls fill available width. Checkbox labels wrap and targets remain
  independently tappable.
- Actions wrap or stack without reversing DOM order or causing horizontal
  overflow.

## Responsive transitions

At the existing `48rem` shell breakpoint, eligible paired fields may change
from one column to two. Content order, labels, validation relationships, and
fixed-status explanation do not change.

## Interaction and keyboard behavior

- Native form order matches the visual order. Enter does not unexpectedly
  submit while focus is in Textarea.
- Submit validates client-known requirements, exposes a linked error summary,
  and focuses the summary or first invalid field.
- While the request is pending, Create ticket reports busy state and duplicate
  submission is prevented; Cancel is not disguised as a submit button.
- Server validation, network, idempotency, or conflict errors preserve every
  entered value and selected option.
- Labels use a visible `fieldset`/legend and standard Checkbox keyboard behavior.

## Loading state

Initial loading is limited to controlled values and assignee options. Preserve
the page heading and show an accessible status; do not render a partly usable
form whose authoritative choices are missing.

## Empty state

Not applicable to ticket records. If no active Area/Squad exists, show a
blocking configuration state; non-Admin users receive guidance to contact an
Admin, and Admin-privileged users may follow the existing Settings route.

## No-results state

Not applicable. The labels group may legitimately contain no active labels and
then shows `No active labels` without blocking creation.

## Error state

- Controlled-value load failure shows retry and no submit action.
- Mutation failure stays in the form, preserves the draft, and distinguishes
  validation, forbidden/inactive, network, idempotency mismatch, and unexpected
  failure without exposing database internals.
- No partial-success wording is allowed because the mutation is atomic.

## Disabled and permission states

- Viewer/directly forbidden users see the page heading, a read-only permission
  message, and a return-to-All-Tickets action; the form is not merely disabled.
- A pending submission disables duplicate activation and identifies the action
  as loading.
- Inactive or password-restricted auth states defer to the existing route guard.

## Long-content and overflow behavior

- Labels, people names, and validation text wrap. The form never truncates an
  entered title, description, or URL while editing.
- Textarea is vertically resizable. No control creates horizontal page scroll.
- Long option names remain fully available in native/select presentation.

## Success feedback

- Normal Phase 3 entry navigates to `/work-items/:displayId`, refreshes the
  authoritative detail, and moves focus to the Work Item heading with a polite
  creation confirmation.
- The creation result is `{ id, displayId }`. A future approved launch context
  may consume it and return elsewhere without creating another operation.
- Confirmation states only that the ticket was created in Backlog. It never
  claims work was logged, status changed, or notification UI delivered.

## Analytics or audit implications

No product analytics are introduced. The domain operation produces the
approved creation/status/assignment/label history and notification effects
exactly once.

## Astryx reference patterns

- `references/astryx/input.md`
- `references/astryx/textarea.md`
- `references/astryx/select.md`
- `references/astryx/checkbox.md`
- `references/astryx/button.md`
- `references/astryx/badge.md`
- `references/astryx/patterns.md`

These notes supply field, control, validation, density, focus, and responsive
presentation. Vodafone supplies all color and typography. The pending Phase 3
mappings and fallback are in `design-system.md`.

## Design Flow reference screens or components

- `docs/ui-component-map.md`
- `docs/ui/authentication-brief.md` for full-page form and feedback conventions
- `src/ui/Input`, `src/ui/Select`, `src/ui/Checkbox`, `src/ui/Button`, and
  `src/ui/Badge`

## Acceptance criteria

- Every valid creator can create with only required fields and with all optional
  fields; Viewer cannot reach a mutating form.
- Creation always returns UUID/display ID and initial Backlog, with no work log
  or non-Backlog effect.
- Invalid controlled values, assignees, labels, and Figma URLs are rejected by
  the server even if browser state is stale.
- Draft input survives validation, network, and retry-safe failure paths.
- Desktop/mobile keyboard and axe tests cover required/optional fields, errors,
  loading, configuration-blocked, permission, and success navigation.
- The later reusable result contract is present without any Phase 4 UI.

## Verification evidence

- The complete synthetic Phase 3 staging acceptance matrix passed on
  2026-07-22. Desktop/mobile checks confirmed Backlog-only creation, validation
  draft preservation, display-ID navigation, independent Figma access, and no
  work-log or non-Backlog side effect.
- Direct Viewer navigation to `/work-items/new` displayed the approved
  permission state before any mutation form or request was available.

## Open questions

None. Material field, navigation, or completion changes require a new readiness
decision.
