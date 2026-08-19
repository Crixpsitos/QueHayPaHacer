"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import {
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  Settings,
  User as UserIcon,
} from "lucide-react";

import { logoutAction } from "@/app/actions/auth/logout.action";
import { useAuth } from "@/app/store/auth/AuthContext";
import { useProfileConfigStore } from "@/app/store/profile/profileConfig.store";
import { cn } from "@/app/lib/utils/cn";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Container } from "@/app/components/layout/shared/Container";

// Deep-link ?ajustes=1 y sincroniza URL con el drawer sin causar navegación Next.js
function SettingsQuerySync() {
  const { onOpenSettings, openSettings } = useProfileConfigStore();
  const searchParams = useSearchParams();
  const skipFirstSync = useRef(true);

  // Solo en mount: abre el drawer si el deep-link ?ajustes=1 está presente
  useEffect(() => {
    if (searchParams.get("ajustes") === "1") {
      onOpenSettings(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza URL con window.history (no dispara navegación ni re-renders)
  useEffect(() => {
    if (skipFirstSync.current) {
      skipFirstSync.current = false;
      return;
    }
    const url = new URL(window.location.href);
    if (openSettings) {
      url.searchParams.set("ajustes", "1");
    } else {
      url.searchParams.delete("ajustes");
    }
    window.history.replaceState(null, "", url.pathname + (url.search || ""));
  }, [openSettings]);

  return null;
}

export function ProfileLayoutHeader() {
  const { user, isHydrating, setUser } = useAuth();
  const { onOpenSettings } = useProfileConfigStore();
  const router = useRouter();

  const isProfessional = user?.customClaims?.role === "professional";
  const isOrganizer = user?.profile?.accountType?.toLowerCase() === "organizer";

  const displayName = isOrganizer
    ? `@${user?.profile?.username ?? user?.displayName ?? "Tu cuenta"}`
    : (user?.displayName ?? user?.profile?.username ?? "Tu cuenta");

  const accountTypeLabel =
    user?.customClaims?.role === "professional"
      ? (user.profile?.accountType?.toLowerCase().replace(/_/g, " ") ?? "Cuenta profesional")
      : "Cuenta personal";

  const handleOpenSettings = () => {
    onOpenSettings(true);
  };

  const handleLogout = async () => {
    setUser(null);
    await logoutAction();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Sincroniza ?ajustes=1 — fallback null porque no tiene UI */}
      <Suspense fallback={null}>
        <SettingsQuerySync />
      </Suspense>

      <Container as="nav" aria-label="Navegación del perfil">
        <div className="flex h-14 items-center gap-4">

          {/* ── 1. IDENTIDAD ─────────────────────────────────────────── */}
          <Link
            href="/"
            aria-label="Ir al inicio"
            className="mr-auto shrink-0 rounded-sm font-bold tracking-tight text-foreground transition-colors hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Que Hay Pa Hacer
          </Link>

          {/* ── 2. CREAR ─────────────────────────────────────────────── */}
          {!isHydrating && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" aria-label="Crear evento o sitio">
                  <Plus className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Crear</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8}>
                <DropdownMenuItem asChild>
                  <Link href="/eventos/create" className={cn("flex items-center gap-2")}>
                    Crear evento
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/sites/create" className={cn("flex items-center gap-2")}>
                    Crear sitio
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* ── 3. CUENTA ────────────────────────────────────────────── */}
          {isHydrating ? (
            <Skeleton className="h-9 w-32 rounded-4xl" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Abrir menú de cuenta"
                  aria-haspopup="menu"
                  className="gap-1.5 pl-1.5 pr-2"
                >
                  <Avatar size="sm">
                    {user?.photoURL ? (
                      <AvatarImage src={user.photoURL} alt="" />
                    ) : null}
                    <AvatarFallback>
                      {user?.displayName?.[0]?.toUpperCase() ?? (
                        <UserIcon className="size-3.5" aria-hidden />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-28 truncate text-sm sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                <DropdownMenuLabel className="pb-2 font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate font-semibold text-foreground">
                      {displayName}
                    </span>
                    <span className="truncate text-xs capitalize text-muted-foreground">
                      {accountTypeLabel}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/" className={cn("flex items-center gap-2")}>
                    <Home className="size-4" aria-hidden />
                    Inicio
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/sites" className={cn("flex items-center gap-2")}>
                    <MapPin className="size-4" aria-hidden />
                    Mis sitios
                  </Link>
                </DropdownMenuItem>

                {isProfessional && (
                  <DropdownMenuItem asChild>
                    <Link href="/studio" className={cn("flex items-center gap-2")}>
                      <LayoutDashboard className="size-4" aria-hidden />
                      Ir a estudio
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onSelect={handleOpenSettings}
                  className="flex items-center gap-2"
                >
                  <Settings className="size-4" aria-hidden />
                  Ajustes
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <form action={handleLogout}>
                  <DropdownMenuItem asChild variant="destructive">
                    <button
                      type="submit"
                      className={cn("flex w-full items-center gap-2 text-left")}
                    >
                      <LogOut className="size-4" aria-hidden />
                      Cerrar sesión
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Container>
    </header>
  );
}
