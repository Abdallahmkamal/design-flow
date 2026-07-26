# Demo and validation datasets

**Status:** Phase 6 lightweight dataset implemented; official generator deferred
**Decision:** D-102
**Last updated:** 2026-07-26

## Phase 6 lightweight validation dataset

`supabase/fixtures/phase6_validation.sql` is a small, opt-in dataset for local
and staging acceptance of Dashboard, Reports, filters, CSV, Work Item PDF, and
empty/no-results states. It reuses the nine reserved synthetic permission
personas and creates nine Areas, fourteen tickets, twenty work-log batches,
fifty work-log entries, derived contributors, one active blocker, and two PDF
comments. Standalone Visual Work is conspicuously labelled and remains separate
from ticket activity.

The fixture is deterministic for an explicit validation anchor date,
repeatable, and idempotent when rerun with that same anchor. A different anchor
requires a reset so historical date meaning is never silently rewritten. It is
not part of the automatic seed because normal pgTAP resets require controlled
empty-domain preconditions.

Run locally after a clean reset:

```sh
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  --set=validation_environment=local \
  --set=validation_anchor_date=2026-07-26 \
  --file supabase/fixtures/phase6_validation.sql
```

For an authorized staging acceptance pass, use the staging connection and set
`validation_environment=staging`; choose the acceptance date as the anchor.
The script refuses any other environment, requires all nine reserved synthetic
personas, and refuses a database containing any non-synthetic profile. It must
never be run against production. Loading it does not change migrations, RLS,
permissions, or normal application write boundaries.

Coverage includes all six approved ticket statuses; overdue, due-today, and
due-this-week tickets; blocked, paused, completed, and archived records; a
ticket without work logs; a ticket with many logs; multiple contributors;
clearly different high/low activity volumes; standalone Visual Work; and
tickets without Figma links. Priority is intentionally not represented because
the approved MVP replaces Priority with due dates, blockers, status, and team
alignment (see `docs/decisions.md`); adding it would be a schema/product change.

## Official post-MVP Demo Data Generator

The v1.1 generator is documentation-only during MVP. It is planned as
deterministic code—not CSV imports—with a repeatable seed command and an
explicit local/staging-only production guard. Its purposes are local
development, staging resets, Dashboard/Reports/export validation, screenshots,
and demonstrations.

The planned scale is approximately sixteen Areas, fourteen users, fifty
tickets, 250 work logs, 150 comments, assignment history, and realistic UX
work. Generated organizations and timelines should remain conspicuously
synthetic, stable for a declared seed/anchor, and reconcile to the same
authoritative formulas and permission scopes as product data.

Implementation is deferred until after MVP. D-102 and the Post-MVP Product
Enhancements section of `docs/build-plan.md` govern that future slice.
