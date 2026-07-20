# DataTable

Design Flow-owned responsive columnar data display.

## Public API

- accessible `caption`
- typed `columns` with visible desktop and mobile labels
- typed `rows` and stable row-key resolver
- optional contextual empty content

Desktop uses native table semantics. Below the shell breakpoint, the same data
is rendered as a structured list of records rather than a compressed table.
