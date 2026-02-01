// Authentication context for managing user session

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AuthSession, UserRole } from '../../domain/types';
import { authenticate, getSession, clearSession } from '../../data/repositories';

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = getSession();
    if (existingSession) {
      setSession(existingSession);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const newSession = authenticate(username, password);
    if (newSession) {
      setSession(newSession);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value: AuthContextType = {
    session,
    isAuthenticated: !!session,
    isAdmin: session?.role === 'ADMIN',
    isEmployee: session?.role === 'EMPLOYEE',
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for role-based access
export function withRole(allowedRoles: UserRole[]) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function WithRoleComponent(props: P) {
      const { session } = useAuth();
      
      if (!session || !allowedRoles.includes(session.role)) {
        return null;
      }
      
      return <Component {...props} />;
    };
  };
}
