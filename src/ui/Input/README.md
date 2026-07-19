# Input

Design Flow-owned single-line text input.

## Public API

- required `label`
- optional `description` and `error`
- optional `hideLabel` for contexts with an equally clear visible purpose
- standard native input attributes and forwarded ref

Visible labels are the default. Placeholder text never substitutes for a label.
Errors are associated with the input and communicated as text.
