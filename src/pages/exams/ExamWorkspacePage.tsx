import { useCallback, useMemo, useState } from 'react';

import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  useReactTable,
} from '@tanstack/react-table';

import { Alert, Button } from '@components/ui';
import { DataTable } from '@components/tables';
import { Conditional } from '@components/utils';
import { buildIncidentColumns, EXAM_META, ExamHeader, ExportDialog, IncidentDetailDialog, seedIncidents, type IncidentHandlers } from '@views/exams';

import { useAppTranslation, useToast } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

import { Check, ChevronLeft, Download, Lock, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Incident, IncidentStatus, WorkspaceMode } from '@app-types';

type ExamWorkspacePageProps = {
  mode: WorkspaceMode;
};

type BulkStatus = Extract<IncidentStatus, 'confirmed' | 'discarded'>;

function ExamWorkspacePage({ mode }: ExamWorkspacePageProps) {
  const { t } = useAppTranslation('exams');
  const { toast } = useToast();

  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const setStatus = useCallback((id: string, status: IncidentStatus) => {
    setIncidents((current) => current.map((incident) => (incident.id === id ? { ...incident, status } : incident)));
  }, []);

  const handlers: IncidentHandlers = useMemo(
    () => ({
      onConfirm: (id) => setStatus(id, 'confirmed'),
      onDiscard: (id) => setStatus(id, 'discarded'),
      onRestore: (id) => setStatus(id, 'open'),
      onReopen: (id) => setStatus(id, 'open'),
      onReview: (id) => setDetailId(id),
      onProof: (id) => toast({ title: t('workspace.toast.proofExported', { id }), variant: 'success' }),
    }),
    [setStatus, t, toast],
  );

  const columns = useMemo(() => buildIncidentColumns(t, handlers), [t, handlers]);

  const globalFilterFn = useCallback(
    (row: Row<Incident>, _columnId: string, filterValue: string) => {
      if (!filterValue) return true;

      const incident = row.original;
      const haystack = [incident.id, t(`type.${incident.type}`), ...incident.subjects.map((subject) => subject ?? t('subjects.unidentified'))]
        .join(' ')
        .toLowerCase();

      return haystack.includes(String(filterValue).toLowerCase());
    },
    [t],
  );

  const table = useReactTable<Incident>({
    data: incidents,
    columns,
    enableRowSelection: true,
    enableGlobalFilter: true,
    enableSortingRemoval: true,
    globalFilterFn,
    initialState: { pagination: { pageSize: 8 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const openCount = useMemo(
    () => incidents.filter((incident) => incident.status === 'open').length,
    [incidents],
  );

  const selectedIncidents = useMemo(
    () => table.getSelectedRowModel().rows.map((row) => row.original),
    // getSelectedRowModel changes reference when selection state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table.getState().rowSelection, incidents],
  );

  const detailIncident = useMemo(
    () => (detailId ? (incidents.find((incident) => incident.id === detailId) ?? null) : null),
    [detailId, incidents],
  );

  const exportSubtitle = t('export.subtitleSelection', { count: selectedIncidents.length, exam: EXAM_META.title });

  const applyBulk = useCallback(
    (status: BulkStatus) => {
      selectedIncidents.forEach((incident) => setStatus(incident.id, status));
      toast({
        title: t(status === 'confirmed' ? 'workspace.toast.confirmed' : 'workspace.toast.discarded', { count: selectedIncidents.length }),
        variant: 'success',
      });
      table.resetRowSelection();
    },
    [selectedIncidents, setStatus, t, table, toast],
  );

  const handleConfirmAll = useCallback(() => applyBulk('confirmed'), [applyBulk]);
  const handleDiscardAll = useCallback(() => applyBulk('discarded'), [applyBulk]);
  const handleOpenExport = useCallback(() => setExportOpen(true), []);
  const handleCloseExport = useCallback(() => setExportOpen(false), []);
  const handleClearSelection = useCallback(() => table.resetRowSelection(), [table]);
  const handleReviewOpen = useCallback(() => table.getColumn('status')?.setFilterValue(['open']), [table]);
  const handleCloseDetail = useCallback(() => setDetailId(null), []);
  const handleRowClick = useCallback((row: Row<Incident>) => setDetailId(row.original.id), []);
  const getRowClassName = useCallback((row: Row<Incident>) => (row.original.status === 'discarded' ? 'opacity-60' : ''), []);

  const exportTable = useCallback(() => {
    toast({ title: t('workspace.toast.tableExported', { count: selectedIncidents.length }), variant: 'success' });
    setExportOpen(false);
  }, [selectedIncidents.length, t, toast]);

  const isPast = mode === 'past';
  const hasSelection = selectedIncidents.length > 0;
  const hasStillOpen = isPast && openCount > 0;

  return (
    <main className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={FULL_ROUTES_PATH.EXAMS.INDEX}>
            <ChevronLeft size={15} />
            {t('workspace.backToExams')}
          </Link>
        </Button>

        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Conditional>
            <Conditional.If condition={isPast}>
              <Lock size={13} />
              {t('workspace.recordsFinal')}
            </Conditional.If>

            <Conditional.Else>
              <span className="bg-success inline-block size-1.75 rounded-full" />
              {t('workspace.syncedLive')}
            </Conditional.Else>
          </Conditional>
        </div>
      </div>

      <ExamHeader mode={mode} openCount={openCount} />

      <Conditional.If condition={hasStillOpen}>
        <Alert variant="warning" className="grid-cols-[auto_1fr_auto]">
          <TriangleAlert size={18} />
          <Alert.Title>{t('workspace.stillOpenTitle', { count: openCount })}</Alert.Title>
          <Alert.Description>{t('workspace.stillOpenDescription')}</Alert.Description>

          <div className="col-start-3 row-span-2 row-start-1 self-center">
            <Button variant="outline" size="sm" onClick={handleReviewOpen}>
              {t('workspace.reviewOpen')}
            </Button>
          </div>
        </Alert>
      </Conditional.If>

      <Conditional.If condition={hasSelection}>
        <div className="bg-foreground text-background flex items-center justify-between gap-4 rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium">{t('workspace.selectedCount', { count: selectedIncidents.length })}</span>

          <div className="flex items-center gap-2">
            <Button variant="success" size="sm" onClick={handleConfirmAll}>
              <Check size={14} />
              {t('workspace.bulkConfirm')}
            </Button>

            <Button variant="outline-muted" size="sm" onClick={handleDiscardAll}>
              {t('workspace.bulkDiscard')}
            </Button>

            <Button variant="default" size="sm" onClick={handleOpenExport}>
              <Download size={14} />
              {t('workspace.exportSelected')}
            </Button>

            <Button variant="ghost" size="sm" className="text-background" onClick={handleClearSelection}>
              {t('workspace.clearSelection')}
            </Button>
          </div>
        </div>
      </Conditional.If>

      <DataTable
        table={table}
        onRowClick={handleRowClick}
        getRowClassName={getRowClassName}
        className="min-h-0 flex-1"
      >
        <DataTable.Toolbar totalCount={table.getFilteredRowModel().rows.length} totalLabel={t('workspace.totalLabel')} placeholder={t('workspace.searchPlaceholder')} />

        <DataTable.Content emptyState={{ title: t('workspace.empty.title'), description: t('workspace.empty.description') }} />

        <DataTable.Pagination pageSizeOptions={[8, 15, 30]} />
      </DataTable>

      <IncidentDetailDialog
        incident={detailIncident}
        onClose={handleCloseDetail}
        onConfirm={handlers.onConfirm}
        onDiscard={handlers.onDiscard}
        onRestore={handlers.onRestore}
        onProof={handlers.onProof}
      />

      <ExportDialog open={exportOpen} items={selectedIncidents} subtitle={exportSubtitle} onClose={handleCloseExport} onExport={exportTable} />
    </main>
  );
}

export default ExamWorkspacePage;
