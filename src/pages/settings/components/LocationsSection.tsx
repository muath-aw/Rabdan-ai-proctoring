import { useCallback, useMemo, useState } from 'react';

import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Alert, Button, DropdownMenu } from '@components/ui';
import { Conditional } from '@components/utils';
import { BlankSlate, ConfirmDialog } from '@components/shared';
import { DataTable } from '@components/tables';

import { useAppTranslation, useToast } from '@hooks/shared';
import { DateFormats, formatDateValue } from '@hooks/shared';
import { useLocationsQuery, useCamerasQuery } from '@hooks/queries';
import { LocationInUseError, useDeleteLocationMutation } from '@hooks/mutations';

import { MapPin, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';

import type { CameraForReadDto, LocationForReadDto } from '@app-types';

import LocationFormDialog from './LocationFormDialog';

type LocationRow = LocationForReadDto & { cameraCount: number };

function LocationsSection() {
  const { t } = useAppTranslation('settings');
  const { toast } = useToast();

  const locationsQuery = useLocationsQuery();
  const camerasQuery = useCamerasQuery();
  const deleteMutation = useDeleteLocationMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationForReadDto | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LocationForReadDto | null>(null);

  const cameraCountByLocation = useMemo(() => {
    const map = new Map<string, number>();
    (camerasQuery.data ?? []).forEach((cam: CameraForReadDto) => {
      map.set(cam.locationId, (map.get(cam.locationId) ?? 0) + 1);
    });
    return map;
  }, [camerasQuery.data]);

  const rows = useMemo<LocationRow[]>(
    () =>
      (locationsQuery.data ?? []).map((location) => ({
        ...location,
        cameraCount: cameraCountByLocation.get(location.id) ?? 0,
      })),
    [locationsQuery.data, cameraCountByLocation],
  );

  const handleOpenCreate = useCallback(() => {
    setEditingLocation(null);
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((location: LocationForReadDto) => {
    setEditingLocation(location);
    setFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormOpen(false);
    setEditingLocation(null);
  }, []);

  const handleRequestDelete = useCallback((location: LocationForReadDto) => {
    setPendingDelete(location);
  }, []);

  const handleCancelDelete = useCallback(() => setPendingDelete(null), []);

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDelete) return;

    const target = pendingDelete;
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        toast({ title: t('locations.toast.deleted', { name: target.name }), variant: 'success' });
        setPendingDelete(null);
      },
      onError: (error) => {
        if (error instanceof LocationInUseError) {
          toast({ title: t('locations.toast.inUse', { count: error.camerasCount }), variant: 'destructive' });
        } else {
          toast({ title: t('locations.toast.genericError'), variant: 'destructive' });
        }
        setPendingDelete(null);
      },
    });
  }, [deleteMutation, pendingDelete, t, toast]);

  const columns = useMemo<ColumnDef<LocationRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('locations.columns.name'),
        enableSorting: true,
        cell: ({ row }) => <span className="text-foreground font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'code',
        header: t('locations.columns.code'),
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-sm">{row.original.code}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: t('locations.columns.description'),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground line-clamp-2">
            <Conditional>
              <Conditional.If condition={!!row.original.description}>{row.original.description}</Conditional.If>
              <Conditional.Else>{t('locations.descriptionEmpty')}</Conditional.Else>
            </Conditional>
          </span>
        ),
      },
      {
        accessorKey: 'cameraCount',
        header: t('locations.columns.cameraCount'),
        enableGlobalFilter: false,
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {t('locations.cameraCountLabel', { count: row.original.cameraCount })}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('locations.columns.createdAt'),
        enableGlobalFilter: false,
        enableSorting: true,
        sortDescFirst: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDateValue(row.original.createdAt, DateFormats.SHORT_MONTH_DAY_YEAR)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 56,
        enableSorting: false,
        enableGlobalFilter: false,
        meta: { disableRowClick: true },
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={t('locations.columns.actions')}>
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content align="end">
                <DropdownMenu.Item onSelect={() => handleOpenEdit(row.original)}>
                  <Pencil size={14} />
                  {t('actions.edit')}
                </DropdownMenu.Item>

                <DropdownMenu.Item onSelect={() => handleRequestDelete(row.original)}>
                  <Trash2 size={14} />
                  {t('actions.delete')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [handleOpenEdit, handleRequestDelete, t],
  );

  const table = useReactTable<LocationRow>({
    data: rows,
    columns,
    enableGlobalFilter: true,
    globalFilterFn: 'includesString',
    enableSortingRemoval: true,
    initialState: { pagination: { pageSize: 8 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const isLoading = locationsQuery.isLoading;
  const isError = locationsQuery.isError;
  const isEmpty = !isLoading && !isError && rows.length === 0;
  const totalCount = table.getFilteredRowModel().rows.length;

  return (
    <section className="bg-background flex flex-col gap-4 rounded-2xl p-5 shadow">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-lg font-semibold">{t('locations.title')}</h2>
          <p className="text-muted-foreground text-sm">{t('locations.subtitle')}</p>
        </div>

        <Button variant="default" size="sm" onClick={handleOpenCreate}>
          <Plus size={15} />
          {t('locations.addAction')}
        </Button>
      </header>

      <Conditional.If condition={isError}>
        <Alert variant="destructive" className="grid-cols-[auto_1fr_auto]">
          <Alert.Title>{t('locations.error.title')}</Alert.Title>
          <Alert.Description>{t('locations.error.description')}</Alert.Description>

          <div className="col-start-3 row-span-2 row-start-1 self-center">
            <Button variant="outline" size="sm" onClick={() => locationsQuery.refetch()}>
              {t('locations.error.retry')}
            </Button>
          </div>
        </Alert>
      </Conditional.If>

      <Conditional.If condition={!isError}>
        <DataTable table={table} isLoading={isLoading} className="min-h-0">
          <DataTable.Toolbar
            totalCount={totalCount}
            totalLabel={t('locations.totalLabel')}
            placeholder={t('locations.searchPlaceholder')}
          />

          <Conditional>
            <Conditional.If condition={isEmpty}>
              <BlankSlate when size="sm">
                <BlankSlate.Icon>
                  <MapPin strokeWidth={1} />
                </BlankSlate.Icon>
                <BlankSlate.Title>{t('locations.empty.title')}</BlankSlate.Title>
                <BlankSlate.Description>{t('locations.empty.description')}</BlankSlate.Description>
                <BlankSlate.Actions>
                  <Button variant="default" size="sm" onClick={handleOpenCreate}>
                    <Plus size={15} />
                    {t('locations.addAction')}
                  </Button>
                </BlankSlate.Actions>
              </BlankSlate>
            </Conditional.If>

            <Conditional.Else>
              <DataTable.Content
                emptyState={{ title: t('locations.empty.title'), description: t('locations.empty.description') }}
              />
              <DataTable.Pagination pageSizeOptions={[8, 15, 30]} />
            </Conditional.Else>
          </Conditional>
        </DataTable>
      </Conditional.If>

      <LocationFormDialog open={formOpen} location={editingLocation} onClose={handleCloseForm} />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(nextOpen) => !nextOpen && !deleteMutation.isLoading && handleCancelDelete()}
        variant="destructive"
        title={t('locations.confirmDelete.title')}
        description={
          pendingDelete
            ? t('locations.confirmDelete.description', { name: pendingDelete.name })
            : undefined
        }
        confirmLabel={t('locations.confirmDelete.confirm')}
        loading={deleteMutation.isLoading}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}

export default LocationsSection;
