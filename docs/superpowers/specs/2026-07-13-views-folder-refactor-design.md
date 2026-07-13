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
structure exactly, with correct layering (pages → views → types, never backwards), and prove the
move is safe with build, lint, and a standards review.

## Non-Goals (YAGNI)

- No logic changes inside any component.
- No renaming `incident-columns.tsx` to PascalCase — it is a column-factory module
  (`buildIncidentColumns`), not a component.
- No splitting of `data.ts` into smaller modules.
- No unrelated refactoring of pages, routes, or unaffected files.

## Decisions (resolved during brainstorming)

1. **Scope:** Move *all* current `pages/<feature>/components/` files into `src/views/`, even though
   each is currently imported by only one page file. They are substantial, structured feature
   components, not inline JSX.
2. **Shared exam types:** Move the domain types to the global `src/types/` layer (`@app-types`),
   matching the existing root-level convention (`Form.ts`, `DataTable.ts`). Keep `data.ts` (mock
   seed data + helpers) co-located in `src/views/exams/`.
3. **Verification depth:** Run `yarn build` (tsc) + `yarn lint`, then `forge:review-code` on the
   moved files.

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

## Execution & Verification

1. Perform the moves and import rewrites following the forge folder-structure standard
   (`forge:refactor-to-standards` conventions).
2. `yarn build` — tsc must pass (proves every import resolves and no type broke).
3. `yarn lint` — ESLint must pass (proves import ordering / barrel rules hold).
4. `forge:review-code` on the moved files — audit imports, barrels, RTL, dark-mode, a11y against
   the 12-category standard.

**Definition of done:** all four steps pass with output shown; no `pages/*/components/` directories
remain; no `views/` file imports from `pages/`.

## Risk & Rollback

- Pure move + import-path refactor; no behavior change. Risk is a missed import path, caught by
  `yarn build`.
- Rollback is `git restore` / branch reset — the work is isolated to file moves on
  `feat/exam-integrity-screens`.
