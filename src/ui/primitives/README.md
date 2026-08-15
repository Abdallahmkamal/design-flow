# Team-ready primitives

These source-owned primitives are the initial D-109 modernization layer. They
are based on the shadcn composition approach and Radix interaction primitives,
but their public APIs and implementation belong to Design Flow.

## Foundation contract

- `src/ui/foundation.css` maps Tailwind semantic names to the authoritative
  Vodafone color and typography tokens in `src/styles/tokens.css`.
- Light/Dark values continue to switch through `data-theme`.
- Tailwind Preflight is deliberately omitted while legacy CSS Modules coexist.
- Feature/domain behavior and data access never belong in these primitives.

## Approved Slice 1 set

- `Button`: default, secondary, ghost, destructive; small/default/large/icon;
  loading and `asChild` composition.
- `Badge`: neutral and semantic feedback tones.
- `Avatar`: image and accessible fallback composition; `getInitials` helper.
- `Tooltip`: delayed/focus-accessible description with provider/trigger/content.
- `DropdownMenu`: keyboard-managed menu, items, labels, separators, check/radio
  items, and submenus.
- `Sheet`: modal top/right/bottom/left surface with title, description, close;
  `SheetPortal` and `SheetPrimitiveContent` support source-owned composed modal layouts,
  header, and footer; focus trap and restoration are provided by Radix Dialog.
- `Separator`: decorative by default, horizontal or vertical.

Do not add later-slice primitives here until their owning slice requires them.

## Slice 2 form controls

- `FormInput`, `FormSelect`, `FormMultiSelect`, `FormDatePicker`, `FormTextarea`, and `FormCheckbox`
  provide the shared field label, required marker, description, validation,
  disabled, hover, and focus states for migrated workflows.
- Their 48px control height, 12px radius, 1px semantic border, 12px horizontal
  inset, Vodafone 14px medium label, and Vodafone 16px value typography map the
  approved Log Work and Create Ticket Figma anatomy through the shadcn layer.
- Box sizing is explicit because Tailwind Preflight remains disabled during
  legacy coexistence.
- `FormSelect` composes the source-owned shadcn Select over Base UI; its trigger
  and popup remain keyboard-accessible when nested in the route-backed sheet.
  The popup is bounded by both 20rem and the available viewport height; its list
  owns wheel/touch scrolling with overscroll containment on desktop and mobile.
- `FormMultiSelect` preserves that labelled field geometry while exposing a
  scrollable multi-select dropdown and a concise selected-value summary.
- `FormDatePicker` follows the shadcn Date Picker composition: a Base UI Popover
  contains the source-owned React DayPicker calendar and preserves ISO values at
  the feature boundary.
- `ButtonGroup` owns the connected ticket-search input/button geometry. Select
  chevrons, date affordances, and checkbox chrome are source-owned so
  browser-native icon sizing cannot diverge across related fields.

## Slice 6 Dashboard surfaces and feedback

- `Card`, `CardHeader`, `CardContent`, and `CardFooter` provide the reusable
  semantic surface composition used by Dashboard summaries and sections.
- `Skeleton` preserves layout during loading, `Empty` appears only after a
  successful empty result, and `Alert` presents failures without resetting the
  active URL scope.

## Combined Slices 7–8 Reports and Settings

- `Tabs`, `TabsList`, `TabsTrigger`, and `TabsContent` provide URL-controlled
  tab anatomy with arrow/Home/End keyboard navigation and horizontally
  scrollable narrow-screen composition.
- `Table` and its semantic section/cell components provide source-owned shadcn
  table presentation without changing server pagination or row behavior.
- `ChartContainer`, `ChartConfig`, tooltip, and legend helpers map Recharts to
  Vodafone chart variables while leaving exact-value accessible tables to the
  feature composition.
- `AlertDialog` provides modal focus management for unsaved-edit decisions;
  destructive domain confirmations remain separate.
