# Product decision register

**Checkpoint:** MVP specification v1.0  
**Checkpoint date:** 2026-07-18  
**Last amended:** 2026-07-20 — D-100 resolves the Phase 1 database boundary

This register summarizes approved, rejected, and still-open decisions. Detailed behavior lives in [product-spec.md](product-spec.md), [data-model.md](data-model.md), and [reporting.md](reporting.md); stable cross-product interface direction lives in [ui-direction.md](ui-direction.md).

## Locked decisions

| ID | Decision | Outcome |
|---|---|---|
| D-001 | Product scope | Lightweight work portal for one internal UX/design team; not a Jira clone |
| D-002 | Team model | Single team only; no organizations, workspaces, or multi-tenancy |
| D-003 | Organizational positions | Viewer, Designer, Lead, and Manager; Admin is an independent privilege available to Designer, Lead, or Manager, not a position; Viewer + Admin is invalid |
| D-004 | Authentication | Admin-privileged account creation using Supabase email/password; public sign-up disabled |
| D-005 | Ticket creation | Designers, Leads, Managers, and Admin-privileged users may create tickets |
| D-006 | Ownership | One primary assignee; assignment history is preserved |
| D-007 | Contribution | Contributors are derived automatically from actual logged ticket work |
| D-008 | Areas | Every ticket has one required Area/Squad managed by Admin-privileged users |
| D-009 | Projects | Removed from the MVP |
| D-010 | Priority | Removed entirely |
| D-011 | Links/files | One optional Figma URL only; no generic links, attachments, or uploads |
| D-012 | Labels | Optional/multiple; only Admin-privileged users manage the vocabulary |
| D-013 | Statuses | Backlog, To do, In Progress, In Review, Done, and Paused |
| D-014 | Blocked | Separate structured state with one active blocker, not a status or label |
| D-015 | Archiving | Only Backlog, Paused, and Done may be archived; Lead, Manager, or Admin privilege required |
| D-016 | Planned dates | Optional planned start and due date; never treated as continuous actual work |
| D-017 | Actual-work timestamps | Preserve work date, logged-at time, last worked, last activity, and field update separately |
| D-018 | Subtasks | One-level checklist on Work Item page; derived `completed/total` badge elsewhere |
| D-019 | Comments | Simple ticket comments distinct from reporting work logs |
| D-020 | Ticket log default | Log Work opens in ticket mode; standalone visual is secondary |
| D-021 | Ticket work types | Fixed UX lifecycle/support vocabulary; one required type per work date |
| D-022 | Work-log descriptions | Optional for every type, including Other |
| D-023 | Multi-date logging | One to five selected dates shown as rows, each with its own type and optional detail |
| D-024 | Working week | Sunday–Thursday; Friday/Saturday excluded by default but manually selectable |
| D-025 | Backdating | Past dates allowed, future dates prohibited; reporting uses actual work date |
| D-026 | Work-log corrections | No edit time limit; audited edits and soft withdrawal; recalculate derived data |
| D-027 | Standalone visual work | No ticket lifecycle; fixed visual types, optional Area/Squad, separate reporting |
| D-028 | Report views | Tickets, Designers, and Visual Work |
| D-029 | Designer selection | One/two/all through normal filters; no explicit Compare button or ranking language |
| D-030 | Metrics | Ownership, contribution, active days, and ticket-days remain separate; no productivity score |
| D-031 | Retention | No normal hard deletion; archive/withdraw while preserving audit history |
| D-032 | Export | Portable CSV reporting is required |
| D-033 | Reporting hierarchy | Effective-dated Designer → Lead → Manager relationships; hierarchy groups are filter presets, not access boundaries |
| D-034 | People-scope defaults | Designer: Me; Lead: Lead group; Manager: Manager organization; Viewer: All; Admin privilege does not alter the position-based default |
| D-035 | Dashboard | Six actionable ticket cards plus needs-attention, workload-by-person, recent-work, and management people-signal sections |
| D-036 | Stale work | Five Sunday-through-Thursday working days without valid ticket work after the applicable active/planned-start grace point |
| D-037 | Login recency | Never use last sign-in as a work or performance signal; keep it in Admin account support only |
| D-038 | Planned until | Latest due date across current active owned tickets, with missing-date disclosure; never present it as availability or capacity |
| D-039 | All Tickets default | Current unarchived Backlog, To do, In Progress, In Review, and Paused tickets; Done and Archived are explicit views |
| D-040 | All Tickets people relationship | Owned is default; Contributed to and Owned or contributed to are explicit alternatives |
| D-041 | All Tickets presentation | Fixed responsive list; subtask progress belongs in the title cell and contributor count reveals names |
| D-042 | Direct Figma access | A row/card Figma icon opens the stored URL directly without opening the Work Item |
| D-043 | All Tickets interaction | URL-backed search/filter/sort; no inline edits, bulk actions, saved views, or customizable columns in the MVP |
| D-044 | Row Log Work | Designer, Lead, Manager, and Admin-privileged users receive a preselected ticket-work shortcut; Viewer remains read-only |
| D-045 | Work Item header | Two-level glanceable header includes Area/Squad, labels, ownership, due date, subtask progress, and Active work days |
| D-046 | Ticket Active work days | Distinct valid ticket work dates across all designers; multiple people/entries on one date count once |
| D-047 | Work Item history | Vertical timeline is primary; no monthly calendar in the MVP |
| D-048 | Work Dates grid | Five-column actual-date index from first to last recorded work date, containing only dates with valid work |
| D-049 | Work Item export | Human-readable PDF for Designer/Lead/Manager/Admin privilege with comments opt-in and withdrawn bodies excluded |
| D-050 | Reports structure | Separate Tickets, Designers, and Visual Work tabs with cards, charts, detailed tables, and source drill-down |
| D-051 | Report periods | This month defaults; week presets span Sunday–Saturday while working-day calculations skip Friday/Saturday |
| D-052 | Designer reports | One/two/multi-person layouts adapt automatically with aligned neutral metrics and no comparison action or ranking |
| D-053 | Report charts | Accessible bars/lines using defined activity units; no decorative pie charts or productivity implications |
| D-054 | Reports export | Lead, Manager, or Admin privilege required for CSV; no Reports PDF or saved report configurations in the MVP |
| D-055 | Export current view | Tab, period, scope, filters, chart refinements, and sort control export; include all matching rows beyond the current page |
| D-056 | CSV schemas | Five fixed exports: ticket summary, ticket activity detail, designer summary, designer-ticket detail, and visual-work detail |
| D-057 | Viewer | Trusted internal whole-team read-only position; defaults to All and may view comments/history/Figma but cannot mutate, export, access Settings, or hold Admin privilege |
| D-058 | Change-safe fixed rules | Stable codes/display labels, system-managed reference values, centralized rules, retirement instead of deletion, and versioned tested migrations are mandatory |
| D-059 | Admin model | Admin is an independent privilege overlay for Designer, Lead, or Manager that grants full access without replacing organizational position, reporting line, or default people scope; Viewer + Admin is rejected |
| D-060 | Manager | Manager inherits Lead operational capabilities and defaults to the Manager plus reporting Leads and their Designers |
| D-061 | Manager count | Current organization has one Manager, but the data model does not enforce a one-Manager limit |
| D-062 | Team directory hierarchy | Show organizational position, separate Admin badge, and Reports to relationship for Designer → Lead → Manager |
| D-063 | Team directory privacy | All active users may view active names/positions/Admin badges/reporting lines; email, last sign-in, and account controls remain Admin-only |
| D-064 | Settings access | Admin privilege is required; Manager position alone does not grant Settings |
| D-065 | Member administration | Closed account creation, temporary-password reset, position/Admin/hierarchy management, and deactivate/reactivate without hard deletion |
| D-066 | Controlled lists | Admin-privileged users create/rename/reorder/archive/reactivate Areas/Squads and labels with usage disclosure |
| D-067 | General setting | One configurable team timezone; fixed work dates and stored UTC timestamps are never rewritten by a timezone change |
| D-068 | Administration audit | Append-only Admin-visible history for access, hierarchy, controlled-list, password-reset-action, and timezone changes; never store credentials |
| D-069 | Settings limits | Positions, capabilities, statuses, work types, calendar rules, thresholds, Dashboard definitions, metrics, and exports are product-controlled |
| D-070 | Notifications | Minimal in-app bell/list with unread count, mark-one/all read, and Work Item deep links |
| D-071 | Notification recipients | Primary assignee only for assignment-to/away, status, blocker create/resolve, and new-comment events caused by someone else |
| D-072 | Notification exclusions | No self-events, email, push, scheduled reminders, digests, mentions, preferences, group-wide, or contributor-log notifications |
| D-073 | Product name | Design Flow, with no Vodafone prefix in the product name |
| D-074 | Visual foundation | Refined by D-099: `docs/design-system.md` remains authoritative for Vodafone color and typography; its former spacing, elevation, and general visual authority is superseded |
| D-075 | Status appearance | Centralized Design Flow semantic color aliases map the six statuses plus Blocked/Archived indicators in Light/Dark modes and may be remapped without changing persisted status data. D-099 supersedes the original no-border presentation rule; non-color badge presentation follows verified Astryx guidance |
| D-076 | Design-system architecture | Refined by D-099: Vodafone Foundations provide color and typography, verified Astryx notes provide the remaining preferred presentation/engineering baseline, and Design Flow owns the runtime implementation |
| D-077 | Astryx dependency | Astryx is not installed, bundled, wrapped, or used as a runtime dependency; its code and component APIs are not source of truth |
| D-078 | Design Flow UI library | Shared components are implemented and owned under `src/ui/`, use Vodafone color/typography plus Design Flow aliases mapped to verified Astryx presentation, expose documented project APIs, and require accessibility, behavior, responsive, and automated-test coverage |
| D-079 | Astryx knowledge base | `references/astryx/` stores concise, source-linked, date-stamped implementation notes distilled from official Astryx guidance; it must not contain copied documentation or become a substitute runtime library |
| D-080 | Foundation gaps | Superseded by D-099 for non-color presentation: Design Flow maps verified Astryx guidance through centralized aliases and may approve an explicit fallback only when the official Astryx value is unavailable |
| D-081 | Hosting and production address | Use Cloudflare Pages Free for the static frontend and Supabase Free for authentication, database, and backend services; prefer `designflow.pages.dev`, use a close free `pages.dev` variation if unavailable, and do not require a purchased or company-owned domain for the MVP |
| D-082 | Hosting capacity boundary | Size the free deployment for the current single internal team and text-based workload with no file uploads; monitor provider quotas, treat a future custom domain or paid upgrade as an operational change rather than an application-architecture change, and reassess before a limit becomes restrictive |
| D-083 | Application stack | Build a client-side React SPA with strict TypeScript, Vite, and React Router Declarative Mode; use current stable versions pinned at scaffold time, current Node LTS, npm, and no SSR, React Server Components, Next.js, or permanent custom API server |
| D-084 | Client data and forms | Use `supabase-js`, TanStack Query, React Hook Form, and Zod; keep report/list view state in URLs and use local React state/Context for small UI state; do not add Redux, Zustand, Prisma, Drizzle, or another general state/ORM layer in the MVP |
| D-085 | Data-operation boundary | Use direct browser access only for RLS-protected ordinary operations, Postgres functions/RPC for atomic multi-record domain operations, and authenticated Edge Functions only for Auth administration or operations requiring server-held secrets; keep privileged keys out of browser code |
| D-086 | Authentication mechanics | Admin account creation, temporary-password reset, Auth disable/reactivate, and other Auth-admin operations run through protected Edge Functions; first sign-in and reset use a `must_change_password` restriction; server-side authorization rechecks Admin privilege independently of the UI |
| D-087 | Styling delivery | Represent approved Vodafone color/typography and Design Flow mappings of verified Astryx presentation as CSS custom properties, and scope component styles with CSS Modules; these mechanisms do not create a second runtime design system, and components may not introduce undocumented values; use neither Tailwind nor CSS-in-JS in the MVP |
| D-088 | Charts | Use Recharts only as the report chart-rendering dependency, styled through centralized Design Flow chart tokens and accompanied by accessible textual/table equivalents; it is not a general component library or design-system authority |
| D-089 | Environments and repository | Use one private, single-package GitHub repository with npm; develop against local Supabase, use one Free staging project with test data for previews, and one Free production project with real portal data; never copy production data into staging/local or expose production secrets to previews |
| D-090 | Verification stack | Use Vitest, React Testing Library, Playwright, Supabase pgTAP database/RLS tests, Deno Edge Function tests, automated accessibility checks, ESLint, Prettier, strict type checking, and a production build as the baseline quality gates |
| D-091 | Backup and recovery | Create encrypted, checksummed daily logical backups in a private Cloudflare R2 bucket with 7 daily, 4 weekly, and 6 monthly retention; create a verified pre-migration backup, run quarterly restore rehearsals, keep a separate Admin-controlled recovery key, and document Auth account reset/recreation if credential recovery is not proven |
| D-092 | Delivery and rollback | GitHub Actions runs complete PR checks and staging delivery; production is manually triggered from `main`, ordered backup → migrations → Edge Functions → smoke checks → frontend → live checks; use forward-only expand–migrate–contract changes, previous-commit redeploys for application regressions, forward database fixes, and backup restore only for data loss/corruption |
| D-093 | Monitoring and free-tier operation | Use privacy-scrubbed Sentry Free, Supabase logs, and GitHub/Cloudflare failure notifications without session replay; review quotas monthly at 70% warning and 85% decision thresholds, do not generate artificial keep-alive traffic, and accept that the free internal MVP has no formal uptime guarantee |
| D-094 | Bootstrap and rollout | Bootstrap the first account as Manager + Admin so the initial active hierarchy is valid, then establish organizational/reference data through an auditable procedure; use no automatic historical import, then run staging acceptance, a one-working-week limited production pilot, full-team launch, and two-week stabilization behind explicit security, recovery, permission, workflow, reporting, and runbook gates; Admin owns system operation while Manager owns the organizational view |
| D-095 | MVP build order | Build in eight gated phases: schema/security contracts; project foundation; authentication/Team/Settings; work-item foundation; work logging; operational experience; reports/exports; and production hardening/rollout. Grow `src/ui/` just in time, keep every phase vertically testable, and require the shared definition of done in `docs/build-plan.md` before advancing |
| D-096 | Phase 1 foundation gaps | Resolved on 2026-07-20 under D-099. The approved Vodafone VF v4.000 variable WOFF2 is loaded for weights 200–900. The Phase 1 presentation aliases, App Shell, Button, and Input were remapped to the verified Astryx values recorded in `references/astryx/`; Vodafone color/typography and Design Flow implementation ownership remain unchanged |
| D-097 | Integrated Log Work launch paths | Ticket-mode Log Work may include an optional status change and a Create New Ticket path. Status transition, ticket creation, and work-log submission remain independent operations with their own authorization, validation, idempotency, history/audit, and notification effects. After successful ticket creation, the unfinished Log Work form resumes with the new ticket selected and all existing draft data preserved |
| D-098 | UI direction and readiness | `docs/ui-direction.md` governs stable cross-product UI character, hierarchy, density, responsive, state, composition, and accessibility principles without becoming a screen specification. Every UI-bearing feature phase requires an approved brief, component-reuse analysis, desktop/mobile and state behavior, keyboard/accessibility behavior, and staging verification against the brief before completion |
| D-099 | Component presentation authority | Vodafone Foundations remain authoritative only for color and typography. Verified official Astryx guidance is the preferred baseline for all other component and pattern presentation and engineering behavior, including anatomy, proportions, density, sizing, internal spacing, shape, border/elevation geometry, motion, interaction, states, accessibility, and responsive behavior. Design Flow reimplements that guidance under `src/ui/` with its own APIs and centralized semantic mappings; it does not install, wrap, import, or copy Astryx code, styling files, documentation, or APIs. Product behavior, mandatory accessibility, Vodafone color/typography, and explicitly documented unavailable guidance may require the smallest recorded deviation. This supersedes the conflicting visual-authority portions of D-074 through D-076, D-080, and D-096 while preserving the zero-runtime and Design Flow ownership boundaries in D-077 through D-079 and the delivery mechanism in D-087 |
| D-100 | Phase 1 database boundary | Phase 1 creates the complete physical table/constraint/index/reference-data foundation, RLS and read surfaces, authorization helpers, synthetic principal fixtures, generated database types, and structural/read-permission tests. Feature mutation RPCs, write effects, atomicity/idempotency tests, and feature-specific write policies ship in the owning Phase 2–4 vertical slice. No table is exposed without RLS, and deferral does not weaken or change any approved Phase 0 operation contract. Sensitive comment/work-log base grants remain revoked; their masked/filtered browser views use a security barrier, owning-role reads, and an explicit application-user predicate because a security-invoker view cannot read an intentionally ungranted base column |

