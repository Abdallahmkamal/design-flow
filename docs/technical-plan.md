# Design Flow technical plan

**Status:** Approved MVP architecture with team-ready post-MVP amendments
**Last updated:** 2026-08-22 — D-118 adds the canonical calendar, deadline, and reporting-read architecture

This document records the approved implementation architecture and operating model for Design Flow. The approved module sequence and slice-level completion gates are defined in [build-plan.md](build-plan.md).

## 1. Runtime architecture

Design Flow is a client-side single-page application:

- React with strict TypeScript
- Vite for local development and static production builds
- React Router in Declarative Mode
- Cloudflare Pages Free for the static frontend
- Supabase Free for Postgres, Auth, Data API, and Edge Functions
- Preferred production address `designflow.pages.dev`, with a close free `pages.dev` alternative if unavailable

Do not add SSR, React Server Components, Next.js, or a permanent custom API server. Select current stable package versions during scaffolding, pin them in `package-lock.json`, and pin the current Node LTS for local and CI use. Use npm and keep the repository a single application package rather than a monorepo.

## 2. Frontend data and state

- Use `@supabase/supabase-js` for Supabase access.
- Use TanStack Query for loading, caching, invalidation, pagination, and server-state synchronization.
- Use React Hook Form for form state and Zod for runtime validation and type-safe schemas.
- Keep approved report/list filters, sorting, and visible-view state in URL parameters.
- Use local React state or Context only for small interface state.
- Do not add Redux, Zustand, Prisma, Drizzle, or another general state/ORM layer in the MVP.
- Do not add Supabase Realtime initially; query invalidation and explicit refresh are sufficient for the current team.

## 3. Operation and security boundary

Use the smallest appropriate trusted boundary:

| Boundary | Use |
|---|---|
| Browser with Supabase publishable key | Ordinary reads and simple writes protected by tested RLS |
| Postgres function/RPC | Atomic multi-record domain operations and history/audit changes that must succeed or fail together |
| Authenticated Edge Function | Supabase Auth administration or another operation that requires a server-held secret |

Examples of RPC candidates include reassignment plus assignment history, status transition plus history, blocker create/resolve plus audit, and work-log correction/withdrawal plus recalculation. Exact RPC contracts belong in the schema/build plan.

Derived ticket calendar/reporting values use one shared Postgres policy layer rather than client reconstruction. Days Open, Days Active, overdue, Planned Until, and status-duration reads resolve through the canonical SQL helpers documented in `schema-contract.md`; list, detail, Dashboard, Reports, drill-down, and CSV functions consume those helpers. Persisted `due_date` remains the storage/API field while the UI presents Next Deadline. In Review → In Progress uses the atomic status/deadline RPC contract, and report reads default to not archived while preserving an explicit URL/RPC archived-state override.

Never expose Supabase secret/service-role or Auth-admin credentials in browser code. Edge Functions must authenticate the request and independently verify the caller's current Admin privilege before using elevated credentials. UI capability checks are for usability and never replace RLS or server-side authorization.

## 4. Authentication implementation

- Public registration remains disabled.
- Admin account creation and temporary-password reset use protected Edge Functions.
- Temporary credentials are generated securely, displayed once to the Admin, and delivered outside the portal.
- A profile-level `must_change_password` state restricts first-time or reset users to the password-change flow until completed.
- Deactivation updates the application account state and disables the corresponding Supabase Auth account; reactivation reverses both through an authorized Edge Function.
- Supabase manages browser sessions and token refresh.
- Never log or store passwords in application or administration audit records.
- Modernization Slice 5 changes user-chosen password validation to a minimum of eight characters with no composition rule. UI, Edge validation, tests, and applicable Supabase configuration deploy together; email remains the identifier and existing users are not reset solely because the minimum changes.

## 5. Styling and design-system alignment

### Completed MVP baseline

The styling technology implements the locked design-system hierarchy; it does not alter it.

1. `docs/design-system.md` owns Vodafone color/typography and the approved runtime mappings for verified Astryx non-color presentation.
2. CSS custom properties are the runtime representation of those approved tokens.
3. CSS Modules scope styles to Design Flow-owned components under `src/ui/`.
4. Distilled Astryx notes supply the preferred, source-linked non-color presentation and engineering target, but no runtime code, styling files, or component APIs.

