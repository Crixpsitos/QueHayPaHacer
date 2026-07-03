"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/app/store/auth/AuthContext";
import { logoutAction } from "@/app/actions/auth/logout.action";

/**
 * Acciones del navbar del layout de `/profile`: acceso al Estudio (solo cuentas
 * profesionales) y cierre de sesión. Va junto a "Inicio" y el centro de ajustes.
 */
export function ProfileNavActions() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const isProfessional = user?.customClaims?.role === "professional";

  const handleLogout = async () => {
    setUser(null);
    await logoutAction();
    router.refresh();
  };

  return (
    <>
      {isProfessional && (
        <Link
          href="/studio"
          aria-label="Ir al Estudio del Organizador"
          className="inline-flex h-9 items-center gap-2 rounded-full bg-indigo-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <LayoutDashboard className="size-4 shrink-0" />
          <span className="hidden sm:inline">Ir a estudio</span>
        </Link>
      )}

      <button
        type="button"
        onClick={handleLogout}
        aria-label="Cerrar sesión"
        className="inline-flex h-9 items-center gap-2 rounded-full px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
      >
        <LogOut className="size-5 shrink-0" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>
    </>
  );
}
