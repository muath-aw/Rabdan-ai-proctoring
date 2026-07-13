import type { ReactNode } from 'react';

import { Button, Dialog } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { Check, FileText, RotateCcw } from 'lucide-react';

import { CameraStill, StatusBadge, SubjectsCell } from './IncidentCells';
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
    <Dialog.Panel className="max-w-md">
      <Dialog.Header>
        <div className="flex items-center gap-3">
          <Dialog.Title>{t('detail.title')}</Dialog.Title>
          <span className="text-muted-400 font-mono text-xs">{incident.id}</span>
        </div>

        <Dialog.Description className="mt-1 font-mono">
          {incident.cam}, {incident.time}
        </Dialog.Description>
      </Dialog.Header>

      <Dialog.Content className="max-h-[62vh] overflow-y-auto">
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
      </Dialog.Content>

      <Dialog.Footer className="flex flex-col gap-2">
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
      </Dialog.Footer>
    </Dialog.Panel>
  );
}

function IncidentDetailDialog({ incident, onClose, onConfirm, onDiscard, onRestore, onProof }: IncidentDetailDialogProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  // Non-null assertion is safe: Conditional.If below only renders when incident is non-null.
  return (
    <Dialog open={!!incident} onOpenChange={handleOpenChange}>
      <Conditional.If condition={!!incident}>
        <IncidentDetailPanel
          incident={incident!}
          onConfirm={onConfirm}
          onDiscard={onDiscard}
          onRestore={onRestore}
          onProof={onProof}
        />
      </Conditional.If>
    </Dialog>
  );
}

export default IncidentDetailDialog;
