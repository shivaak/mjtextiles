import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { licenseService } from '../../services/licenseService';
import type { LicenseStatusInfo } from '../../domain/types';
import { useAuth } from './AuthContext';

type BannerSeverity = 'warning' | 'error';

interface LicenseBannerState {
  visible: boolean;
  severity: BannerSeverity;
  message: string;
  daysRemaining?: number;
}

interface LicenseContextType {
  status: LicenseStatusInfo | null;
  loading: boolean;
  banner: LicenseBannerState | null;
  refreshStatus: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

const EXPIRY_WARNING_DAYS = 15;
const STATUS_REFRESH_INTERVAL_MS = 4 * 60 * 60 * 1000;

function getBanner(status: LicenseStatusInfo | null): LicenseBannerState | null {
  if (!status) {
    return null;
  }

  if (status.status === 'EXPIRED') {
    return {
      visible: true,
      severity: 'error',
      message: 'License expired. Renew immediately to avoid access issues.',
      daysRemaining: status.daysRemaining,
    };
  }

  if (status.status !== 'VALID') {
    return null;
  }

  const daysRemaining = status.daysRemaining;
  if (typeof daysRemaining !== 'number' || daysRemaining > EXPIRY_WARNING_DAYS) {
    return null;
  }

  if (daysRemaining === 0) {
    return {
      visible: true,
      severity: 'warning',
      message: 'License expires today. Renew soon to avoid login blockage.',
      daysRemaining,
    };
  }

  return {
    visible: true,
    severity: 'warning',
    message: `License expires in ${daysRemaining} day(s). Please renew in advance.`,
    daysRemaining,
  };
}

export function LicenseProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<LicenseStatusInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setStatus(null);
      return;
    }

    setLoading(true);
    try {
      const response = await licenseService.getStatus();
      setStatus(response);
    } catch {
      // Avoid noisy UX from global fetch failures; feature should fail silently.
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setStatus(null);
      return;
    }

    refreshStatus();
    const intervalId = window.setInterval(refreshStatus, STATUS_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [authLoading, isAuthenticated, refreshStatus]);

  const value = useMemo<LicenseContextType>(() => ({
    status,
    loading,
    banner: getBanner(status),
    refreshStatus,
  }), [status, loading, refreshStatus]);

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
}

