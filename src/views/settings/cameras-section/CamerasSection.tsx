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
import { useCamerasQuery, useLocationsQuery } from '@hooks/queries';
import { useDeleteCameraMutation } from '@hooks/mutations';

import { Camera as CameraIcon, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';

import type { CameraForReadDto } from '@app-types';

import { CameraFormDialog } from '../camera-form-dialog';

type CameraRow = CameraForReadDto & { locationName: string };

type CamerasSectionProps = {
  onScrollToLocations: () => void;
};

function CamerasSection({ onScrollToLocations }: CamerasSectionProps) {
  const { t } = useAppTranslation('settings');
  const { toast } = useToast();

  const camerasQuery = useCamerasQuery();
  const locationsQuery = useLocationsQuery();
  const deleteMutation = useDeleteCameraMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraForReadDto | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CameraForReadDto | null>(null);

  const locations = useMemo(() => locationsQuery.data ?? [], [locationsQuery.data]);

  const locationNameById = useMemo(() => {
    const map = new Map<string, string>();
    locations.forEach((location) => map.set(location.id, location.name));
    return map;
  }, [locations]);

  const rows = useMemo<CameraRow[]>(
    () =>
      (camerasQuery.data ?? []).map((camera) => ({
        ...camera,
        locationName: locationNameById.get(camera.locationId) ?? t('cameras.locationMissing'),
      })),
    [camerasQuery.data, locationNameById, t],
  );

  const hasLocations = locations.length > 0;

  const handleOpenCreate = useCallback(() => {
    setEditingCamera(null);
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((camera: CameraForReadDto) => {
    setEditingCamera(camera);
    setFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormOpen(false);
    setEditingCamera(null);
  }, []);

  const handleRequestDelete = useCallback((camera: CameraForReadDto) => setPendingDelete(camera), []);
  const handleCancelDelete = useCallback(() => setPendingDelete(null), []);

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDelete) return;

    const target = pendingDelete;
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        toast({ title: t('cameras.toast.deleted', { name: target.name }), variant: 'success' });
        setPendingDelete(null);
      },
      onError: () => {
        toast({ title: t('cameras.toast.genericError'), variant: 'destructive' });
        setPendingDelete(null);
      },
    });
  }, [deleteMutation, pendingDelete, t, toast]);

  const columns = useMemo<ColumnDef<CameraRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('cameras.columns.name'),
        enableSorting: true,
        cell: ({ row }) => <span className="text-foreground font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'locationName',
        header: t('cameras.columns.location'),
        enableSorting: true,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.locationName}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: t('cameras.columns.createdAt'),
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
                <Button variant="ghost" size="icon-sm" aria-label={t('cameras.columns.actions')}>
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

  const table = useReactTable<CameraRow>({
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

  const isLoading = camerasQuery.isLoading || locationsQuery.isLoading;
  const isError = camerasQuery.isError || locationsQuery.isError;
  const isEmpty = !isLoading && !isError && rows.length === 0;
  const totalCount = table.getFilteredRowModel().rows.length;

  return (
    <section className="bg-background flex flex-col gap-4 rounded-2xl p-5 shadow">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-lg font-semibold">{t('cameras.title')}</h2>
          <p className="text-muted-foreground text-sm">{t('cameras.subtitle')}</p>
        </div>

        <Button variant="default" size="sm" onClick={handleOpenCreate} disabled={!hasLocations || isLoading}>
          <Plus size={15} />
          {t('cameras.addAction')}
        </Button>
      </header>

      <Conditional.If condition={isError}>
        <Alert variant="destructive" className="grid-cols-[auto_1fr_auto]">
          <Alert.Title>{t('cameras.error.title')}</Alert.Title>
          <Alert.Description>{t('cameras.error.description')}</Alert.Description>

          <div className="col-start-3 row-span-2 row-start-1 self-center">
            <Button variant="outline" size="sm" onClick={() => camerasQuery.refetch()}>
              {t('cameras.error.retry')}
            </Button>
          </div>
        </Alert>
      </Conditional.If>

      <Conditional.If condition={!isError}>
        <DataTable table={table} isLoading={isLoading} className="min-h-0">
          <DataTable.Toolbar
            totalCount={totalCount}
            totalLabel={t('cameras.totalLabel')}
            placeholder={t('cameras.searchPlaceholder')}
          />

          <Conditional>
            <Conditional.If condition={isEmpty && !hasLocations && !isLoading}>
              <BlankSlate when size="sm">
                <BlankSlate.Icon>
                  <CameraIcon strokeWidth={1} />
                </BlankSlate.Icon>
                <BlankSlate.Title>{t('cameras.emptyNoLocations.title')}</BlankSlate.Title>
                <BlankSlate.Description>{t('cameras.emptyNoLocations.description')}</BlankSlate.Description>
                <BlankSlate.Actions>
                  <Button variant="default" size="sm" onClick={onScrollToLocations}>
                    <Plus size={15} />
                    {t('cameras.emptyNoLocations.cta')}
                  </Button>
                </BlankSlate.Actions>
              </BlankSlate>
            </Conditional.If>

            <Conditional.Else>
              <Conditional>
                <Conditional.If condition={isEmpty}>
                  <BlankSlate when size="sm">
                    <BlankSlate.Icon>
                      <CameraIcon strokeWidth={1} />
                    </BlankSlate.Icon>
                    <BlankSlate.Title>{t('cameras.empty.title')}</BlankSlate.Title>
                    <BlankSlate.Description>{t('cameras.empty.description')}</BlankSlate.Description>
                    <BlankSlate.Actions>
                      <Button variant="default" size="sm" onClick={handleOpenCreate}>
                        <Plus size={15} />
                        {t('cameras.addAction')}
                      </Button>
                    </BlankSlate.Actions>
                  </BlankSlate>
                </Conditional.If>

                <Conditional.Else>
                  <DataTable.Content
                    emptyState={{ title: t('cameras.empty.title'), description: t('cameras.empty.description') }}
                  />
                  <DataTable.Pagination pageSizeOptions={[8, 15, 30]} />
                </Conditional.Else>
              </Conditional>
            </Conditional.Else>
          </Conditional>
        </DataTable>
      </Conditional.If>

      <CameraFormDialog open={formOpen} camera={editingCamera} locations={locations} onClose={handleCloseForm} />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(nextOpen) => !nextOpen && !deleteMutation.isLoading && handleCancelDelete()}
        variant="destructive"
        title={t('cameras.confirmDelete.title')}
        description={
          pendingDelete
            ? t('cameras.confirmDelete.description', { name: pendingDelete.name })
            : undefined
        }
        confirmLabel={t('cameras.confirmDelete.confirm')}
        loading={deleteMutation.isLoading}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}

export default CamerasSection;
