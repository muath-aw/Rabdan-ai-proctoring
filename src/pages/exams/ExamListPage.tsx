import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Badge, Button, Input, Select, Tabs } from '@components/ui';
import { ActionPanel, BlankSlate } from '@components/shared';
import { Conditional } from '@components/utils';
import { ACTIVE_EXAMS, PAST_EXAMS } from '@views/exams';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

import { cn } from '@utils';

import { Bell, ChevronRight, RefreshCw, Search, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ExamSummary } from '@app-types';

const SYNC_DURATION_MS = 1100;

type PastRange = 'all' | '7' | '30';
type PastSort = 'recent' | 'oldest' | 'incidents';

// Cutoffs are packed as yyyymmdd integers matching `ExamSummary.ts` for past exams.
const RANGE_CUTOFF: Record<Exclude<PastRange, 'all'>, number> = {
  '7': 20260622,
  '30': 20260530,
};

function ExamListPage() {
  const { t } = useAppTranslation('exams');

  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<PastRange>('all');
  const [sort, setSort] = useState<PastSort>('recent');
  const [syncing, setSyncing] = useState(false);
  const [syncedJustNow, setSyncedJustNow] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isPast = tab === 'past';

  const exams = useMemo<ExamSummary[]>(() => {
    if (!isPast) {
      return [...ACTIVE_EXAMS].sort((a, b) => a.ts - b.ts);
    }

    const query = search.trim().toLowerCase();
    const filtered = PAST_EXAMS.filter((exam) => {
      if (query && !`${exam.title} ${exam.room}`.toLowerCase().includes(query)) return false;
      if (range !== 'all' && exam.ts < RANGE_CUTOFF[range]) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sort === 'oldest') return a.ts - b.ts;
      if (sort === 'incidents') return b.total - a.total;
      return b.ts - a.ts;
    });
  }, [isPast, search, range, sort]);

  const workspacePath = isPast ? FULL_ROUTES_PATH.EXAMS.PAST : FULL_ROUTES_PATH.EXAMS.ACTIVE;

  const syncLabel = useMemo(() => {
    if (syncing) return t('list.syncing');
    if (syncedJustNow) return t('list.syncedJustNow');
    return t('list.syncedAgo', { ago: t('list.syncedAgoInitial') });
  }, [syncing, syncedJustNow, t]);

  const handleSync = useCallback(() => {
    if (syncing) return;

    setSyncing(true);
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      setSyncing(false);
      setSyncedJustNow(true);
    }, SYNC_DURATION_MS);
  }, [syncing]);

  useEffect(() => {
    return () => clearTimeout(syncTimer.current);
  }, []);

  const handleTabChange = (value: string) => setTab(value);
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value);
  const handleRangeChange = (value: string) => setRange(value as PastRange);
  const handleSortChange = (value: string) => setSort(value as PastSort);

  return (
    <main className="flex flex-col gap-4">
      <ActionPanel>
        <ActionPanel.Header className="flex-col gap-0.5">
          <ActionPanel.Title>{t('list.title')}</ActionPanel.Title>
          <span className="text-muted-foreground text-sm">{t('list.subtitle')}</span>
        </ActionPanel.Header>

        <ActionPanel.Actions>
          <div className="text-muted-foreground flex items-center gap-2 text-sm whitespace-nowrap">
            <span className={cn('inline-block size-1.75 rounded-full', syncing ? 'bg-warning' : 'bg-success')} />
            {syncLabel}
          </div>

          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw size={15} className={cn(syncing && 'animate-spin')} />
            {syncing ? t('list.syncing') : t('list.syncNow')}
          </Button>

          <div className="relative">
            <Button variant="outline" size="icon" aria-label={t('list.notifications')}>
              <Bell size={17} />
            </Button>
            <span className="bg-destructive text-primary-foreground border-canvas absolute -end-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full border-2 px-1 text-2xs">
              5
            </span>
          </div>
        </ActionPanel.Actions>
      </ActionPanel>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <Tabs.List>
          <Tabs.Trigger value="active">{t('list.tabs.active', { count: ACTIVE_EXAMS.length })}</Tabs.Trigger>
          <Tabs.Trigger value="past">{t('list.tabs.past', { count: PAST_EXAMS.length })}</Tabs.Trigger>
        </Tabs.List>
      </Tabs>

      <Conditional.If condition={isPast}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-55 max-w-90 flex-1">
            <Search size={16} className="text-muted-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              aria-label={t('list.searchPlaceholder')}
              value={search}
              onChange={handleSearchChange}
              placeholder={t('list.searchPlaceholder')}
              className="w-full ps-9"
            />
          </div>

          <div className="w-42">
            <Select value={range} onValueChange={handleRangeChange}>
              <Select.Trigger>
                <Select.Value placeholder={t('list.range.all')} />
                <Select.Icon />
              </Select.Trigger>

              <Select.Content>
                <Select.Item value="all">
                  <Select.Text>{t('list.range.all')}</Select.Text>
                </Select.Item>
                <Select.Item value="7">
                  <Select.Text>{t('list.range.last7')}</Select.Text>
                </Select.Item>
                <Select.Item value="30">
                  <Select.Text>{t('list.range.last30')}</Select.Text>
                </Select.Item>
              </Select.Content>
            </Select>
          </div>

          <div className="w-47">
            <Select value={sort} onValueChange={handleSortChange}>
              <Select.Trigger>
                <Select.Value placeholder={t('list.sort.recent')} />
                <Select.Icon />
              </Select.Trigger>

              <Select.Content>
                <Select.Item value="recent">
                  <Select.Text>{t('list.sort.recent')}</Select.Text>
                </Select.Item>
                <Select.Item value="oldest">
                  <Select.Text>{t('list.sort.oldest')}</Select.Text>
                </Select.Item>
                <Select.Item value="incidents">
                  <Select.Text>{t('list.sort.incidents')}</Select.Text>
                </Select.Item>
              </Select.Content>
            </Select>
          </div>
        </div>
      </Conditional.If>

      <div className="flex flex-col gap-2.5">
        {exams.map((exam) => (
          <Link key={exam.id} to={workspacePath} className="block no-underline">
            <div className="bg-background flex items-center gap-4 rounded-2xl p-4 shadow transition-shadow hover:shadow-spread">
              <div
                className={cn(
                  'flex size-10.5 shrink-0 items-center justify-center rounded-xl text-base font-semibold',
                  exam.live ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground',
                )}
              >
                {exam.letter}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground font-semibold whitespace-nowrap">{exam.title}</span>

                  <Conditional.If condition={!!exam.live}>
                    <Badge variant="destructive" size="sm" className="whitespace-nowrap [&_[data-slot=badge-dot]]:animate-live-pulse">
                      {t('list.live')}
                    </Badge>
                  </Conditional.If>

                  <Conditional.If condition={!isPast && exam.open > 0}>
                    <Badge variant="warning" size="sm" className="whitespace-nowrap">
                      {t('list.newIncidents')}
                    </Badge>
                  </Conditional.If>
                </div>

                <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm whitespace-nowrap">
                  <span>{exam.room}</span>
                  <span className="text-muted-300" aria-hidden="true">·</span>
                  <span className="font-mono">{exam.when}</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1 whitespace-nowrap">
                <Conditional.If condition={exam.open > 0}>
                  <Badge variant="warning" size="sm" className="whitespace-nowrap">
                    {t('list.openCount', { count: exam.open })}
                  </Badge>
                </Conditional.If>

                <ExamCountLabel exam={exam} />
              </div>

              <ChevronRight size={18} className="text-muted-300 shrink-0 rtl:rotate-180" />
            </div>
          </Link>
        ))}

        <BlankSlate when={exams.length === 0}>
          <BlankSlate.Icon>
            <SearchX strokeWidth={1} />
          </BlankSlate.Icon>
          <BlankSlate.Title>{t('list.empty.title')}</BlankSlate.Title>
          <BlankSlate.Description>{t('list.empty.description')}</BlankSlate.Description>
        </BlankSlate>
      </div>
    </main>
  );
}

function ExamCountLabel({ exam }: { exam: ExamSummary }) {
  const { t } = useAppTranslation('exams');

  const label = exam.total === 0
    ? t('list.noIncidents')
    : exam.open === 0
      ? t('list.allReviewed', { count: exam.total })
      : t('list.totalCount', { count: exam.total });

  return <span className="text-muted-400 text-xs whitespace-nowrap">{label}</span>;
}

export default ExamListPage;