Therefore:

- CSS variable names and values must trace either to Vodafone color/typography or to a documented Design Flow mapping of verified Astryx presentation.
- CSS Modules must consume semantic variables rather than create parallel token values.
- Missing Astryx spacing, radius, motion, sizing, elevation, or other presentation values must be recorded as gaps; an explicit Design Flow fallback must be approved and added to `docs/design-system.md` before use.
- Do not use Tailwind, CSS-in-JS, Astryx packages, a generic runtime component library, or copied upstream component code.
- Prefer native HTML behavior when it can satisfy the approved component contract and accessibility requirements.
- Treat Astryx fidelity as a Design Flow-owned reimplementation from verified official guidance, never as authorization to copy upstream source or styling.

This implements D-099, which supersedes the conflicting visual-authority portions of D-074 through D-076, D-080, and D-096 while preserving the zero-runtime and Design Flow ownership boundaries in D-077 through D-079 and the styling-delivery mechanism in D-087.

### Team-ready modernization layer

D-109 supersedes the MVP-only Tailwind prohibition and Astryx-first presentation requirement for surfaces migrated by the post-MVP team-ready workstream:

- Vodafone semantic colors and typography remain authoritative and map into Tailwind/shadcn semantic variables for Light and Dark modes.
- shadcn/ui is source-owned starting code. Imported primitives become Design Flow code under `src/ui/`, use project-owned public APIs, and do not become a product-behavior or visual-authority source.
- Tailwind utilities may style new and migrated components. Existing CSS Modules remain supported for unmigrated screens and may coexist during incremental rollout.
- Global Tailwind Preflight remains disabled while any unmigrated legacy screen remains, preventing a foundation change from silently restyling working UI.
- Add only primitives required by the current slice. Product compositions such as the module header, responsive shell, filter chips, and overlay family remain Design Flow-owned patterns.
- The existing Astryx notes and D-077 through D-099 remain the historical record of the completed MVP and may still explain legacy components; they do not constrain the new shadcn-based presentation layer beyond retained accessibility and Design Flow ownership requirements.

The first modernization slice has two internal checkpoints on one branch: foundation/primitives, then shell/navigation as the first verified consumer. Verification runs after both checkpoints, but there is no separate branch or staging deployment between them.

## 5A. Team-ready routing and incremental replacement

- Keep the canonical copied ticket URL `/work-items/:displayId`. A ticket opened from All Tickets uses that route as a responsive overlay while preserving URL-backed list state; a direct visit establishes the Work Items context with the ticket already open.
- Log Work and Create Ticket share one responsive overlay family. Nested Create Ticket replaces the Log Work overlay content rather than stacking another backdrop or focus trap, and returns to the preserved draft.
- Remove Team as a visible route and navigation destination in Slice 1. Retain profile, reporting-line, public-directory read surfaces, and administration contracts because Settings, permissions, and reporting depend on that data.
- Keep legacy components and feature screens available until their replacement slice passes its local and staging gates. Additive read/API changes should preserve the previous frontend during rollout where practical.
- Changed permission behavior becomes effective only when the owning slice is deployed: shell visibility in Slice 1, Designer Dashboard scope in Slice 6, and Reports scope/export enforcement in Slice 7.

## 5B. Team-ready permission and operation boundary

- Viewer retains Dashboard, Work Items, and whole-team read-only Reports; server authorization denies every mutation, Team, Settings, and Reports CSV path regardless of hidden controls.
- Designer without Admin is hard-limited to self in Dashboard and Reports, including direct URLs, RPC filters, drill-down, and CSV. Lead without Admin defaults to their reporting group and may select All or Me. Manager and every Admin-privileged principal default to All.
- One primary assignee remains the schema and mutation contract. The reviewed multi-assignee direction is intentionally deferred until after rollout; contributors remain derived from valid work logs.
- All Tickets has no CSV action. Reports owns all portable CSV exports and selects its row schema from the active tab.
- Log Work remains client-orchestrated independent operations: save the log; refresh authoritative ticket state/permissions; attempt status; attempt selected subtask completions with independent operation IDs. Preserve successful results, identify partial failure precisely, retry only failed operations, never resubmit a successful log, and refresh displayed ticket state after every completed operation.

