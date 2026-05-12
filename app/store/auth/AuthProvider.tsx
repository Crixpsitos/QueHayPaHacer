'use client';
 
import * as React from 'react';
import { usePathname } from 'next/navigation';
import {AuthContext, useAuth, User} from './AuthContext';
 
export interface AuthProviderProps {
  user: User | null;
  children: React.ReactNode;
}
 
export const AuthProvider: React.FunctionComponent<AuthProviderProps> = ({
  user: initialUser,
  children
}) => {
  const [user, setUser] = React.useState<User | null>(initialUser);
  const [isHydrating, setIsHydrating] = React.useState(false);
  const hasHydratedOnceRef = React.useRef(false);

  const refreshUser = React.useCallback(async () => {
    const shouldShowSkeleton = !hasHydratedOnceRef.current;

    if (shouldShowSkeleton) {
      setIsHydrating(true);
    }

    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!response.ok) return;

      const data: { user: User | null } = await response.json();
      setUser(data.user ?? null);
    } catch {
      // Swallow network errors to avoid breaking UI hydration.
    } finally {
      if (shouldShowSkeleton) {
        hasHydratedOnceRef.current = true;
        setIsHydrating(false);
      }
    }
  }, []);

  React.useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isHydrating,
        setUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Watches pathname changes and refreshes user auth state on navigation.
 * Isolated here so usePathname() is wrapped in its own Suspense,
 * keeping the main content tree outside any suspending boundary.
 */
export function AuthPathWatcher() {
  const pathname = usePathname();
  const { refreshUser } = useAuth();
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void refreshUser();
  }, [pathname, refreshUser]);

  return null;
}