## Explicitly rejected or replaced

| Direction | Replacement |
|---|---|
| Microsoft/OAuth authentication | Admin-created email/password accounts |
| Public self-registration | Closed account provisioning by Admin |
| Multiple equal assignees | One primary assignee plus derived contributors |
| Project hierarchy | Area/Squad directly on ticket |
| Priority field | Due dates, blockers, status, and team alignment |
| Generic URLs and attachments | One Figma URL only |
| Blocked status/label | Structured blocker record alongside workflow status |
| Cancelled/Not proceeding status | Backlog or Paused, then archive where appropriate |
| Full child tickets in All Tickets | Checklist subtasks visible only inside parent |
| Required free-text work update | Required work type plus optional description |
| Continuous date range record | One to five explicit work dates |
| Visual work as a fake ticket | Standalone visual-work context |
| Explicit designer comparison action | Neutral multi-selection in Designers report |
| Hours/effort/productivity scoring | Explainable activity and ownership measures |
| Reporting group as a visibility boundary | Full Lead visibility with reporting groups used only as default/filter scope |
| Last login as a people-management signal | Last recorded ticket/visual work date, clearly labeled |
| Manual or inferred availability | Due-date-derived Planned until with explicit missing-date states |
| Separate subtask table column | Derived subtask badge inside the ticket title cell/card area |
| Figma hidden behind Work Item navigation | Direct accessible Figma icon on each applicable list row/card |
| Editable ticket spreadsheet | Navigational list with purpose-built editing and work-log flows |
| Monthly ticket calendar | Five-column Work Dates index plus vertical history timeline |
| Comments automatically included in ticket export | Optional Include comments control, off by default |
| Exporting only the current screen page | Export every row matching the visible report controls |
| Reports PDF in the MVP | Filter-aware CSV exports plus the separate Work Item PDF |
| Saved report presets | URL-backed report state without saved configurations |
| Area-restricted or external Viewer | Whole-team internal Viewer; future PO/external access requires a separate model |
| Admin as an exclusive organizational role | Designer/Lead/Manager position plus independent Admin privilege; Viewer remains ineligible for Admin |
| Manager as the system operator by default | Admin privilege owns system operation independently of Manager organizational responsibility |
| Flat Designer-to-Lead reporting only | Effective-dated Designer-to-Lead-to-Manager hierarchy |
| Astryx as a runtime component library | Astryx as a distilled engineering reference with zero runtime dependency |
| Astryx wrappers or copied component APIs | Design Flow-owned components and public APIs under `src/ui/` |
| Vodafone and Astryx as competing design systems | Vodafone color/typography authority plus verified Astryx non-color presentation/engineering guidance plus Design Flow implementation ownership |
| Vodafone ownership of spacing, shape, elevation, sizing, and motion | Vodafone ownership of color and typography; verified Astryx presentation for the remaining visual grammar; Design Flow-owned runtime mappings |
| Astryx as behavior-only guidance | Astryx as the preferred non-color, non-typographic presentation and engineering reference with zero runtime dependency |

## Open decisions

No pre-implementation product or technical decisions remain open. New discoveries must follow the change rule below rather than being invented silently during implementation.

## Change rule

When an approved decision changes:

1. Update this register with the new outcome and date.
2. Update every affected source-of-truth document.
3. Update schema contracts and acceptance criteria before implementation.
4. Add migration and compatibility notes if code or stored data already exists.
