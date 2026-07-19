# Migration gate

The first Design Flow migration must implement the complete initial schema and
Row Level Security together. Do not add an extensions-only, tables-only, or
otherwise partial “first migration.”

Before that migration is committed, it must be verified from a clean local
reset against the first-migration gate in
[`docs/schema-contract.md`](../../docs/schema-contract.md), the complete
allow/deny cases in
[`docs/permission-matrix.md`](../../docs/permission-matrix.md), and the atomic
operation rules in
[`docs/operation-contracts.md`](../../docs/operation-contracts.md).

The current machine has a verified free Colima/Docker-compatible runtime and
the local Supabase image set. The migration remains absent until the Phase 1
complete-schema wording is reconciled with the build plan's Phase 2–4 ownership
of account, ticket, and work-log mutation operations; do not treat runtime
availability as authorization to cross those phase boundaries.
