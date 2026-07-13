import type { ColumnDef, FilterFn } from '@tanstack/react-table';

import { Button, Checkbox, DropdownMenu } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { createFilterMeta } from '@utils';

import { Check, FileText, MoreVertical, RotateCcw, ScanSearch, X } from 'lucide-react';

import { ConfidenceCell, StatusBadge, SubjectsCell, Thumbnail, TypeChip } from '../incident-cells';
import type { Incident } from '@app-types';

export type IncidentHandlers = {
  onConfirm: (id: string) => void;
  onDiscard: (id: string) => void;
  onRestore: (id: string) => void;
  onReopen: (id: string) => void;
  onReview: (id: string) => void;
  onProof: (id: string) => void;
};

type TranslateFn = ReturnType<typeof useAppTranslation>['t'];

type Option = { id: string; name: string };

const inSelectedValues: FilterFn<Incident> = (row, columnId, filterValue) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;

  return (filterValue as string[]).includes(String(row.getValue(columnId)));
};

/** An incident matches "identified"/"unidentified" if any of its subjects does. */
const subjectsFilterFn: FilterFn<Incident> = (row, _columnId, filterValue) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;

  const subjects = row.original.subjects;
  const hasIdentified = subjects.some(Boolean);
  const hasUnidentified = subjects.some((subject) => !subject);

  return (filterValue as string[]).some((value) => (value === 'identified' ? hasIdentified : hasUnidentified));
};

const multiSelectMeta = (label: string, options: Option[]) =>
  createFilterMeta({
    variant: 'multiSelect',
    label,
    options,
    getOptionLabel: (option: Option) => option.name,
    getOptionValue: (option: Option) => option.id,
  });

export const buildIncidentColumns = (t: TranslateFn, handlers: IncidentHandlers): ColumnDef<Incident>[] => [
  {
    id: 'select',
    size: 44,
    enableSorting: false,
    enableGlobalFilter: false,
    meta: { disableRowClick: true },
    header: ({ table }) => (
      <Checkbox
        aria-label={t('columns.selectAll')}
        checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox aria-label={t('columns.selectRow')} checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} />
    ),
  },
  {
    id: 'thumb',
    header: '',
    size: 76,
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => <Thumbnail cam={row.original.cam} />,
  },
  {
    accessorKey: 'type',
    header: t('columns.type'),
    size: 210,
    enableGlobalFilter: false,
    filterFn: inSelectedValues,
    cell: ({ row }) => <TypeChip type={row.original.type} />,
    meta: {
      label: t('columns.type'),
      filterMeta: multiSelectMeta(t('columns.type'), [
        { id: 'phone', name: t('type.phone') },
        { id: 'adjacent', name: t('type.adjacent') },
      ]),
    },
  },
  {
    accessorKey: 'id',
    header: t('columns.incident'),
    size: 150,
    enableGlobalFilter: true,
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5 whitespace-normal">
        <span className="text-foreground font-mono text-sm font-medium">{row.original.id}</span>
        <span className="text-muted-400 font-mono text-[11px]">{row.original.time}</span>
      </div>
    ),
  },
  {
    id: 'subjects',
    accessorFn: (incident) => incident.subjects,
    header: t('columns.subjects'),
    size: 240,
    enableSorting: false,
    enableGlobalFilter: false,
    filterFn: subjectsFilterFn,
    cell: ({ row }) => <SubjectsCell subjects={row.original.subjects} />,
    meta: {
      label: t('subjects.filterLabel'),
      filterMeta: multiSelectMeta(t('subjects.filterLabel'), [
        { id: 'identified', name: t('subjects.identified') },
        { id: 'unidentified', name: t('subjects.unidentified') },
      ]),
    },
  },
  {
    accessorKey: 'conf',
    header: t('columns.confidence'),
    size: 110,
    enableSorting: true,
    sortDescFirst: true,
    enableGlobalFilter: false,
    cell: ({ row }) => <ConfidenceCell conf={row.original.conf} />,
  },
  {
    accessorKey: 'status',
    header: t('columns.status'),
    size: 150,
    enableGlobalFilter: false,
    filterFn: inSelectedValues,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    meta: {
      label: t('columns.status'),
      filterMeta: multiSelectMeta(t('columns.status'), [
        { id: 'open', name: t('status.open') },
        { id: 'confirmed', name: t('status.confirmed') },
        { id: 'discarded', name: t('status.discarded') },
      ]),
    },
  },
  {
    id: 'actions',
    header: '',
    size: 56,
    enableSorting: false,
    enableGlobalFilter: false,
    meta: { disableRowClick: true },
    cell: ({ row }) => {
      const incident = row.original;

      return (
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('columns.rowActions')}>
                <MoreVertical size={16} />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content align="end">
              <Conditional.If condition={incident.status === 'open'}>
                <DropdownMenu.Item onSelect={() => handlers.onConfirm(incident.id)}>
                  <Check size={14} />
                  {t('actions.confirm')}
                </DropdownMenu.Item>

                <DropdownMenu.Item onSelect={() => handlers.onDiscard(incident.id)}>
                  <X size={14} />
                  {t('actions.discard')}
                </DropdownMenu.Item>
              </Conditional.If>

              <Conditional.If condition={incident.status === 'confirmed'}>
                <DropdownMenu.Item onSelect={() => handlers.onReopen(incident.id)}>
                  <RotateCcw size={14} />
                  {t('actions.reopen')}
                </DropdownMenu.Item>

                <DropdownMenu.Item onSelect={() => handlers.onDiscard(incident.id)}>
                  <X size={14} />
                  {t('actions.discard')}
                </DropdownMenu.Item>
              </Conditional.If>

              <Conditional.If condition={incident.status === 'discarded'}>
                <DropdownMenu.Item onSelect={() => handlers.onRestore(incident.id)}>
                  <RotateCcw size={14} />
                  {t('actions.restore')}
                </DropdownMenu.Item>
              </Conditional.If>

              <DropdownMenu.Separator />

              <DropdownMenu.Item onSelect={() => handlers.onReview(incident.id)}>
                <ScanSearch size={14} />
                {t('actions.review')}
              </DropdownMenu.Item>

              <DropdownMenu.Item onSelect={() => handlers.onProof(incident.id)}>
                <FileText size={14} />
                {t('actions.exportProof')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      );
    },
  },
];
