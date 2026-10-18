"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AuthContext, useAuth, User } from "./AuthContext";
import { getFirebaseAuth } from "@/infraestructure/firebase/config/client/firebase";
import { signInWithCustomToken } from "firebase/auth";
import { clearClientCache, readCache, writeCache } from "@/app/lib/clientCache/clientCache";

const AUTH_CACHE_KEY = "auth-user";
const AUTH_CACHE_OWNER = "auth"; // no se conoce el uid antes de leer; /api/auth/me corrige o borra al llegar
const AUTH_CACHE_MAX_AGE = 7 * 24 * 60 * 60_000;

export interface AuthProviderProps {
  user: User | null;
  children: React.ReactNode;
}

export const AuthProvider: React.FunctionComponent<AuthProviderProps> = ({
  user: initialUser,
  children,
}) => {
  const [user, setUser] = React.useState<User | null>(initialUser);
  const [isHydrating, setIsHydrating] = React.useState(true);
  const hasHydratedOnceRef = React.useRef(false);

  const refreshUser = React.useCallback(async () => {
    const shouldShowSkeleton = !hasHydratedOnceRef.current;

    if (shouldShowSkeleton) {
      setIsHydrating(true);
    }

    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) return;

      const data: { user: User | null; customToken?: string } =
        await response.json();
      setUser(data.user ?? null);
      if (data.user) void writeCache(AUTH_CACHE_KEY, AUTH_CACHE_OWNER, data.user);
      else void clearClientCache(); // sin sesión: ni rastro de la persona anterior (también barre escrituras tardías)

      if (data.customToken) {
        await signInWithCustomToken(getFirebaseAuth(), data.customToken);
      }
    } catch {
      // Swallow network errors to avoid breaking UI hydration.
    } finally {
      if (shouldShowSkeleton) {
        hasHydratedOnceRef.current = true;
        setIsHydrating(false);
      }
    }
  }, []);

  // Navbar y perfil salen ya con la última sesión conocida; /api/auth/me la confirma o la corrige enseguida.
  React.useEffect(() => {
    if (initialUser) return;
    let cancelled = false;
    void readCache<User>(AUTH_CACHE_KEY, AUTH_CACHE_OWNER, AUTH_CACHE_MAX_AGE).then((hit) => {
      // Si /api/auth/me ya respondió, esa respuesta manda.
      if (cancelled || !hit || hasHydratedOnceRef.current) return;
      setUser(hit.data);
      hasHydratedOnceRef.current = true;
      setIsHydrating(false);
    });
    return () => {
      cancelled = true;
    };
  }, [initialUser]);

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
