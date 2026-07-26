# DataTable

Design Flow-owned responsive columnar data display.

## Public API

- accessible `caption`
- typed `columns` with visible desktop and mobile labels
- typed `rows` and stable row-key resolver
- optional contextual empty content
- optional sortable headers and pointer row activation
- optional feature-owned mobile-card rendering for rows with independent actions

Desktop uses native table semantics. Below the shell breakpoint, the same data
is rendered as a structured list of records rather than a compressed table.
Pointer row activation is only a convenience for otherwise noninteractive row
space. Native links and buttons remain the only keyboard destinations.
