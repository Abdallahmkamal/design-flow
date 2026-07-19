# Design Flow technical plan

**Status:** Approved for MVP implementation  
**Last updated:** 2026-07-19

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

Never expose Supabase secret/service-role or Auth-admin credentials in browser code. Edge Functions must authenticate the request and independently verify the caller's current Admin privilege before using elevated credentials. UI capability checks are for usability and never replace RLS or server-side authorization.

## 4. Authentication implementation

- Public registration remains disabled.
- Admin account creation and temporary-password reset use protected Edge Functions.
- Temporary credentials are generated securely, displayed once to the Admin, and delivered outside the portal.
- A profile-level `must_change_password` state restricts first-time or reset users to the password-change flow until completed.
- Deactivation updates the application account state and disables the corresponding Supabase Auth account; reactivation reverses both through an authorized Edge Function.
- Supabase manages browser sessions and token refresh.
- Never log or store passwords in application or administration audit records.

## 5. Styling and design-system alignment

The styling technology implements the locked design-system hierarchy; it does not alter it.

1. `docs/design-system.md` owns Vodafone visual foundations and approved Design Flow token extensions.
2. CSS custom properties are the runtime representation of those approved tokens.
3. CSS Modules scope styles to Design Flow-owned components under `src/ui/`.
4. Distilled Astryx notes guide engineering behavior only and supply no runtime code or visual values.

Therefore:

- CSS variable names and values must trace to the design-system contract.
- CSS Modules must consume semantic variables rather than create parallel token values.
- Missing radius, motion, sizing, or other foundations must be approved and added to `docs/design-system.md` before use.
- Do not use Tailwind, CSS-in-JS, Astryx packages, a generic runtime component library, or copied upstream component code.
- Prefer native HTML behavior when it can satisfy the approved component contract and accessibility requirements.

This explicitly preserves D-074 through D-080 and the ownership rules in `docs/ui-architecture.md`.

## 6. Report charts

Use Recharts only for the approved bar and line report visualizations.

- Resolve chart colors, typography, spacing, and states through centralized Design Flow chart tokens.
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

Run a daily logical database backup through GitHub Actions and store it in a private Cloudflare R2 bucket. The backup artifact must be compressed, encrypted before upload, and accompanied by a checksum. The R2 bucket must never be public, and its automation token must be limited to the backup bucket and the operations the workflow needs.

Retain:

- 7 daily backups
- 4 weekly backups
- 6 monthly backups

Create and verify an additional backup immediately before every production database migration. Application code, migrations, Edge Functions, and configuration contracts remain versioned in Git rather than duplicated as the primary source of truth in database backups. No separate user-file backup is required while the MVP has no uploads.

Keep the automation encryption key in protected GitHub secrets and a separate recovery copy under Admin control in an approved secure location. A failed backup must fail visibly and notify the technical owner. Perform an actual restore rehearsal to local or staging every three months, recording the date, result, recovery duration, and follow-up actions.

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

1. Create and verify the pre-deployment backup.
2. Apply production database migrations.
3. Deploy Edge Functions.
4. Run authentication and database smoke checks.
5. Deploy the Cloudflare Pages frontend.
6. Run final live smoke checks and record the release result.

Use backward-compatible, forward-only database migrations. For changes that remove or reinterpret persisted structures, use expand–migrate–contract across separate releases after old application code is no longer in use. Do not run automatic production down-migrations.

For a frontend or Edge Function regression, redeploy the previous known-good commit. For a database defect, prefer a reviewed forward corrective migration. Restore a backup only for confirmed data loss or corruption, not as the ordinary code rollback mechanism. Stop the release and preserve diagnostics when a migration or smoke check fails; later deployment stages must not continue.

## 11. Monitoring, alerts, and free-tier boundaries

Use the following free MVP monitoring layers:

- Sentry Free for frontend errors and unexpected application failures, owned by the technical maintainer account.
- Supabase Logs Explorer for Auth, database/API, and Edge Function investigation.
- GitHub notifications for failed tests, backups, and deployments.
- Cloudflare email notifications for relevant Pages and account events supported by the selected free plan.

Do not enable session replay in the MVP. Error instrumentation must disable default personal-information collection and scrub ticket descriptions, comments, work-log details, email addresses, Figma URLs, form contents, credentials, and tokens.

Review provider consumption at least monthly, including Supabase database size and egress, Edge Function usage, GitHub Actions minutes, R2 backup storage, and Sentry event volume. Treat 70% of an applicable free allowance as a warning and 85% as a decision point for cleanup, an architectural adjustment, or a paid upgrade before the limit becomes disruptive.

Do not generate artificial keep-alive traffic solely to prevent a free Supabase project from pausing. The Admin runbook must explain how to detect and resume a project after extended inactivity. The free MVP has no formal uptime or service-level guarantee; this limitation is explicit and acceptable for the current internal team.

## 12. Bootstrap, pilot, and rollout

Complete synthetic-data acceptance testing in staging before creating production records. Bootstrap production through an auditable Admin procedure that creates the first Admin-privileged Manager account, then establishes any other Managers, Leads, Designers, Viewer accounts, reporting lines, statuses, work types, Areas/Squads, and labels. The first account uses Manager position so the initial active hierarchy is valid before supervisors exist. Admin privilege remains an operational overlay and does not replace the first Admin's organizational position or reporting relationship.

Do not automatically import historical data in the MVP. Current work items may be entered manually, and prior actual work may use the approved backdated logging flow.

Roll out in this order:

1. One working week of staging acceptance and full position/Admin/RLS testing.
2. One working week of limited production use by the Admin + Lead, Manager, another Lead, and two Designers.
3. Resolve launch-blocking findings and re-run affected acceptance checks.
4. Open production to the complete team.
5. Keep a two-week stabilization period before taking nonessential enhancements into implementation.

Production launch requires:

- the permission matrix and RLS allow/deny tests passing;
- backup creation and restore rehearsal passing;
- account creation, first-password-change, reset, deactivate, and reactivate flows verified;
- critical work-item, blocker, comment, notification, and work-log journeys passing;
- reporting and export totals reconciled against controlled sample data;
- no unresolved security, data-loss, or core-workflow defect; and
- deployment, incident, quota, pause/resume, and recovery runbooks available to the Admin.

The Admin owns system operation and first-line technical support whether their eligible position is Designer, Lead, or Manager. The Manager owns the team-wide organizational and reporting view. Do not conflate these responsibilities. During stabilization, address security or data integrity incidents first, then authentication/core-workflow failures, then lower-impact issues.
