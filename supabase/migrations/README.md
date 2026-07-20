# Migration gate

The first Design Flow migration must implement the complete initial schema and
Row Level Security/read exposure together. Do not add an extensions-only,
unprotected tables-only, or otherwise partial physical-schema migration.

Before that migration is committed, it must be verified from a clean local
reset against the Phase 1 portion of the first-migration gate in
[`docs/schema-contract.md`](../../docs/schema-contract.md), the complete
applicable read allow/deny cases in
[`docs/permission-matrix.md`](../../docs/permission-matrix.md), and the atomic
operation boundaries in
[`docs/operation-contracts.md`](../../docs/operation-contracts.md).

Under D-100, the first migration includes all contracted physical tables,
constraints, indexes, stable reference values, RLS/read surfaces, authorization
helpers, and generated-type inputs. Feature mutation RPCs and their atomic,
idempotent write tests remain in their owning Phase 2–4 slices. Until an owning
RPC exists, its feature tables have no browser mutation path.
