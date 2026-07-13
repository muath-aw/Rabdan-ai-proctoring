# Views Folder Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move feature-specific view components out of the non-standard `src/pages/<feature>/components/` into `src/views/<feature>/`, conform them to the project component standard, and migrate their dialogs to `PrimeDialog`.

**Architecture:** A refactor in three movements — (1) make `PrimeDialog` support controlled usage so the four programmatically-opened dialogs can adopt it; (2) relocate exam + settings view components into `src/views/` with forge folder conventions (kebab folders, barrels, `@views/*` / `@app-types` aliases, correct pages→views→types layering); (3) migrate the four dialogs to `PrimeDialog`. Each task ends green on `yarn build` + `yarn lint`; dialog tasks additionally require driving the flow in the running app.

**Tech Stack:** React 18 + TypeScript, Vite (SWC), Tailwind, Radix UI, React Hook Form + Zod, TanStack Table, i18next (en/ar, RTL), `@components/*` / `@views/*` / `@app-types` path aliases.

## Global Constraints

- **No `any` types; no `TODO`/placeholder code; no swallowed errors** (use toast). (`.impeccable.md`, README "No Shortcuts")
- **Conditional rendering:** `Conditional.If` only — never `&&` or ternary in JSX. Use `Conditional.Else`/`fallback` for else-cases.
- **Imports:** path aliases only (no cross-boundary `../../`); `import type` for type-only imports; grouped order React → third-party → `@components/*` → `@views` → `@contexts`/`@hooks` → `@routes` → `@utils`/`@constants` → icons/`react-router` → `@app-types`, groups separated by blank lines.
- **Styling:** semantic theme tokens only (no hardcoded colors), `cn()` for conditional classes, Tailwind scale values (no arbitrary `p-[24px]`).
- **Handlers:** `handle*` prefix. **Hook order:** core → context → utility hooks → queries/mutations → refs → state → memo → callbacks → effects → JSX.
- **Barrels:** kebab-case folder per component with `index.ts`; default-export components re-exported as `export { default as X } from './X'`, multi-named modules as `export * from './X'`.
- **Layering:** `views/` must never import from `pages/`. Pages import views via `@views/*`; shared types via `@app-types`.
- **i18n:** all user-facing text via `t()` in both `en/*.json` and `ar/*.json`. Do **not** introduce hardcoded English strings (this is why dialog titles/buttons stay translated rather than using `PrimeDialog`'s English `dialogMode` text).
- **Commands:** `yarn build` (tsc+vite), `yarn lint` (ESLint 9), `yarn dev` (port 3000).
- **Branch:** work on `feat/exam-integrity-screens`. Commit after each task.

---

## File Structure

**Created:**
- `src/types/Exam.ts` — exam domain types (moved from `pages/exams/types.ts`).
- `src/views/exams/{exam-header,export-dialog,incident-cells,incident-columns,incident-detail-dialog}/` — one kebab folder per view, each with component file + `index.ts`.
- `src/views/exams/data.ts` — exam mock data + helpers (moved from `pages/exams/data.ts`).
- `src/views/exams/index.ts` — feature barrel.
- `src/views/settings/{camera-form-dialog,cameras-section,location-form-dialog,locations-section}/` — one kebab folder per view + `index.ts`.
- `src/views/settings/Settings.schemas.ts` — Zod schemas (moved from `pages/settings/Settings.schemas.ts`).
- `src/views/settings/index.ts` — feature barrel.

**Modified:**
- `src/components/shared/prime-dialog/PrimeDialog.tsx` — controllable `open` + Title cleanup.
- `src/types/index.ts` — export `./Exam`.
- `src/pages/exams/ExamWorkspacePage.tsx`, `src/pages/exams/ExamListPage.tsx` — import from `@views/exams` / `@app-types`.
- `src/pages/settings/SettingsPage.tsx` — import from `@views/settings`.

**Deleted:**
- `src/pages/exams/types.ts`, `src/pages/exams/data.ts`, `src/pages/exams/components/` (whole dir).
- `src/pages/settings/Settings.schemas.ts`, `src/pages/settings/components/` (whole dir).

---

### Task 1: Make PrimeDialog controllable + Title cleanup

`PrimeDialog` currently seeds `internalOpen` from `open` once (`useState(open ?? false)`) with no sync, and fires `onOpenChange` inverted — so a controlled parent can't reopen it. The four target dialogs are all controlled/programmatic, so fix this first. Also stop `Title` emitting a leading space when no `dialogMode` is set.

**Files:**
- Modify: `src/components/shared/prime-dialog/PrimeDialog.tsx`

**Interfaces:**
- Produces: `PrimeDialog` now behaves as a controlled component — passing `open` + `onOpenChange` reflects external state changes both directions; `PrimeDialog.Title` renders only its children when no mode is set. Public prop shape is unchanged (`open`, `onOpenChange`, `closeOnSuccess`, `dialogMode`, `.Panel dismissible`, `.Actions primaryButtonProps/secondaryButtonProps/isLoading`).

- [ ] **Step 1: Replace the `PrimeDialog` root component** (lines 154–174) with a controllable version:

```tsx
const PrimeDialog: PrimeDialogComponent = ({ open, closeOnSuccess, dialogMode, onOpenChange, children, ...props }) => {
  const [internalOpen, setInternalOpen] = useState(open ?? false);

  const handleOpenChange = (nextOpen: boolean) => {
    setInternalOpen(nextOpen);

    onOpenChange?.(nextOpen);
  };

  // Controlled usage: mirror the `open` prop into internal state when it changes.
  useEffect(() => {
    if (open !== undefined) setInternalOpen(open);
  }, [open]);

  useEffect(() => {
    if (closeOnSuccess) {
      setInternalOpen(false);

      onOpenChange?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeOnSuccess]);

  return (
    <PrimeDialogContext.Provider value={{ open: internalOpen, onOpenChange: handleOpenChange, dialogMode, ...props }}>
      <Dialog open={internalOpen} onOpenChange={handleOpenChange} {...props}>
        {children}
      </Dialog>
    </PrimeDialogContext.Provider>
  );
};
```

- [ ] **Step 2: Update the `Title` sub-component** (lines 98–106) so an empty mode renders no prefix/space:

```tsx
const Title: FC<TitleProps> = ({ className, children, dialogMode, ...props }) => {
  const context = useContext(PrimeDialogContext);

  const prefix = dialogMode ?? getDialogModeText(context.dialogMode);

  return (
    <Dialog.Title className={cn(className)} {...props}>
      <Conditional.If condition={!!prefix}>{prefix} </Conditional.If>
      {children}
    </Dialog.Title>
  );
};
```

(`Conditional` is already imported at line 4. `useEffect` is already imported at line 1.)

- [ ] **Step 3: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both pass, no errors referencing `prime-dialog`.

- [ ] **Step 4: Drive the existing PrimeDialog demo to confirm no regression**

Run: `yarn dev`, open `http://localhost:3000`, navigate to the components gallery → PrimeDialog demo (`PrimeDialogDemo`).
Verify: each demo dialog (Create/Update/View/dismissible) opens via its trigger, closes via the `X` / Cancel, and the dismissible one closes on outside-click while the others do not. Titles show no stray leading space.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/prime-dialog/PrimeDialog.tsx
git commit -m "fix(prime-dialog): support controlled open and clean empty title prefix"
```

---

### Task 2: Move exam domain types to `src/types/Exam.ts`

Relocate the exam view-model types to the global types layer so `views/` never imports upward from `pages/`. Update every current importer to `@app-types` **before** the files move (keeps the tree green).

**Files:**
- Create: `src/types/Exam.ts`
- Modify: `src/types/index.ts`
- Modify: `src/pages/exams/data.ts`, `src/pages/exams/components/ExamHeader.tsx`, `src/pages/exams/components/IncidentCells.tsx`, `src/pages/exams/components/incident-columns.tsx`, `src/pages/exams/components/ExportDialog.tsx`, `src/pages/exams/components/IncidentDetailDialog.tsx`, `src/pages/exams/ExamWorkspacePage.tsx`, `src/pages/exams/ExamListPage.tsx`
- Delete: `src/pages/exams/types.ts`

**Interfaces:**
- Produces: `@app-types` now exports `ViolationType`, `IncidentStatus`, `Incident`, `WorkspaceMode`, `ExamSummary` (in addition to existing exports). All exam type-only imports resolve via `import type { … } from '@app-types'`.

- [ ] **Step 1: Create `src/types/Exam.ts`** with the exact contents of the current `src/pages/exams/types.ts`:

```ts
export type ViolationType = 'phone' | 'adjacent';

export type IncidentStatus = 'open' | 'confirmed' | 'discarded';

/**
 * Subjects: 1 entry for phone incidents, 2 for adjacent-students incidents.
 * `null` means the subject could not be identified.
 */
export type Incident = {
  id: string;
  type: ViolationType;
  time: string;
  cam: string;
  subjects: (string | null)[];
  conf: number | null;
  status: IncidentStatus;
};

export type WorkspaceMode = 'active' | 'past';

export type ExamSummary = {
  id: string;
  letter: string;
  title: string;
  room: string;
  when: string;
  live?: boolean;
  total: number;
  open: number;
  /** Sort key: start time (active) or date (past). */
  ts: number;
};
```

- [ ] **Step 2: Register the new module** in `src/types/index.ts` — add after the existing lines:

```ts
export * from './Exam';
```

- [ ] **Step 3: Repoint every exam type import to `@app-types`.** Change these type-only imports (leave `./data` / `../data` value imports untouched for now):

- `src/pages/exams/data.ts:1` → `import type { ExamSummary, Incident } from '@app-types';`
- `src/pages/exams/components/ExamHeader.tsx:9` → `import type { WorkspaceMode } from '@app-types';`
- `src/pages/exams/components/IncidentCells.tsx:11` → `import type { IncidentStatus, ViolationType } from '@app-types';`
- `src/pages/exams/components/incident-columns.tsx:13` → `import type { Incident } from '@app-types';`
- `src/pages/exams/components/ExportDialog.tsx:9` → `import type { Incident } from '@app-types';`
- `src/pages/exams/components/IncidentDetailDialog.tsx:14` → `import type { Incident } from '@app-types';`
- `src/pages/exams/ExamWorkspacePage.tsx:30` → `import type { Incident, IncidentStatus, WorkspaceMode } from '@app-types';`
- `src/pages/exams/ExamListPage.tsx:17` → `import type { ExamSummary } from '@app-types';`

- [ ] **Step 4: Delete the old types file**

```bash
git rm src/pages/exams/types.ts
```

- [ ] **Step 5: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both pass. If tsc reports an unresolved `'./types'` or `'../types'`, a Step 3 edit was missed — fix it.

- [ ] **Step 6: Commit**

```bash
git add src/types/Exam.ts src/types/index.ts src/pages/exams
git commit -m "refactor(types): move exam domain types to src/types/Exam.ts"
```

---

### Task 3: Move exam view components into `src/views/exams/`

Relocate all five exam view files plus `data.ts` into `src/views/exams/` with kebab folders and barrels, fix intra-feature relative imports, and repoint the exam pages to `@views/exams`. Dialogs move here but keep using raw `Dialog` for now (migrated in Tasks 4–5).

**Files:**
- Create dirs + move: `ExamHeader.tsx`→`src/views/exams/exam-header/`, `ExportDialog.tsx`→`export-dialog/`, `IncidentCells.tsx`→`incident-cells/`, `incident-columns.tsx`→`incident-columns/`, `IncidentDetailDialog.tsx`→`incident-detail-dialog/`; `data.ts`→`src/views/exams/data.ts`
- Create: barrels `index.ts` in each folder + `src/views/exams/index.ts`
- Modify: `src/pages/exams/ExamWorkspacePage.tsx`, `src/pages/exams/ExamListPage.tsx`
- Delete: `src/pages/exams/components/` (empty after moves), `src/pages/exams/data.ts`

**Interfaces:**
- Consumes: `@app-types` exam types (Task 2).
- Produces: `@views/exams` barrel exporting `ExamHeader`, `ExportDialog`, `IncidentDetailDialog` (default→named), all `IncidentCells` named exports (`StatusBadge`, `CameraStill`, `SubjectsCell`, `ConfidenceCell`, `Thumbnail`, `TypeChip`, `STATUS_BADGE_VARIANT`), `incident-columns` exports (`buildIncidentColumns`, `type IncidentHandlers`), and `data.ts` exports (`EXAM_META`, `seedIncidents`, `ACTIVE_EXAMS`, `PAST_EXAMS`, `formatConfidence`, `LOW_CONFIDENCE_THRESHOLD`).

- [ ] **Step 1: Create folders and move files (preserving git history)**

```bash
cd src/pages/exams
mkdir -p ../../views/exams/exam-header ../../views/exams/export-dialog ../../views/exams/incident-cells ../../views/exams/incident-columns ../../views/exams/incident-detail-dialog
git mv components/ExamHeader.tsx ../../views/exams/exam-header/ExamHeader.tsx
git mv components/ExportDialog.tsx ../../views/exams/export-dialog/ExportDialog.tsx
git mv components/IncidentCells.tsx ../../views/exams/incident-cells/IncidentCells.tsx
git mv components/incident-columns.tsx ../../views/exams/incident-columns/incident-columns.tsx
git mv components/IncidentDetailDialog.tsx ../../views/exams/incident-detail-dialog/IncidentDetailDialog.tsx
git mv data.ts ../../views/exams/data.ts
cd ../../..
```

- [ ] **Step 2: Fix intra-feature relative imports** in the moved files (each view is now one folder deeper; `data.ts` sits at the feature root):

- `src/views/exams/exam-header/ExamHeader.tsx` — line 8: `import { EXAM_META } from '../data';`
- `src/views/exams/incident-cells/IncidentCells.tsx` — line 10: `import { formatConfidence, LOW_CONFIDENCE_THRESHOLD } from '../data';`
- `src/views/exams/incident-columns/incident-columns.tsx` — line 12: `import { ConfidenceCell, StatusBadge, SubjectsCell, Thumbnail, TypeChip } from '../incident-cells';`
- `src/views/exams/export-dialog/ExportDialog.tsx` — line 8: `import { StatusBadge } from '../incident-cells';`
- `src/views/exams/incident-detail-dialog/IncidentDetailDialog.tsx` — line 12: `import { CameraStill, StatusBadge, SubjectsCell } from '../incident-cells';` and line 13: `import { formatConfidence, LOW_CONFIDENCE_THRESHOLD } from '../data';`

(`data.ts`'s own type import is already `@app-types` from Task 2 — no change.)

- [ ] **Step 3: Create the per-folder barrels**

`src/views/exams/exam-header/index.ts`:
```ts
export { default as ExamHeader } from './ExamHeader';
```
`src/views/exams/export-dialog/index.ts`:
```ts
export { default as ExportDialog } from './ExportDialog';
```
`src/views/exams/incident-detail-dialog/index.ts`:
```ts
export { default as IncidentDetailDialog } from './IncidentDetailDialog';
```
`src/views/exams/incident-cells/index.ts`:
```ts
export * from './IncidentCells';
```
`src/views/exams/incident-columns/index.ts`:
```ts
export * from './incident-columns';
```

- [ ] **Step 4: Create the feature barrel** `src/views/exams/index.ts`:

```ts
export * from './exam-header';
export * from './export-dialog';
export * from './incident-cells';
export * from './incident-columns';
export * from './incident-detail-dialog';
export * from './data';
```

- [ ] **Step 5: Repoint `ExamWorkspacePage.tsx` imports.** After Task 2 the file already imports its exam types from `@app-types` (do **not** add a second `@app-types` line). Remove the four `./components/*` imports and the `./data` import (the block that was lines 25–29), and add a single `@views/exams` barrel import grouped right after the `@components/utils` import:

```tsx
import { buildIncidentColumns, EXAM_META, ExamHeader, ExportDialog, IncidentDetailDialog, seedIncidents, type IncidentHandlers } from '@views/exams';
```
Leave the existing `import type { Incident, IncidentStatus, WorkspaceMode } from '@app-types';` in place as the final import group.

- [ ] **Step 6: Repoint `ExamListPage.tsx` imports.** After Task 2 the file already imports `ExamSummary` from `@app-types` (do **not** add another). Replace only the `./data` value import (was line 16):

```tsx
import { ACTIVE_EXAMS, PAST_EXAMS } from '@views/exams';
```
Leave the existing `import type { ExamSummary } from '@app-types';` as the final import group.

- [ ] **Step 7: Remove the now-empty components dir**

```bash
rmdir src/pages/exams/components 2>/dev/null || true
```

- [ ] **Step 8: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both pass. tsc resolves all `@views/exams` and `@app-types` imports; ESLint import-order clean.

- [ ] **Step 9: Commit**

```bash
git add src/views/exams src/pages/exams
git commit -m "refactor(exams): move view components to src/views/exams"
```

---

### Task 4: Migrate `ExportDialog` to PrimeDialog

Convert the exams export dialog from raw `Dialog` to controllable `PrimeDialog`. Display dialog → dismissible; bespoke footer (count + cancel + export) passed as `PrimeDialog.Actions` children.

**Files:**
- Modify: `src/views/exams/export-dialog/ExportDialog.tsx`

**Interfaces:**
- Consumes: `PrimeDialog` (Task 1), `StatusBadge` from `../incident-cells`, `Incident` from `@app-types`.
- Produces: unchanged `ExportDialogProps` (`open`, `items`, `subtitle`, `onClose`, `onExport`) — the consumer (`ExamWorkspacePage`) needs no change.

- [ ] **Step 1: Replace the file** with the PrimeDialog version:

```tsx
import { Button, Table } from '@components/ui';
import { PrimeDialog } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

import { Download, HelpCircle } from 'lucide-react';

import { StatusBadge } from '../incident-cells';

import type { Incident } from '@app-types';

type ExportDialogProps = {
  open: boolean;
  items: Incident[];
  subtitle: string;
  onClose: () => void;
  onExport: () => void;
};

function ExportDialog({ open, items, subtitle, onClose, onExport }: ExportDialogProps) {
  const { t } = useAppTranslation('exams');

  const subjectsText = (subjects: (string | null)[]) => subjects.map((subject) => subject ?? t('subjects.unidentified')).join('  ·  ');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  return (
    <PrimeDialog open={open} onOpenChange={handleOpenChange}>
      <PrimeDialog.Panel dismissible className="md:max-w-2xl">
        <PrimeDialog.Header>
          <PrimeDialog.Title>{t('export.title')}</PrimeDialog.Title>
          <PrimeDialog.Description className="mt-1">{subtitle}</PrimeDialog.Description>
        </PrimeDialog.Header>

        <PrimeDialog.Content className="max-h-[62vh] overflow-y-auto">
          <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs">
            <HelpCircle size={14} />
            {t('export.statusesNote')}
          </div>

          <div className="border-border overflow-hidden rounded-xl border">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>{t('export.colType')}</Table.Head>
                  <Table.Head>{t('export.colTime')}</Table.Head>
                  <Table.Head>{t('export.colSubjects')}</Table.Head>
                  <Table.Head>{t('export.colStatus')}</Table.Head>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {items.map((incident) => (
                  <Table.Row key={incident.id}>
                    <Table.Cell>{t(`type.${incident.type}`)}</Table.Cell>
                    <Table.Cell className="font-mono">{incident.time}</Table.Cell>
                    <Table.Cell>{subjectsText(incident.subjects)}</Table.Cell>
                    <Table.Cell>
                      <StatusBadge status={incident.status} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </PrimeDialog.Content>

        <PrimeDialog.Actions className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{t('export.footerCount', { count: items.length })}</span>

          <div className="flex gap-2">
            <Button variant="outline-muted" onClick={onClose}>
              {t('export.cancel')}
            </Button>

            <Button variant="default" onClick={onExport}>
              <Download size={15} />
              {t('export.exportTable')}
            </Button>
          </div>
        </PrimeDialog.Actions>
      </PrimeDialog.Panel>
    </PrimeDialog>
  );
}

export default ExportDialog;
```

Notes: the old `<Conditional.If condition={open}>` wrapper is dropped — Radix only renders panel content while open, and `PrimeDialog` now tracks `open`. `Dialog.Footer` → `PrimeDialog.Actions` with children (the bespoke footer renders in place of auto-buttons). `PrimeDialog.Panel` provides its own `X` close button, so none is added.

- [ ] **Step 2: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both pass.

- [ ] **Step 3: Drive the export flow**

Run: `yarn dev` → open an active exam workspace → click the Export control.
Verify: dialog opens showing the incident table; footer count matches row count; "Export" fires `onExport` (toast/download as before); Cancel and the `X` close it; clicking outside / Esc closes it (dismissible); reopening works (controlled-open regression check).

- [ ] **Step 4: Commit**

```bash
git add src/views/exams/export-dialog/ExportDialog.tsx
git commit -m "refactor(exams): migrate ExportDialog to PrimeDialog"
```

---

### Task 5: Migrate `IncidentDetailDialog` to PrimeDialog

Convert the incident detail dialog (opened by a table-row click; `incident` may be `null`). Display dialog → dismissible; status-dependent action buttons passed as `PrimeDialog.Actions` children.

**Files:**
- Modify: `src/views/exams/incident-detail-dialog/IncidentDetailDialog.tsx`

**Interfaces:**
- Consumes: `PrimeDialog` (Task 1); `CameraStill`, `StatusBadge`, `SubjectsCell` from `../incident-cells`; `formatConfidence`, `LOW_CONFIDENCE_THRESHOLD` from `../data`; `Incident` from `@app-types`.
- Produces: unchanged `IncidentDetailDialogProps` (`incident`, `onClose`, `onConfirm`, `onDiscard`, `onRestore`, `onProof`).

- [ ] **Step 1: Replace the file** with the PrimeDialog version (open bound to `!!incident`; panel gated by `Conditional.If`):

```tsx
import type { ReactNode } from 'react';

import { Button } from '@components/ui';
import { Conditional } from '@components/utils';
import { PrimeDialog } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { Check, FileText, RotateCcw } from 'lucide-react';

import { CameraStill, StatusBadge, SubjectsCell } from '../incident-cells';
import { formatConfidence, LOW_CONFIDENCE_THRESHOLD } from '../data';

import type { Incident } from '@app-types';

type IncidentDetailDialogProps = {
  incident: Incident | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  onDiscard: (id: string) => void;
  onRestore: (id: string) => void;
  onProof: (id: string) => void;
};

type IncidentDetailPanelProps = Omit<IncidentDetailDialogProps, 'incident' | 'onClose'> & {
  incident: Incident;
};

function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-muted-400 text-xs font-semibold tracking-wider uppercase', className)}>{children}</div>;
}

function MetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <SectionLabel className="mb-1">{label}</SectionLabel>
      <div className={cn('text-foreground text-sm', mono && 'font-mono')}>{value}</div>
    </div>
  );
}

function IncidentDetailPanel({ incident, onConfirm, onDiscard, onRestore, onProof }: IncidentDetailPanelProps) {
  const { t } = useAppTranslation('exams');

  const isLow = incident.conf != null && incident.conf < LOW_CONFIDENCE_THRESHOLD;
  const isPair = incident.subjects.length > 1;

  const handleConfirm = () => onConfirm(incident.id);
  const handleDiscard = () => onDiscard(incident.id);
  const handleRestore = () => onRestore(incident.id);
  const handleProof = () => onProof(incident.id);

  return (
    <PrimeDialog.Panel dismissible className="md:max-w-md">
      <PrimeDialog.Header>
        <div className="flex items-center gap-3">
          <PrimeDialog.Title>{t('detail.title')}</PrimeDialog.Title>
          <span className="text-muted-400 font-mono text-xs">{incident.id}</span>
        </div>

        <PrimeDialog.Description className="mt-1 font-mono">
          {incident.cam}, {incident.time}
        </PrimeDialog.Description>
      </PrimeDialog.Header>

      <PrimeDialog.Content className="max-h-[62vh] overflow-y-auto">
        <CameraStill cam={incident.cam} time={incident.time} type={incident.type} />

        <div className="mt-4 flex items-center justify-between">
          <SectionLabel>{t('detail.statusLabel')}</SectionLabel>
          <StatusBadge status={incident.status} />
        </div>

        <div className="mt-4">
          <SectionLabel className="mb-2">{isPair ? t('detail.subjectsPairLabel') : t('detail.subjectLabel')}</SectionLabel>
          <SubjectsCell subjects={incident.subjects} />
        </div>

        <Conditional.If condition={incident.conf != null}>
          <div className="mt-4">
            <SectionLabel className="mb-2">{t('detail.confidenceLabel')}</SectionLabel>

            <div className="flex items-center gap-3">
              <span className={cn('font-mono text-2xl font-semibold', isLow ? 'text-warning' : 'text-foreground')}>
                {formatConfidence(incident.conf)}
              </span>

              <div className="bg-muted-100 h-1.5 flex-1 overflow-hidden rounded-full">
                <div
                  className={cn('h-full rounded-full', isLow ? 'bg-warning' : 'bg-primary')}
                  style={{ width: `${Math.round((incident.conf ?? 0) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Conditional.If>

        <div className="bg-muted-50 mt-4 grid grid-cols-2 gap-4 rounded-xl p-4">
          <MetaItem label={t('detail.violation')} value={t(`type.${incident.type}`)} />
          <MetaItem label={t('detail.sourceCamera')} value={incident.cam} mono />
          <MetaItem label={t('detail.timestamp')} value={incident.time} mono />
          <MetaItem label={t('detail.incidentId')} value={incident.id} mono />
        </div>
      </PrimeDialog.Content>

      <PrimeDialog.Actions className="flex flex-col gap-2">
        <Conditional.If condition={incident.status === 'open'}>
          <div className="flex w-full gap-2">
            <Button variant="success" className="flex-1" onClick={handleConfirm}>
              <Check size={15} />
              {t('detail.confirm')}
            </Button>

            <Button variant="outline-muted" className="flex-1" onClick={handleDiscard}>
              {t('detail.discard')}
            </Button>
          </div>
        </Conditional.If>

        <Conditional.If condition={incident.status === 'confirmed'}>
          <Button variant="outline-muted" onClick={handleDiscard}>
            {t('detail.discardInstead')}
          </Button>
        </Conditional.If>

        <Conditional.If condition={incident.status === 'discarded'}>
          <Button variant="outline-muted" onClick={handleRestore}>
            <RotateCcw size={14} />
            {t('detail.restore')}
          </Button>
        </Conditional.If>

        <Button variant="outline" onClick={handleProof}>
          <FileText size={15} />
          {t('detail.exportProof')}
        </Button>
      </PrimeDialog.Actions>
    </PrimeDialog.Panel>
  );
}

function IncidentDetailDialog({ incident, onClose, onConfirm, onDiscard, onRestore, onProof }: IncidentDetailDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  return (
    <PrimeDialog open={!!incident} onOpenChange={handleOpenChange}>
      <Conditional.If condition={!!incident}>
        <IncidentDetailPanel
          incident={incident!}
          onConfirm={onConfirm}
          onDiscard={onDiscard}
          onRestore={onRestore}
          onProof={onProof}
        />
      </Conditional.If>
    </PrimeDialog>
  );
}

export default IncidentDetailDialog;
```

Note: the non-null assertion `incident!` is safe because `Conditional.If condition={!!incident}` only renders the panel when `incident` is non-null (unchanged from the original).

- [ ] **Step 2: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both pass.

- [ ] **Step 3: Drive the detail flow**

Run: `yarn dev` → exam workspace → click an incident row.
Verify: detail dialog opens for that incident; Confirm/Discard on an `open` incident updates the status and the visible status badge; Restore appears for a discarded incident; Export proof fires `onProof`; `X` / Esc / outside-click close it; opening a *different* row afterward shows the new incident (controlled-open regression check).

- [ ] **Step 4: Commit**

```bash
git add src/views/exams/incident-detail-dialog/IncidentDetailDialog.tsx
git commit -m "refactor(exams): migrate IncidentDetailDialog to PrimeDialog"
```

---

### Task 6: Move settings view components into `src/views/settings/`

Relocate the four settings view files plus `Settings.schemas.ts` into `src/views/settings/`, fix sibling imports, and repoint `SettingsPage` to `@views/settings`. Form dialogs keep raw `Dialog` for now (migrated in Tasks 7–8).

**Files:**
- Create dirs + move: `CameraFormDialog.tsx`→`camera-form-dialog/`, `CamerasSection.tsx`→`cameras-section/`, `LocationFormDialog.tsx`→`location-form-dialog/`, `LocationsSection.tsx`→`locations-section/`; `Settings.schemas.ts`→`src/views/settings/Settings.schemas.ts`
- Create: per-folder `index.ts` + `src/views/settings/index.ts`
- Modify: `src/pages/settings/SettingsPage.tsx`
- Delete: `src/pages/settings/components/`

**Interfaces:**
- Produces: `@views/settings` barrel exporting `CamerasSection`, `LocationsSection`, `CameraFormDialog`, `LocationFormDialog` (default→named). `Settings.schemas.ts` is **not** on the barrel (only sibling views consume it via relative import).

- [ ] **Step 1: Create folders and move files**

```bash
cd src/pages/settings
mkdir -p ../../views/settings/camera-form-dialog ../../views/settings/cameras-section ../../views/settings/location-form-dialog ../../views/settings/locations-section
git mv components/CameraFormDialog.tsx ../../views/settings/camera-form-dialog/CameraFormDialog.tsx
git mv components/CamerasSection.tsx ../../views/settings/cameras-section/CamerasSection.tsx
git mv components/LocationFormDialog.tsx ../../views/settings/location-form-dialog/LocationFormDialog.tsx
git mv components/LocationsSection.tsx ../../views/settings/locations-section/LocationsSection.tsx
git mv Settings.schemas.ts ../../views/settings/Settings.schemas.ts
cd ../../..
```

- [ ] **Step 2: Fix sibling/schema imports** in the moved files:

- `src/views/settings/cameras-section/CamerasSection.tsx` — line 26: `import CameraFormDialog from '../camera-form-dialog';`
- `src/views/settings/locations-section/LocationsSection.tsx` — line 26: `import LocationFormDialog from '../location-form-dialog';`
- `src/views/settings/camera-form-dialog/CameraFormDialog.tsx` — line 17: `import { buildCameraFormSchema, type CameraFormValues } from '../Settings.schemas';` (path unchanged — schema is one level up from the dialog folder)
- `src/views/settings/location-form-dialog/LocationFormDialog.tsx` — line 17: `import { buildLocationFormSchema, type LocationFormValues } from '../Settings.schemas';` (unchanged)

(The `CamerasSection`/`LocationsSection` imports of `CameraFormDialog`/`LocationFormDialog` change from `'./X'` to `'../x-folder'` because the form dialog now lives in a sibling folder. Import them as **default** — the form dialogs still default-export.)

- [ ] **Step 3: Create per-folder barrels**

`src/views/settings/camera-form-dialog/index.ts`:
```ts
export { default as CameraFormDialog } from './CameraFormDialog';
```
`src/views/settings/cameras-section/index.ts`:
```ts
export { default as CamerasSection } from './CamerasSection';
```
`src/views/settings/location-form-dialog/index.ts`:
```ts
export { default as LocationFormDialog } from './LocationFormDialog';
```
`src/views/settings/locations-section/index.ts`:
```ts
export { default as LocationsSection } from './LocationsSection';
```

- [ ] **Step 4: Create the feature barrel** `src/views/settings/index.ts`:

```ts
export * from './camera-form-dialog';
export * from './cameras-section';
export * from './location-form-dialog';
export * from './locations-section';
```

- [ ] **Step 5: Repoint `SettingsPage.tsx`.** Replace current lines 7–8 with a single barrel import, grouped after `@components/shared` (after line 3):

```tsx
import { CamerasSection, LocationsSection } from '@views/settings';
```

(The `CamerasSection`/`LocationsSection` usages at lines 29 and 32 are unchanged — still named components.)

- [ ] **Step 6: Remove the now-empty components dir**

```bash
rmdir src/pages/settings/components 2>/dev/null || true
```

- [ ] **Step 7: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both pass.

- [ ] **Step 8: Commit**

```bash
git add src/views/settings src/pages/settings
git commit -m "refactor(settings): move view components to src/views/settings"
```

---

### Task 7: Migrate `CameraFormDialog` to PrimeDialog

Convert the camera create/edit form dialog. Form dialog → **non-dismissible** (protect input); use `PrimeDialog.Actions` auto-buttons with translated labels and `isLoading` wired to the mutation pending state. Titles stay translated (no `dialogMode` English text).

**Files:**
- Modify: `src/views/settings/camera-form-dialog/CameraFormDialog.tsx`

**Interfaces:**
- Consumes: `PrimeDialog` (Task 1); `FormContainer`, `FormInput`, `FormSelect` from `@components/forms`; mutations from `@hooks/mutations`; `buildCameraFormSchema`/`CameraFormValues` from `../Settings.schemas`; DTOs from `@app-types`.
- Produces: unchanged `CameraFormDialogProps` (`open`, `camera`, `locations`, `onClose`).

- [ ] **Step 1: Replace the render block** (lines 84–136 of the moved file) with the PrimeDialog structure. The imports change: drop `Button` and `Dialog` from `@components/ui` and drop `LoadingButton` from `@components/shared`; add `PrimeDialog` from `@components/shared`. New top imports (lines 5–7 region):

```tsx
import { Conditional } from '@components/utils';
import { PrimeDialog } from '@components/shared';
import { FormContainer, FormInput, FormSelect } from '@components/forms';
```

New return (replaces the old `return ( <Dialog …> … </Dialog> )`):

```tsx
  return (
    <PrimeDialog open={open} onOpenChange={handleOpenChange} isLoading={isPending}>
      <PrimeDialog.Panel>
        <PrimeDialog.Header>
          <PrimeDialog.Title>
            <Conditional>
              <Conditional.If condition={isEdit}>{t('cameras.form.editTitle')}</Conditional.If>
              <Conditional.Else>{t('cameras.form.createTitle')}</Conditional.Else>
            </Conditional>
          </PrimeDialog.Title>
        </PrimeDialog.Header>

        <FormContainer formContext={formContext} onSuccess={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <PrimeDialog.Content className="flex flex-col gap-4">
            <FormInput
              name="name"
              label={t('cameras.form.nameLabel')}
              placeholder={t('cameras.form.namePlaceholder')}
              required
              autoFocus
              disabled={isPending}
            />

            <FormSelect<CameraFormValues, LocationForReadDto>
              name="locationId"
              control={formContext.control}
              label={t('cameras.form.locationLabel')}
              placeholder={t('cameras.form.locationPlaceholder')}
              required
              options={locations}
              noOptionsText={t('cameras.form.noLocations')}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              disabled={isPending || locations.length === 0}
              clearable={false}
            />
          </PrimeDialog.Content>

          <PrimeDialog.Actions
            primaryButtonProps={{
              children: isEdit ? t('cameras.form.submitEdit') : t('cameras.form.submitCreate'),
              disabled: locations.length === 0,
            }}
            secondaryButtonProps={{ children: t('cameras.form.cancel'), disabled: isPending }}
          />
        </FormContainer>
      </PrimeDialog.Panel>
    </PrimeDialog>
  );
```

Notes:
- `handleSubmit`/`handleOpenChange`/mutations/`useEffect` above the return are unchanged. `handleSubmit`'s `onSuccess` already calls `onClose()`, which drives the parent's `open` to `false` and closes the (now controllable) dialog.
- `PrimeDialog.Actions` renders its own submit (`type="submit"`, loading from context `isLoading`) and a `Dialog.Close`-wrapped secondary (`type="reset"`) — clicking the secondary closes via Radix → `handleOpenChange(false)` → `onClose()`. No manual `Button`/`LoadingButton` needed.
- Panel is **not** `dismissible`, so outside-click/Esc won't discard a half-filled form. The panel's built-in `X` still closes it (guard `!isPending` lives in `handleOpenChange`).

- [ ] **Step 2: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both pass. If ESLint flags an unused `Button`/`LoadingButton` import, remove it (Step 1 should have).

- [ ] **Step 3: Drive both camera flows**

Run: `yarn dev` → Settings → Cameras.
Verify (create): "+ Add" opens the dialog titled with the create label; submit with valid input shows the created toast and closes; the pending state disables inputs and shows the submit spinner. (edit): row menu → Edit opens pre-filled with the edit title; save shows updated toast and closes. (validation): duplicate name surfaces the field error and keeps the dialog open. Cancel / `X` close without mutating; outside-click does **not** close. Open → close → reopen works.

- [ ] **Step 4: Commit**

```bash
git add src/views/settings/camera-form-dialog/CameraFormDialog.tsx
git commit -m "refactor(settings): migrate CameraFormDialog to PrimeDialog"
```

---

### Task 8: Migrate `LocationFormDialog` to PrimeDialog

Same pattern as Task 7 for the location create/edit form.

**Files:**
- Modify: `src/views/settings/location-form-dialog/LocationFormDialog.tsx`

**Interfaces:**
- Consumes: `PrimeDialog` (Task 1); `FormContainer`, `FormInput`, `FormTextarea` from `@components/forms`; mutations from `@hooks/mutations`; `buildLocationFormSchema`/`LocationFormValues` from `../Settings.schemas`; `LocationForReadDto` from `@app-types`.
- Produces: unchanged `LocationFormDialogProps` (`open`, `location`, `onClose`).

- [ ] **Step 1: Update imports** (region lines 5–8): drop `Button` and `Dialog` from `@components/ui` and `LoadingButton` from `@components/shared`; add `PrimeDialog`:

```tsx
import { Conditional } from '@components/utils';
import { PrimeDialog } from '@components/shared';
import { FormContainer, FormInput, FormTextarea } from '@components/forms';
```

- [ ] **Step 2: Replace the return block** (lines 94–154) with:

```tsx
  return (
    <PrimeDialog open={open} onOpenChange={handleOpenChange} isLoading={isPending}>
      <PrimeDialog.Panel>
        <PrimeDialog.Header>
          <PrimeDialog.Title>
            <Conditional>
              <Conditional.If condition={isEdit}>{t('locations.form.editTitle')}</Conditional.If>
              <Conditional.Else>{t('locations.form.createTitle')}</Conditional.Else>
            </Conditional>
          </PrimeDialog.Title>
        </PrimeDialog.Header>

        <FormContainer formContext={formContext} onSuccess={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <PrimeDialog.Content className="flex flex-col gap-4">
            <FormInput
              name="name"
              label={t('locations.form.nameLabel')}
              placeholder={t('locations.form.namePlaceholder')}
              required
              autoFocus
              disabled={isPending}
            />

            <FormInput
              name="code"
              label={t('locations.form.codeLabel')}
              placeholder={t('locations.form.codePlaceholder')}
              required
              disabled={isPending}
              className="font-mono"
              aria-describedby="location-code-help"
            />

            <p id="location-code-help" className="text-muted-foreground -mt-2 text-xs">
              {t('locations.form.codeHelp')}
            </p>

            <FormTextarea
              name="description"
              label={t('locations.form.descriptionLabel')}
              placeholder={t('locations.form.descriptionPlaceholder')}
              rows={3}
              disabled={isPending}
            />
          </PrimeDialog.Content>

          <PrimeDialog.Actions
            primaryButtonProps={{ children: isEdit ? t('locations.form.submitEdit') : t('locations.form.submitCreate') }}
            secondaryButtonProps={{ children: t('locations.form.cancel'), disabled: isPending }}
          />
        </FormContainer>
      </PrimeDialog.Panel>
    </PrimeDialog>
  );
```

(All logic above the return — `handleSubmit` with its duplicate-code/name error handling, `handleOpenChange`, mutations, `useEffect` — is unchanged.)

- [ ] **Step 3: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both pass.

- [ ] **Step 4: Drive both location flows**

Run: `yarn dev` → Settings → Locations.
Verify (create): "+ Add" opens with create title; valid submit → created toast + close. (edit): Edit opens pre-filled (code + description) with edit title; save → updated toast + close. (validation): duplicate code → code field error; duplicate name → name field error; dialog stays open. Cancel/`X` close without mutating; outside-click does not close; reopen works.

- [ ] **Step 5: Commit**

```bash
git add src/views/settings/location-form-dialog/LocationFormDialog.tsx
git commit -m "refactor(settings): migrate LocationFormDialog to PrimeDialog"
```

---

### Task 9: Standards audit + final verification

Confirm nothing remains out of standard, run the forge review across the moved files, apply any conformance fixes it surfaces (except the consciously deferred section decomposition), and do a full green-build sign-off.

**Files:**
- Potentially modify: any file under `src/views/exams/`, `src/views/settings/` flagged by the review.

- [ ] **Step 1: Prove the old locations are gone and no upward imports exist**

```bash
test ! -d src/pages/exams/components && test ! -d src/pages/settings/components && echo "components dirs removed"
grep -rn "pages/exams\|pages/settings\|from '\.\./\.\./pages" src/views && echo "FAIL: views imports from pages" || echo "OK: no views->pages imports"
grep -rn "@components/ui'" src/views/exams/export-dialog src/views/exams/incident-detail-dialog src/views/settings/camera-form-dialog src/views/settings/location-form-dialog | grep -w "Dialog" && echo "FAIL: raw Dialog remains" || echo "OK: no raw Dialog in migrated dialogs"
```
Expected: "components dirs removed", "OK: no views->pages imports", "OK: no raw Dialog in migrated dialogs".

- [ ] **Step 2: Run the forge standards review** on the moved trees:

Run: `/forge:review-code` targeting `src/views/exams` and `src/views/settings` (imports ordering, barrels, RTL, dark-mode, a11y, the 12-category standard).
Apply every reported fix **except** decomposing `CamerasSection`/`LocationsSection` (deferred). If the review flags those two only for the ~150-line size rule, note it as the tracked follow-up and move on.

- [ ] **Step 3: Full type-check and lint after any fixes**

Run: `yarn build && yarn lint`
Expected: both pass with zero errors.

- [ ] **Step 4: Full regression drive**

Run: `yarn dev` and exercise once more, end to end: exam list → open a workspace → incident detail (confirm/discard/restore/proof) → export; Settings → create/edit/delete a location and a camera. Confirm no console errors and all dialogs open/close/reopen correctly.

- [ ] **Step 5: Commit any review fixes**

```bash
git add src/views
git commit -m "refactor(views): apply forge standards review fixes"
```

(If Step 2 produced no changes, skip this commit.)

---

## Deferred Follow-up (out of scope, track separately)

Decompose `src/views/settings/cameras-section/CamerasSection.tsx` (280 lines) and `src/views/settings/locations-section/LocationsSection.tsx` (288 lines) into sub-components to satisfy the standard's ~150-line JSX rule. Every other standard already applies to them after Task 6/9.