## 6. Report charts

Use Recharts only for the approved bar and line report visualizations.

- Resolve chart colors and typography through Vodafone mappings. Resolve non-color presentation and states through relevant verified Astryx guidance where available, with explicit Design Flow fallbacks for documented gaps.
- Do not use Recharts defaults as visual authority.
- Every chart must have an accessible textual summary or data table containing the essential information.
- Recharts does not provide general UI components and does not alter `src/ui/` ownership.

## 7. Environments and repository

Use:

- Local Supabase through the CLI and a Docker-compatible runtime for development and CI.
- One Supabase Free staging project containing only seeded/test data for Cloudflare previews.
- One Supabase Free production project containing real portal data.
- One private GitHub repository with feature branches, pull requests, and `main` representing production.

Production data must never be copied into local or staging environments. Preview builds use staging credentials only. Production credentials are limited to protected deployment contexts and never exposed to previews.

## 8. Verification baseline

Use:

- Vitest for unit and component tests
- React Testing Library for user-focused component behavior
- Playwright for critical browser journeys
- pgTAP through the Supabase CLI for schema, function, constraint, and RLS tests
- Deno tests for Edge Functions
- automated accessibility checks plus manual keyboard checks for critical interactions
- ESLint, Prettier, strict TypeScript checking, and a production build

Every implementation slice must test the relevant organizational positions and repeat affected paths with and without independent Admin privilege for Designer, Lead, and Manager. Permission tests must prove both allowed and denied behavior, including rejection of Viewer + Admin.

## 9. Backup and recovery

The strict zero-billing MVP does not accept a hosted backup subscription. An
authorized Admin creates each logical database backup from an approved operator
environment, compresses and encrypts it before storage, and keeps its SHA-256
checksum alongside the encrypted artifact on named Admin-controlled offline
storage. The recovery key is stored separately. No unencrypted dump may be
retained or uploaded.

Retain:

- 7 daily backups
- 4 weekly backups
- 6 monthly backups

Create and verify an additional backup immediately before every production
database migration. Record its non-secret label and checksum in the manually
triggered production workflow. Application code, migrations, Edge Functions,
and configuration contracts remain versioned in Git rather than duplicated as
the primary source of truth in database backups. No separate user-file backup
is required while the MVP has no uploads.

Keep the recovery key separate from the offline backup media under Admin
control. A failed creation or verification stops the release before the
production workflow is dispatched. Perform an actual isolated restore rehearsal
every three months, recording the date, result, recovery duration, and follow-up
actions. Production bootstrap and rollout remain blocked until the destination
is named and the production-source backup procedure is rehearsed successfully.

The first restore rehearsal must explicitly verify what Supabase Auth identity data and credential state can be recovered from the selected logical export. If credentials cannot be restored safely, the recovery runbook must require Admin-led account recreation or password reset; never imply that an untested database dump guarantees credential recovery.

## 10. Deployment and recovery from failed releases

GitHub Actions owns the ordered delivery workflow. A pull request must:

1. Install pinned dependencies with `npm ci`.
2. Run format, lint, strict TypeScript, unit, and component checks.
3. Start local Supabase and apply all migrations from zero.
4. Run database, function, RLS, and Edge Function tests.
5. Run critical Playwright journeys and accessibility checks.
6. Create the production frontend build.
7. Update the staging deployment only after required checks pass, using staging credentials and test data only.

After an approved change is merged to `main`, production deployment is a manually triggered workflow started by an authorized repository owner/Admin. It must:

1. Confirm the independently created and verified offline pre-deployment backup label and checksum.
2. Apply production database migrations.
3. Deploy Edge Functions.
4. Run authentication and database smoke checks.
5. Deploy the Cloudflare Pages frontend.
6. Run final live smoke checks and record the release result.

Use backward-compatible, forward-only database migrations. For changes that remove or reinterpret persisted structures, use expand–migrate–contract across separate releases after old application code is no longer in use. Do not run automatic production down-migrations.

