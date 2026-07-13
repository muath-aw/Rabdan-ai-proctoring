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
      <PrimeDialog.Panel dismissible>
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
