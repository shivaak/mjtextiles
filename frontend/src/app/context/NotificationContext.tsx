import { ReactNode, useMemo } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';

export function NotificationProvider({ children }: { children: ReactNode }) {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      autoHideDuration={3000}
    >
      {children}
    </SnackbarProvider>
  );
}

export function useNotification() {
  const { enqueueSnackbar } = useSnackbar();

  return useMemo(
    () => ({
      success: (message: string) => enqueueSnackbar(message, { variant: 'success' }),
      error: (message: string) => enqueueSnackbar(message, { variant: 'error' }),
      warning: (message: string) => enqueueSnackbar(message, { variant: 'warning' }),
      info: (message: string) => enqueueSnackbar(message, { variant: 'info' }),
      show: (message: string, variant: 'success' | 'error' | 'warning' | 'info' | 'default') =>
        enqueueSnackbar(message, { variant }),
    }),
    [enqueueSnackbar]
  );
}
