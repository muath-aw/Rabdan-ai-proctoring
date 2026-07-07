import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react';

import { queryClient } from '@api/config';
import { ROUTER } from '@routes';
import { AppDirectionProvider, THEME_TYPES, ThemeProvider } from '@contexts';

import './i18n';
import './index.css';

export function renderApp(container: HTMLElement) {
  createRoot(container).render(
    <StrictMode>
      <ThemeProvider defaultTheme={THEME_TYPES.LIGHT}>
        <QueryClientProvider client={queryClient}>
          <AppDirectionProvider>
            <NuqsAdapter>
              <RouterProvider router={ROUTER} future={{ v7_startTransition: true }} />
            </NuqsAdapter>
          </AppDirectionProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
