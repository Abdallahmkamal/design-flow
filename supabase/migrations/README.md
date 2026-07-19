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

The current machine does not have a Docker-compatible runtime, so Phase 1
establishes the configuration and test harness without pretending the initial
schema is verified.
