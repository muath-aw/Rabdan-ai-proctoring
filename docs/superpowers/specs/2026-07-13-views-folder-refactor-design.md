# Views Folder Refactor — Design

**Date:** 2026-07-13
**Branch:** `feat/exam-integrity-screens`
**Status:** Approved for planning

## Problem

Feature-specific view components are placed under an undocumented `src/pages/<feature>/components/`
convention. The forge/RSK standard defines exactly two homes for feature UI:

- `src/pages/` — route-level components; logic lives here.
- `src/views/<feature>/` — reusable feature components, each in its own kebab-case folder with a
  barrel `index.ts` (README pillar: *"Views → `src/views/<feature>/` → Reusable across 2+ pages"*;
  README:242 *"Each component lives in its own folder with a barrel `index.ts` export"*).

The `@views/*` alias is already wired in **both** `tsconfig.app.json:38` and `vite.config.ts:51`,
but **`src/views/` does not exist** — the scaffolding is present with no content. Two feature areas
sit out of standard:

- `src/pages/exams/components/` — `ExamHeader`, `ExportDialog`, `IncidentCells`,
  `IncidentDetailDialog`, `incident-columns`
- `src/pages/settings/components/` — `CameraFormDialog`, `CamerasSection`, `LocationFormDialog`,
  `LocationsSection`

## Goal

Move all feature-specific view components into `src/views/<feature>/` following the forge folder
structure exactly, with correct layering (pages → views → types, never backwards). While relocating,
bring each moved component into compliance with the project component standard, and migrate all raw
`Dialog` usages to `PrimeDialog`. Prove the result is safe with build, lint, a standards review, and
by driving the affected dialog flows in the running app.

## Non-Goals (YAGNI)

- No renaming `incident-columns.tsx` to PascalCase — it is a column-factory module
  (`buildIncidentColumns`), not a component.
- No splitting of `data.ts` into smaller modules.
- No unrelated refactoring of pages, routes, or unaffected files.
- **Deferred (tracked follow-up):** decomposing `CamerasSection` (280 lines) and `LocationsSection`
  (288 lines) to satisfy the standard's ~150-line JSX rule. Every *other* standard applies to them
  now; the structural split is a separate task.
- No functional/behavioral change to non-dialog components beyond what standards conformance
  requires. Dialog behavior *does* change (see Dialog Migration).

## Decisions (resolved during brainstorming)

1. **Scope:** Move *all* current `pages/<feature>/components/` files into `src/views/`, even though
   each is currently imported by only one page file. They are substantial, structured feature
   components, not inline JSX.
2. **Shared exam types:** Move the domain types to the global `src/types/` layer (`@app-types`),
   matching the existing root-level convention (`Form.ts`, `DataTable.ts`). Keep `data.ts` (mock
   seed data + helpers) co-located in `src/views/exams/`.
3. **Verification depth:** Run `yarn build` (tsc) + `yarn lint`, then `forge:review-code` on the
   moved files, then drive the affected dialog flows in the running app.
4. **Component standard:** Every moved component conforms to the project component standard (the
   `forge:create-component` rules + the 12-category / quality checklist). See "Component Standard
   Conformance" below.
5. **Dialogs:** All four raw-`Dialog` dialogs adopt `PrimeDialog` fully and idiomatically
   (`.Actions` auto-buttons, `dialogMode`-driven titles, `closeOnSuccess`, `dismissible`). See
   "Dialog Migration to PrimeDialog" below.

## Layering Constraint (the key correctness risk)

Exam view components currently import `../types` and `../data` from the **page** folder. Moving the
components to `views/` without moving those modules would make `views/` import upward from `pages/`
— a backwards layering violation. Resolution:

- `src/pages/exams/types.ts` → `src/types/Exam.ts` (consumed via `@app-types`).
- `src/pages/exams/data.ts` → `src/views/exams/data.ts` (consumed via `@views/exams`), with its own
  type import rewritten from `./types` to `@app-types`.

Settings has no such risk: the form dialogs depend only on `Settings.schemas.ts` and each other, and
the forge spec places `<Feature>.schemas.ts` inside `views/<feature>/`.

## Target Structure

