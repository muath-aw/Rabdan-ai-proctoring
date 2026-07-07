import { useMemo, useState } from 'react';

import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Alert, Button } from '@components/ui';
import { DataTable } from '@components/tables';

import { useAppTranslation, useToast } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

import { Check, ChevronLeft, Download, Lock, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

import ExamHeader from './components/ExamHeader';
import ExportDialog from './components/ExportDialog';
import IncidentDetailDialog from './components/IncidentDetailDialog';
import { buildIncidentColumns, type IncidentHandlers } from './components/incident-columns';
import { EXAM_META, seedIncidents } from './data';
import type { Incident, IncidentStatus, WorkspaceMode } from './types';

type ExamWorkspacePageProps = {
  mode: WorkspaceMode;
};

function ExamWorkspacePage({ mode }: ExamWorkspacePageProps) {
  const { t } = useAppTranslation('exams');
  const { toast } = useToast();

  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const setStatus = (id: string, status: IncidentStatus) => {
    setIncidents((current) => current.map((incident) => (incident.id === id ? { ...incident, status } : incident)));
  };

  const handlers: IncidentHandlers = useMemo(
    () => ({
      onConfirm: (id) => setStatus(id, 'confirmed'),
      onDiscard: (id) => setStatus(id, 'discarded'),
      onRestore: (id) => setStatus(id, 'open'),
      onReopen: (id) => setStatus(id, 'open'),
      onReview: (id) => setDetailId(id),
      onProof: (id) => toast({ title: t('workspace.toast.proofExported', { id }), variant: 'success' }),
    }),
    [t, toast],
  );

  const columns = useMemo(() => buildIncidentColumns(t, handlers), [t, handlers]);

  const table = useReactTable<Incident>({
    data: incidents,
    columns,
    enableRowSelection: true,
    enableGlobalFilter: true,
    enableSortingRemoval: true,
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;

      const incident = row.original;
      const haystack = [incident.id, t(`type.${incident.type}`), ...incident.subjects.map((subject) => subject ?? t('subjects.unidentified'))]
        .join(' ')
        .toLowerCase();

      return haystack.includes(String(filterValue).toLowerCase());
    },
    initialState: { pagination: { pageSize: 8 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const openCount = incidents.filter((incident) => incident.status === 'open').length;
  const selectedIncidents = table.getSelectedRowModel().rows.map((row) => row.original);
  const detailIncident = detailId ? (incidents.find((incident) => incident.id === detailId) ?? null) : null;

  const exportSubtitle = t('export.subtitleSelection', { count: selectedIncidents.length, exam: EXAM_META.title });

  const applyBulk = (status: Extract<IncidentStatus, 'confirmed' | 'discarded'>) => {
    selectedIncidents.forEach((incident) => setStatus(incident.id, status));
    toast({
      title: t(status === 'confirmed' ? 'workspace.toast.confirmed' : 'workspace.toast.discarded', { count: selectedIncidents.length }),
      variant: 'success',
    });
    table.resetRowSelection();
  };

  const exportTable = () => {
    toast({ title: t('workspace.toast.tableExported', { count: selectedIncidents.length }), variant: 'success' });
    setExportOpen(false);
  };

  const isPast = mode === 'past';

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
          {isPast ? (
            <>
              <Lock size={13} />
              {t('workspace.recordsFinal')}
            </>
          ) : (
            <>
              <span className="bg-success inline-block size-1.75 rounded-full" />
              {t('workspace.syncedLive')}
            </>
          )}
        </div>
      </div>

      <ExamHeader mode={mode} openCount={openCount} />

      {isPast && openCount > 0 && (
        <Alert variant="warning" className="grid-cols-[auto_1fr_auto]">
          <TriangleAlert size={18} />
          <Alert.Title>{t('workspace.stillOpenTitle', { count: openCount })}</Alert.Title>
          <Alert.Description>{t('workspace.stillOpenDescription')}</Alert.Description>

          <div className="col-start-3 row-span-2 row-start-1 self-center">
            <Button variant="outline" size="sm" onClick={() => table.getColumn('status')?.setFilterValue(['open'])}>
              {t('workspace.reviewOpen')}
            </Button>
          </div>
        </Alert>
      )}

      {selectedIncidents.length > 0 && (
        <div className="bg-foreground text-background flex items-center justify-between gap-4 rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium">{t('workspace.selectedCount', { count: selectedIncidents.length })}</span>

          <div className="flex items-center gap-2">
            <Button variant="success" size="sm" onClick={() => applyBulk('confirmed')}>
              <Check size={14} />
              {t('workspace.bulkConfirm')}
            </Button>

            <Button variant="outline-muted" size="sm" onClick={() => applyBulk('discarded')}>
              {t('workspace.bulkDiscard')}
            </Button>

            <Button variant="default" size="sm" onClick={() => setExportOpen(true)}>
              <Download size={14} />
              {t('workspace.exportSelected')}
            </Button>

            <Button variant="ghost" size="sm" className="text-background" onClick={() => table.resetRowSelection()}>
              {t('workspace.clearSelection')}
            </Button>
          </div>
        </div>
      )}

      <DataTable
        table={table}
        onRowClick={(row) => setDetailId(row.original.id)}
        getRowClassName={(row) => (row.original.status === 'discarded' ? 'opacity-60' : '')}
        className="min-h-0 flex-1"
      >
        <DataTable.Toolbar totalCount={table.getFilteredRowModel().rows.length} totalLabel={t('workspace.totalLabel')} placeholder={t('workspace.searchPlaceholder')} />

        <DataTable.Content emptyState={{ title: t('workspace.empty.title'), description: t('workspace.empty.description') }} />

        <DataTable.Pagination pageSizeOptions={[8, 15, 30]} />
      </DataTable>

      <IncidentDetailDialog
        incident={detailIncident}
        onClose={() => setDetailId(null)}
        onConfirm={handlers.onConfirm}
        onDiscard={handlers.onDiscard}
        onRestore={handlers.onRestore}
        onProof={handlers.onProof}
      />

      <ExportDialog open={exportOpen} items={selectedIncidents} subtitle={exportSubtitle} onClose={() => setExportOpen(false)} onExport={exportTable} />
    </main>
  );
}

export default ExamWorkspacePage;
