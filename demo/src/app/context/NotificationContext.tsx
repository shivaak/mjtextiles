// Notification context using notistack

import React, { createContext, useContext, useCallback } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';
import type { VariantType } from 'notistack';

interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function NotificationProviderInner({ children }: { children: React.ReactNode }) {
  const { enqueueSnackbar } = useSnackbar();

  const showNotification = useCallback((message: string, variant: VariantType) => {
    enqueueSnackbar(message, {
      variant,
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right',
      },
      autoHideDuration: variant === 'error' ? 5000 : 3000,
    });
  }, [enqueueSnackbar]);

  const showSuccess = useCallback((message: string) => {
    showNotification(message, 'success');
  }, [showNotification]);

  const showError = useCallback((message: string) => {
    showNotification(message, 'error');
  }, [showNotification]);

  const showWarning = useCallback((message: string) => {
    showNotification(message, 'warning');
  }, [showNotification]);

  const showInfo = useCallback((message: string) => {
    showNotification(message, 'info');
  }, [showNotification]);

  const value: NotificationContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <SnackbarProvider 
      maxSnack={3}
      preventDuplicate
      dense
    >
      <NotificationProviderInner>
        {children}
      </NotificationProviderInner>
    </SnackbarProvider>
  );
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
