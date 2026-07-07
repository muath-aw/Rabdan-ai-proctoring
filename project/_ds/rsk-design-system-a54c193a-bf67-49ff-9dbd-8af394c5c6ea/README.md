# RSK Design System — conventions for building UI

Build with the components in this library (imported from `window.RSK.*` / the bundle). They are real React + Tailwind v4 components driven by a semantic design-token theme. Two rules carry most of the weight: **style components through their `variant`/`size` props, and style your own layout with the token-based utility classes below** — never restyle a component's internals with `className`.

## Setup & wrapping
Mount your app inside the theme + direction providers (both are exported from the bundle); without them, tokens and RTL/LTR resolve wrong:

```tsx
import { ThemeProvider, AppDirectionProvider, Button, Card } from 'react-start-kit';

<ThemeProvider defaultTheme="light">      {/* toggles the `.dark` class on <html>; tokens switch with it */}
  <AppDirectionProvider>                  {/* sets dir=ltr|rtl from the active locale */}
    <Card>
      <Card.Header>…</Card.Header>
      <div className="flex items-center gap-2">
        <Button variant="default">Save</Button>
        <Button variant="outline-muted">Cancel</Button>
      </div>
    </Card>
  </AppDirectionProvider>
</ThemeProvider>
```

Dark mode = the `.dark` class on a root element (ThemeProvider manages it). Text renders in the brand font (DM Sans, with IBM Plex Sans Arabic for Arabic) applied globally — you don't set a font class.

## The styling idiom: semantic token utilities (Tailwind v4)
Color/spacing utilities resolve to theme tokens, so they adapt to light/dark automatically. Use the **semantic** names — never raw palette hex or `bg-blue-500`.

| Need | Classes (real, in this theme) |
|---|---|
| Page / surface bg | `bg-background`, `bg-canvas`, `bg-sidebar`, `bg-popover` |
| Text | `text-foreground`, `text-muted-foreground`, `text-primary`, `text-destructive` |
| Brand fill | `bg-primary` + `text-primary-foreground`; tints `bg-primary-15`, `bg-primary-25`, `bg-primary-100` (full `--primary-15`…`--primary-900` scale defined in the theme) |
| Neutral fill / borders | `bg-muted-50`…`bg-muted-400`, `border-border`, `bg-accent` |
| Status (filled-light) | `bg-success-200` / `bg-warning-200` / `bg-destructive-200` (+ `text-success`/`text-warning`/`text-destructive`) |
| Type scale | `text-2xs` `text-xs` `text-sm` `text-base` `text-lg` `text-xl` `text-2xl` |
| Elevation | `shadow`, `shadow-spread`, `shadow-deep`, `shadow-boundary`, `shadow-inner` |

Standard Tailwind layout utilities (`flex`, `grid`, `gap-*`, `p-*`, `rounded-md/lg`, `w-full`) are available and encouraged for your own composition.

## Component styling = props, not className
Each component encodes its design language in `variant`/`size` (and similar) props. Pick by intent:
- `Button` — `variant`: `default` `secondary` `muted` `destructive` `success` `soft-primary` `soft-muted` `ghost` `ghost-primary` `ghost-destructive` `quiet-primary` `surface-primary` `outline` `outline-muted` `outline-destructive` `outline-success` `link`; `size`: `xs` `sm` `default` `lg` `icon` `icon-sm` `full`.
- `Alert` — `variant`: `default` `info` `success` `warning` `destructive` (+ `outline*`); compose `<Alert.Title>` / `<Alert.Description>` and an optional leading icon.
- Form fields (`FormInput`, `FormSelect`, `FormCheckbox`, …) live inside a `<FormContainer formContext={useForm()} onSuccess={…}>` and take a `name` (react-hook-form).

`className` on a component is only for **layout** placement (width, margin, alignment) — never to change its colors, borders, or fills. If no variant fits, that's a design-system gap, not a `className` job.

## Where the truth lives
- Per-component API + usage: `_ds/<…>/components/<group>/<Name>/<Name>.prompt.md` and `<Name>.d.ts`, with a live preview card `<Name>.html`.
- The full token + utility definitions: the bound `styles.css` and its `@import` closure (includes `_ds_bundle.css`). Read these before inventing class names — every color/shadow/text token above is defined there.

# RSK (react-start-kit@2.0.0)

This design system is the published react-start-kit React library, bundled as a single
browser global. All 93 components are the real upstream code.

## Where things are

