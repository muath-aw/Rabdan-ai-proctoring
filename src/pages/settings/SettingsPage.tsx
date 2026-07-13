import { useCallback, useRef } from 'react';

import { ActionPanel } from '@components/shared';

import { CamerasSection, LocationsSection } from '@views/settings';

import { useAppTranslation } from '@hooks/shared';

function SettingsPage() {
  const { t } = useAppTranslation('settings');

  const locationsSectionRef = useRef<HTMLDivElement>(null);

  const handleScrollToLocations = useCallback(() => {
    locationsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <main className="flex flex-col gap-6">
      <ActionPanel>
        <ActionPanel.Header className="flex-col gap-0.5">
          <ActionPanel.Title>{t('title')}</ActionPanel.Title>
          <span className="text-muted-foreground text-sm">{t('subtitle')}</span>
        </ActionPanel.Header>
      </ActionPanel>

      <div ref={locationsSectionRef}>
        <LocationsSection />
      </div>

      <CamerasSection onScrollToLocations={handleScrollToLocations} />
    </main>
  );
}

export default SettingsPage;