```
src/types/
├── Exam.ts                     ← from pages/exams/types.ts
│                                 (ViolationType, IncidentStatus, Incident, WorkspaceMode, ExamSummary)
└── index.ts                    ← add: export * from './Exam'

src/views/
├── exams/
│   ├── exam-header/            ExamHeader.tsx + index.ts
│   ├── export-dialog/          ExportDialog.tsx + index.ts
│   ├── incident-cells/         IncidentCells.tsx + index.ts   (StatusBadge, CameraStill, SubjectsCell,
│   │                                                            ConfidenceCell, Thumbnail, TypeChip)
│   ├── incident-detail-dialog/ IncidentDetailDialog.tsx + index.ts
│   ├── incident-columns/       incident-columns.tsx + index.ts (buildIncidentColumns, IncidentHandlers)
│   ├── data.ts                 ← from pages/exams/data.ts (types now from @app-types)
│   └── index.ts                feature barrel — re-exports all views + data
└── settings/
    ├── camera-form-dialog/     CameraFormDialog.tsx + index.ts
    ├── cameras-section/        CamerasSection.tsx + index.ts
    ├── location-form-dialog/   LocationFormDialog.tsx + index.ts
    ├── locations-section/      LocationsSection.tsx + index.ts
    ├── Settings.schemas.ts     ← from pages/settings/Settings.schemas.ts
    └── index.ts                feature barrel
```

After the move, `src/pages/exams/components/` and `src/pages/settings/components/` are deleted.

## Import Rewrites

| Location | Before | After |
|---|---|---|
| Exam view → sibling cells | `'./IncidentCells'` | `'../incident-cells'` |
| Exam view → types | `'../types'` | `'@app-types'` |
| Exam view → data | `'../data'` | `'../data'` (same-feature sibling relative import) |
| `views/exams/data.ts` → types | `'./types'` | `'@app-types'` |
| Settings form dialogs → schemas | `'../Settings.schemas'` | `'../Settings.schemas'` |
| Settings section → form dialog | `'./CameraFormDialog'` | `'../camera-form-dialog'` |
| `ExamWorkspacePage` → components | `'./components/ExamHeader'` etc. | `'@views/exams'` |
| `ExamWorkspacePage` → data/types | `'./data'`, `'./types'` | `'@views/exams'`, `'@app-types'` |
| `ExamListPage` → data/types | `'./data'`, `'./types'` | `'@views/exams'`, `'@app-types'` |
| `SettingsPage` → components | `'./components/CamerasSection'` etc. | `'@views/settings'` |

Import ordering within touched files follows the project's grouping standard (`@components` →
`@views` → `@contexts`/`@hooks` → `@constants` → `@app-types`), enforced by `forge:review-code`.

## Barrel Conventions

- Each view folder's `index.ts` re-exports its component. Default-exported components
  (`ExamHeader`, `ExportDialog`, `IncidentDetailDialog`, section/dialog components) are re-exported
  as named exports so the feature barrel exposes a flat named surface (matching the README example
  `import { TaskCategoryView } from '@views/tasks'`).
- `incident-cells/index.ts` re-exports the named cell components.
- `incident-columns/index.ts` re-exports `buildIncidentColumns` and the `IncidentHandlers` type.
- Feature barrel `src/views/exams/index.ts` re-exports every view folder plus `data.ts`.
- Feature barrel `src/views/settings/index.ts` re-exports every view folder. `Settings.schemas.ts`
  is imported directly by sibling views via relative path and is NOT surfaced on the barrel (no
  external consumer needs it).

## Component Standard Conformance

Every moved component is brought into compliance with the project standard (`forge:create-component`
rules + the quality checklist + README "Enforced Patterns") as it lands in `views/`:

- **Structure:** kebab-case folder, PascalCase component file, barrel `index.ts` (default → named
  re-export). Folders and barrels as in the Target Structure above.
- **Imports:** path aliases only (no cross-boundary `../../`); grouped and ordered
  (React → third-party → `@components/*` → `@views` → `@hooks`/`@contexts` → `@utils` →
  `@constants` → icons → `@app-types`), groups separated by blank lines; `import type` for
  type-only imports.
- **Conditional rendering:** `Conditional.If` only — no `&&` or ternary rendering in JSX (existing
  code already uses `Conditional`; keep and complete it).
- **Styling:** semantic theme tokens only (no hardcoded colors), `cn()` for conditional classes,
  Tailwind scale values (no arbitrary `p-[24px]`).
- **Sub-component signatures:** accept `className?`, merge via `cn('defaults', className)`, spread
  `...props`, add `data-slot="..."`, use semantic HTML.