- `_ds_bundle.js` — the whole-DS bundle at the project root; loads every component to `window.RSK`. First line is a `/* @ds-bundle: … */` metadata header.
- `styles.css` — the single stylesheet entry: it `@import`s the tokens, fonts, and component styles (`_ds_bundle.css`). Link this one file.
- `components/<group>/<Name>/<Name>.prompt.md` (example JSX + variants), `<Name>.d.ts` (types), `<Name>.html` (variant grid).
- `tokens/*.css` — CSS custom properties, names verbatim from upstream.
- `fonts/` — `@font-face` files + `fonts.css` (when the package ships fonts).
- `guidelines/` — the design system's own usage guidance (1 doc(s), see `guidelines/index.md`). Read these before composing larger layouts.

For a specific component, `read_file("components/<group>/<Name>/<Name>.prompt.md")`.

## Loading

Add these two lines to your page once (React must be on the page first):

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
```

Components are then available at `window.RSK.*`. Mount into a dedicated child node (e.g. `<div id="ds-root">`), not the host page's own React root, so the two trees don't collide:

```jsx
const { Accordion } = window.RSK;
ReactDOM.createRoot(document.getElementById('ds-root')).render(<Accordion />);
```

Wrap the tree in the provider — most components read theme/i18n from context:

```jsx
<DsPreviewProvider>{children}</DsPreviewProvider>
```

## Tokens

198 CSS custom properties from react-start-kit. Names are
preserved verbatim from upstream. They are declared inside `_ds_bundle.css` (this DS ships one compiled stylesheet rather than separate token files).

- **color** (17): `--tw-border-style`, `--tw-shadow-color`, `--tw-inset-shadow-color`, …
- **spacing** (6): `--tw-space-y-reverse`, `--tw-space-x-reverse`, `--tw-inset-shadow`, …
- **typography** (13): `--tw-font-weight`, `--tw-tracking`, `--font-sans`, …
- **radius** (6): `--radius-sm`, `--radius-md`, `--radius-lg`, …
- **shadow** (7): `--tw-shadow`, `--tw-shadow-alpha`, `--tw-ring-shadow`, …
- **other** (149): `--tw-translate-x`, `--tw-translate-y`, `--tw-translate-z`, …

## Components

### ui
- `Accordion`
- `Alert`
- `Avatar`
- `Badge`
- `Button`
- `Calendar`
- `CalendarMonthGrid`
- `CalendarTimeGrid`
- `Card`
- `Checkbox`
- `CheckboxGroup`
- `Chip`
- `Collapsible`
- `Command`
- `Dialog`
- `Divider`
- `DropdownMenu`
- `FormattedNumber`
- `Input`
- `Layout`
- `Pagination`
- `Popover`
- `Progress`
- `RadioDot`
- `RadioGroup`
- `ScrollArea`
- `ScrollSelector`
- `Select`
- `Skeleton`
- `Switch`
- `Table`
- `Tabs`
- `TimePicker`
- `Toast`
- `ToggleGroup`
- `Tooltip`

### shared
- `ActionPanel`
- `BlankSlate`
- `Breadcrumb`
- `CollapsibleCard`
- `Combobox`
- `CommandPalette`
- `ConfirmDialog`
- `CountTooltip`
- `DateNavigation`
- `ErrorTooltip`
- `FacetedFilter`
- `FieldSection`
- `FileCard`
- `FileIcon`
- `FileUploader`
- `FormSubmitButton`
- `FormSubmitButtons`
- `GridCard`
- `LanguageSwitcher`
- `LinkButton`
- `LoadingButton`
- `MetaCard`
- `PrimeCard`
- `PrimeDialog`
- `PrimeDropdown`
- `PrimeLoader`
- `PrimeTooltip`
- `Stepper`
- `ThemeSwitcher`
- `Toaster`
- `TooltipButton`

### tables
- `AsyncSelectFilter`
- `DataTable`
- `DataTableFacetedFilter`
- `DateFilter`
- `FilterChipList`
- `SelectFilter`
- `TimeFilter`

### calendar
- `CalendarGrid`
- `CalendarPicker`

### forms
- `FormCheckbox`
- `FormCheckboxGroup`
- `FormCombobox`
- `FormContainer`
- `FormControl`
- `FormDatePicker`
- `FormDateRange`
- `FormFileUploader`
- `FormInput`
- `FormLabel`
- `FormMessage`
- `FormMultiCombobox`
- `FormNumber`
- `FormRadioGroup`
- `FormSelect`
- `FormTextarea`
- `FormTimePicker`
