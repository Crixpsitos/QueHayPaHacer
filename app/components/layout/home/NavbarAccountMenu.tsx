"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, CalendarDays, ChevronDown, Home, LayoutDashboard, LogOut, MapPin, Settings, Sparkles, Ticket, User as UserIcon } from "lucide-react";

import { logoutAction } from "@/app/actions/auth/logout.action";
import { createClientContainer } from "@/infraestructure/di/container.client";
import { useAuth } from "@/app/store/auth/AuthContext";
import { cn } from "@/app/lib/utils/cn";
import { Button } from "../../ui/button/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

function AccountTriggerSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div
        aria-hidden="true"
        className="size-11 animate-pulse rounded-full border border-border bg-background/95 shadow-md"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="h-9 w-32 animate-pulse rounded-4xl border border-border bg-background"
    />
  );
}

export function NavbarAccountMenu({
  compact = false,
  showHome = false,
}: {
  compact?: boolean;
  showHome?: boolean;
} = {}) {
  const router = useRouter();
  const { user, isHydrating, setUser } = useAuth();

  if (isHydrating) {
    return <AccountTriggerSkeleton compact={compact} />;
  }

  const isPremium = user?.profile?.plan === "premium";
  const isCreatorVerified = user?.profile?.creatorVerified === true;
  const participationLabel = user?.profile?.participation === "creator"
    ? "Creador"
    : "Consumidor";
  const planLabel = isPremium ? "Premium" : "Básico";
  const fullName = `${user?.profile?.firstName ?? ""} ${user?.profile?.lastName ?? ""}`.trim();
  const username = user?.profile?.username ?? user?.displayName;
  const displayName = fullName || user?.displayName || username || "Tu cuenta";
  const avatarUrl = user?.profile?.photoURL ?? user?.photoURL;
  const avatarFallback = displayName[0]?.toUpperCase();

  const handleLogout = async () => {
    setUser(null);
    // Cerrar también la sesión del SDK cliente; si no, onIdTokenChanged puede restaurar la cookie.
    await createClientContainer().authService.logout().catch(() => {});
    await logoutAction();
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button
            variant="outline"
            aria-label="Abrir menu de cuenta"
            className="size-11 justify-center rounded-full border-border bg-background/95 p-0 shadow-md backdrop-blur"
          >
            <Avatar className="size-9">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={`Foto de perfil de ${displayName}`} /> : null}
              <AvatarFallback>
                {avatarFallback ?? (
                  <UserIcon className="size-5" aria-hidden="true" />
                )}
              </AvatarFallback>
            </Avatar>
          </Button>
        ) : !user ? (
          <Button
            variant="outline"
            aria-label="Abrir menu de cuenta"
            className="h-9 gap-2 px-3"
          >
            <UserIcon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Cuenta</span>
            <ChevronDown className="hidden size-3.5 text-muted-foreground sm:inline" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="outline"
            aria-label="Abrir menu de cuenta"
            className="h-9 gap-1.5 pl-1.5 pr-2"
          >
            <Avatar size="sm">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={`Foto de perfil de ${displayName}`} /> : null}
              <AvatarFallback>
                {avatarFallback ?? (
                  <UserIcon className="size-3.5" aria-hidden="true" />
                )}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-28 truncate text-sm sm:inline">
              {username ? `@${username}` : displayName}
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
        <DropdownMenuLabel className="pb-2 font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="truncate font-semibold text-foreground">
              {displayName}
            </span>
            {username && (
              <span className="truncate text-xs text-muted-foreground">
                @{username}
              </span>
            )}
            <span className="mt-1 truncate text-xs text-muted-foreground">
              {participationLabel} · {planLabel}
            </span>
            {isCreatorVerified && (
              <span className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                Creador verificado por QHPA
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {showHome && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/" className={cn("flex items-center gap-2")}>
                <Home className="size-4" aria-hidden="true" />
                Volver al inicio
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {!user && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/login">Iniciar sesión</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/register">Crear cuenta</Link>
            </DropdownMenuItem>
          </>
        )}

        {user && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/profile" className={cn("flex items-center gap-2")}>
                <UserIcon className="size-4" aria-hidden="true" />
                Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/mis-eventos" className={cn("flex items-center gap-2")}>
                <CalendarDays className="size-4" aria-hidden="true" />
                Mis eventos
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/mis-inscripciones" className={cn("flex items-center gap-2")}>
                <Ticket className="size-4" aria-hidden="true" />
                Mis inscripciones
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/sites" className={cn("flex items-center gap-2")}>
                <MapPin className="size-4" aria-hidden="true" />
                Mis sitios
              </Link>
            </DropdownMenuItem>
            {isPremium ? (
              <DropdownMenuItem asChild>
                <Link href="/studio" className={cn("flex items-center gap-2")}>
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  Ir a estudio
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/premium" className={cn("flex items-center gap-2 font-medium text-primary")}>
                  <Sparkles className="size-4" aria-hidden="true" />
                  Mejorar a Premium
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile?ajustes=1" className={cn("flex items-center gap-2")}>
                <Settings className="size-4" aria-hidden="true" />
                Ajustes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={handleLogout}>
              <DropdownMenuItem asChild variant="destructive">
                <button type="submit" className={cn("flex w-full items-center gap-2 text-left")}>
                  <LogOut className="size-4" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </DropdownMenuItem>
            </form>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
