# Button

Design Flow-owned action control.

## Public API

- `variant`: `primary`, `secondary`, `ghost`, or `destructive`
- `size`: `small`, `medium`, or `large`
- `isLoading`: disables duplicate activation and exposes `aria-busy`
- `leadingIcon`: decorative support for a visible action label
- standard native button attributes and forwarded ref

Use one primary action per view. Use links for navigation. Labels describe the
action, and irreversible destructive actions require a separate confirmation
flow.
