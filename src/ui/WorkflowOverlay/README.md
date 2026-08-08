# WorkflowOverlay

Design Flow-owned route-backed overlay for substantial forms. `title` and
`description` name the dialog, `children` scroll independently, and `footer`
stays fixed above the device safe area. `isDirty` enables the in-place discard
confirmation; `isBusy` protects in-flight work. `onBack` supports a nested
workflow in the same overlay without another backdrop or focus trap.

Desktop uses a 600px right panel. Mobile covers the application shell. Radix
Dialog supplies background inertness, the focus trap, and focus restoration.
