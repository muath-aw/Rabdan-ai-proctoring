import { Badge } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { HelpCircle, Users } from 'lucide-react';

import { formatConfidence, LOW_CONFIDENCE_THRESHOLD } from '../data';
import type { IncidentStatus, ViolationType } from '../types';

export const STATUS_BADGE_VARIANT: Record<IncidentStatus, 'warning' | 'success' | 'muted'> = {
  open: 'warning',
  confirmed: 'success',
  discarded: 'muted',
};

/** Placeholder texture standing in for the captured camera still — theme-aware via CSS variables. */
const STILL_TEXTURE = 'repeating-linear-gradient(45deg, var(--muted-100), var(--muted-100) 6px, var(--muted-200) 6px, var(--muted-200) 12px)';
const STILL_TEXTURE_LARGE = 'repeating-linear-gradient(45deg, var(--muted-100), var(--muted-100) 9px, var(--muted-200) 9px, var(--muted-200) 18px)';

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const { t } = useAppTranslation('exams');

  return (
    <Badge variant={STATUS_BADGE_VARIANT[status]} size="sm" className="whitespace-nowrap">
      {t(`status.${status}`)}
    </Badge>
  );
}

export function TypeChip({ type }: { type: ViolationType }) {
  const { t } = useAppTranslation('exams');

  return (
    <Badge variant="neutral" size="sm" className="whitespace-nowrap">
      {t(`type.${type}`)}
    </Badge>
  );
}

export function Thumbnail({ cam }: { cam: string }) {
  return (
    <div className="border-border relative h-10 w-15 shrink-0 overflow-hidden rounded-md border" style={{ backgroundImage: STILL_TEXTURE }}>
      <span className="text-muted-400 bg-background absolute start-1 bottom-1 rounded px-1 font-mono text-2xs">{cam}</span>
    </div>
  );
}

export function UnidentifiedPill() {
  const { t } = useAppTranslation('exams');

  return (
    <span className="text-warning bg-warning-200 inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium">
      <HelpCircle size={12} />
      {t('subjects.unidentified')}
    </span>
  );
}

export function SubjectsCell({ subjects }: { subjects: (string | null)[] }) {
  const isPair = subjects.length > 1;

  return (
    <div className="flex items-center gap-2 whitespace-normal">
      <Conditional.If condition={isPair}>
        <Users size={15} className="text-muted-400 shrink-0" />
      </Conditional.If>

      <div className="flex min-w-0 flex-col gap-1">
        {subjects.map((subject, index) => (
          <Conditional key={`${index}-${subject ?? 'unidentified'}`}>
            <Conditional.If condition={!!subject}>
              <span className="text-foreground text-sm leading-tight font-medium">{subject}</span>
            </Conditional.If>

            <Conditional.Else>
              <UnidentifiedPill />
            </Conditional.Else>
          </Conditional>
        ))}
      </div>
    </div>
  );
}

export function ConfidenceCell({ conf }: { conf: number | null }) {
  if (conf == null) return <span className="text-muted-400 text-sm">—</span>;

  const isLow = conf < LOW_CONFIDENCE_THRESHOLD;

  return (
    <div className="flex flex-col gap-1 whitespace-normal">
      <span className={cn('font-mono text-sm font-semibold', isLow ? 'text-warning' : 'text-foreground')}>{formatConfidence(conf)}</span>

      <div className="bg-muted-100 h-1.5 w-15 overflow-hidden rounded-full">
        <div className={cn('h-full rounded-full', isLow ? 'bg-warning' : 'bg-primary')} style={{ width: `${Math.round(conf * 100)}%` }} />
      </div>
    </div>
  );
}

/** Larger still used by the detail dialog. */
export function CameraStill({ cam, time, type }: { cam: string; time: string; type: ViolationType }) {
  return (
    <div className="border-border relative h-55 overflow-hidden rounded-xl border" style={{ backgroundImage: STILL_TEXTURE_LARGE }}>
      <div className="absolute start-3 top-3">
        <TypeChip type={type} />
      </div>

      <div className="text-muted-foreground bg-background absolute start-3 bottom-3 flex items-center gap-2 rounded px-2 py-1 font-mono text-xs">
        {cam}
        <span className="text-muted-300" aria-hidden="true">·</span>
        {time}
      </div>
    </div>
  );
}