For a frontend or Edge Function regression, redeploy the previous known-good commit. For a database defect, prefer a reviewed forward corrective migration. Restore a backup only for confirmed data loss or corruption, not as the ordinary code rollback mechanism. Stop the release and preserve diagnostics when a migration or smoke check fails; later deployment stages must not continue.

## 11. Monitoring, alerts, and free-tier boundaries

Use only monitoring already included with the approved hosting/repository stack:

- the portal's fail-safe route error state and reproducible incident details reported to the Admin without private record contents;
- Supabase Logs Explorer for Auth, database/API, and Edge Function investigation.
- GitHub workflow results for failed tests and deployments.
- Cloudflare email notifications for relevant Pages and account events supported by the selected free plan.

Do not add external error ingestion, analytics, session replay, or client-side
telemetry in the MVP. Incident records and screenshots must omit ticket
descriptions, comments, work-log details, email addresses, Figma URLs, form
contents, credentials, and tokens.

Review provider consumption at least monthly, including Supabase database size
and egress, Edge Function usage, GitHub Actions minutes/storage, and Cloudflare
Pages usage. Treat 70% of an applicable included allowance as a warning and 85%
as a stop-and-decide point. A paid upgrade requires a separate explicit
decision; it is never automatic.

Do not generate artificial keep-alive traffic solely to prevent a free Supabase project from pausing. The Admin runbook must explain how to detect and resume a project after extended inactivity. The free MVP has no formal uptime or service-level guarantee; this limitation is explicit and acceptable for the current internal team.

## 12. Bootstrap and rollout

Complete synthetic-data acceptance testing in staging before creating production records. Bootstrap production through an auditable Admin procedure that creates the first Admin-privileged Manager account, then establishes any other Managers, Leads, Designers, Viewer accounts, reporting lines, statuses, work types, Areas/Squads, and labels. The first account uses Manager position so the initial active hierarchy is valid before supervisors exist. Admin privilege remains an operational overlay and does not replace the first Admin's organizational position or reporting relationship.

Do not automatically import historical data in the MVP. Current work items may be entered manually, and prior actual work may use the approved backdated logging flow.

Roll out in this order:

1. Two full working days of staging acceptance and full position/Admin/RLS testing.
2. Complete production bootstrap/recovery, current quota review, and correction/retest of any remaining launch-blocking finding. D-107 explicitly classifies the known 390 px Reports overflow as deferred nonblocking UI-revamp work.
3. After Phase 7 readiness closure, obtain explicit authorization and open production to real team members as they are ready; no fixed pilot roster or pre-release pilot duration is required.
4. As post-MVP operating work, monitor the first two working days of real use for authentication, authorization, notification isolation, source/report reconciliation, provider logs/quotas, and daily encrypted backups. A material blocker triggers incident/pause handling.
5. Continue a two-week post-release stabilization period while post-MVP work proceeds under the normal review, deployment-authorization, incident, and recovery controls.

A staging-acceptance working day counts only when its complete approved matrix
passes. The first two post-release monitoring days are not acceptance days and
may not be presented as a completed pilot.
Blocked or partial staging attempts do not count toward the two-day gate.

Under D-108, steps 1–2 plus the demonstrated delivery, recovery, bootstrap,
quota, configuration, and fresh offline recovery-point evidence close Phase 7.
Steps 3–5 and real-user Core Web Vitals remain unperformed post-MVP operating
work until real-team release begins; closure does not claim otherwise or waive
their controls.

Production launch requires:

- the permission matrix and RLS allow/deny tests passing;
- backup creation and restore rehearsal passing;
- account creation, first-password-change, reset, deactivate, and reactivate flows verified;
- critical work-item, blocker, comment, notification, and work-log journeys passing;
- reporting and export totals reconciled against controlled sample data;
- no unresolved security, data-loss, or core-workflow defect; and
- deployment, incident, quota, pause/resume, and recovery runbooks available to the Admin.

The Admin owns system operation and first-line technical support whether their eligible position is Designer, Lead, or Manager. The Manager owns the team-wide organizational and reporting view. Do not conflate these responsibilities. During stabilization, address security or data integrity incidents first, then authentication/core-workflow failures, then lower-impact issues.
