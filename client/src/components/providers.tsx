'use client';

import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store, RootState } from '../store';
import { SocketProvider } from '../hooks/useSocket';
import { loadStoredTheme } from '../store/slices/uiSlice';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function ThemeSync({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);

  useEffect(() => {
    // Load persisted theme
    dispatch(loadStoredTheme());
  }, [dispatch]);

  useEffect(() => {
    // Sync with HTML element attribute
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeSync>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            {children}
          </SocketProvider>
        </QueryClientProvider>
      </ThemeSync>
    </Provider>
  );
}