- **Variants:** CVA when a component has 3+ visual variants; `cn()` conditionals for 1–2.
- **Hook ordering & handlers:** enforced hook order; `handle*` prefix for event handlers.
- **Size:** ≤ ~150 lines JSX per component — satisfied by all moved components **except**
  `CamerasSection`/`LocationsSection`, whose decomposition is the deferred follow-up above.

The pre-existing pieces already follow most of this; conformance is a completion pass, not a
rewrite, verified by `forge:review-code`.

## Dialog Migration to PrimeDialog

Four dialogs currently use the raw `Dialog` compound from `@components/ui` and migrate to
`PrimeDialog` from `@components/shared`. (The two Sections already use the shared `ConfirmDialog` and
need no dialog change.)

| Dialog | Feature | Kind |
|---|---|---|
| `ExportDialog` | exams | display |
| `IncidentDetailDialog` | exams | display |
| `CameraFormDialog` | settings | form (create/update mutation) |
| `LocationFormDialog` | settings | form (create/update mutation) |

**Element mapping:** `<Dialog>`→`<PrimeDialog>`, `Dialog.Panel`→`PrimeDialog.Panel`,
`Dialog.Header`→`PrimeDialog.Header`, `Dialog.Title`→`PrimeDialog.Title`,
`Dialog.Description`→`PrimeDialog.Description`, `Dialog.Content`→`PrimeDialog.Content`,
`Dialog.Footer`→`PrimeDialog.Actions`.

**Behavioral adoption (idiomatic):**
- `PrimeDialog` owns internal open state and **inverts** `onOpenChange` (`onOpenChange?.(!open)`).
  Rewire each caller's `open`/`onClose` accordingly; drop any now-redundant local open state.
- `PrimeDialog.Panel` renders its own `X` close button and is non-dismissible by default — remove
  duplicate close buttons; set `dismissible` explicitly where outside-click/Esc dismissal is wanted
  (display dialogs: dismissible; form dialogs: non-dismissible to avoid losing input).
- Form dialogs use `PrimeDialog.Actions` with `dialogMode` (`'Create'`/`'Update'`) and `isLoading`
  wired to the mutation's pending state, replacing the hand-rolled `LoadingButton` footer; `submit`
  stays inside the RHF `FormContainer`. Use `closeOnSuccess` to close on mutation success.
- Titles: prefer `dialogMode`-driven titles; keep an explicit label via `PrimeDialog.Title` children
  where the current copy is richer than "Add/Edit".
- Mirror the existing working usage in `src/pages/components/components.data.demos.tsx`.

**Risk:** the form dialogs' submit/close/loading paths change. This is the highest-risk part and is
why verification includes driving each dialog flow (open → submit success → close, and cancel/Esc)
in the running app, not just build/lint.

## Execution & Verification

1. Move files + rewrite imports following the forge folder-structure standard
   (`forge:refactor-to-standards` conventions).
2. Apply Component Standard Conformance to every moved component.
3. Migrate the four dialogs to `PrimeDialog` per Dialog Migration.
4. `yarn build` — tsc must pass (proves every import resolves and no type broke).
5. `yarn lint` — ESLint must pass (import ordering / barrel / rendering rules).
6. `forge:review-code` on the moved files — audit imports, barrels, RTL, dark-mode, a11y against
   the 12-category standard.
7. Drive the affected dialog flows in the running app (`/verify` / `yarn dev`): each dialog
   open → primary action (export / status change / create / update) → close on success, plus
   cancel and Esc behavior. This is mandatory because dialog behavior changed.

**Definition of done:** steps 4–7 pass with output/observations shown; no `pages/*/components/`
directories remain; no `views/` file imports from `pages/`; no raw `Dialog` remains in the four
migrated dialogs; `forge:review-code` reports no standard violations in the moved files (except the
consciously deferred section size).

## Risk & Rollback

- **Move + import refactor:** low risk; a missed path is caught by `yarn build`.
- **Standards conformance:** low risk; mostly additive (import order, `data-slot`, `className`
  passthrough) — caught by `yarn lint` / `forge:review-code`.
- **PrimeDialog migration (highest risk):** the form dialogs' open/close/submit/loading paths
  change; `PrimeDialog`'s inverted `onOpenChange` and internal open state are easy to wire wrong.
  Mitigated by driving each flow (step 7), not just compiling.
- Rollback is `git restore` / branch reset — the work is isolated to `feat/exam-integrity-screens`.
