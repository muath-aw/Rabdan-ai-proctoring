import { Badge } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { Lock } from 'lucide-react';

import { EXAM_META } from '../data';
import type { WorkspaceMode } from '@app-types';

type ExamHeaderProps = {
  mode: WorkspaceMode;
  openCount: number;
};

function ExamHeader({ mode, openCount }: ExamHeaderProps) {
  const { t } = useAppTranslation('exams');

  const isLive = mode === 'active';

  return (
    <div className="bg-background flex items-center justify-between gap-6 rounded-2xl p-6 shadow">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-foreground text-xl font-semibold whitespace-nowrap">{EXAM_META.title}</h1>

          <Conditional>
            <Conditional.If condition={isLive}>
              <Badge variant="destructive" size="sm" className="whitespace-nowrap [&_[data-slot=badge-dot]]:animate-live-pulse">
                {t('workspace.live')}
              </Badge>
            </Conditional.If>

            <Conditional.Else>
              <Badge variant="muted" size="sm" className="whitespace-nowrap">
                <Lock size={11} />
                {t('workspace.ended')}
              </Badge>
            </Conditional.Else>
          </Conditional>
        </div>

        <div className="text-muted-foreground flex items-center gap-2 text-sm whitespace-nowrap">
          <span>{EXAM_META.room}</span>
          <span className="text-muted-300" aria-hidden="true">·</span>
          <span className="font-mono">{EXAM_META.window}</span>
          <span className="text-muted-300" aria-hidden="true">·</span>
          <span className="font-mono">{isLive ? EXAM_META.activeSession : EXAM_META.endedSession}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="border-border min-w-21 rounded-xl border px-4 py-2 text-center">
          <div className="text-foreground font-mono text-xl font-semibold">{EXAM_META.students}</div>
          <div className="text-muted-400 mt-0.5 text-xs tracking-wide uppercase">{t('workspace.studentsLabel')}</div>
        </div>

        <div className="bg-warning-200 min-w-21 rounded-xl px-4 py-2 text-center">
          <div className="text-warning font-mono text-xl font-semibold">{openCount}</div>
          <div className="text-warning mt-0.5 text-xs tracking-wide uppercase opacity-80">{t('workspace.openLabel')}</div>
        </div>
      </div>
    </div>
  );
}

export default ExamHeader;
