"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CalendarDays, ChevronDown, Home, LayoutDashboard, LogOut, MailPlus, MapPin, Settings, Sparkles, Ticket, User as UserIcon } from "lucide-react";

import { hasTeamEventsAction } from "@/app/actions/studio/get-my-team-access.action";
import { getPendingInvitationsCountAction } from "@/app/actions/studio/get-pending-invitations-count.action";
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

function InviteDot() {
  return <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-[#E63946]" />;
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
  const [rawPending, setPendingInvites] = useState(0);
  const uid = user?.uid;
  const [rawHasTeam, setHasTeam] = useState(false);
  const isPremiumPlan = user?.profile?.plan === "premium";
  const hasTeamEvents = uid && !isPremiumPlan ? rawHasTeam : false;
  const pendingInvites = uid ? rawPending : 0; // logout oculta el punto sin setState en efecto

  // Conteo cacheado en servidor por usuario (ver la action); se refresca al abrir el menú.
  const refreshInvites = () => {
    void getPendingInvitationsCountAction().then(setPendingInvites).catch(() => {});
    // Sin Premium propio: el acceso a "Eventos del equipo" depende de ser miembro de algún evento.
    if (!isPremiumPlan) void hasTeamEventsAction().then(setHasTeam).catch(() => {});
  };
  useEffect(() => {
    if (uid) refreshInvites();
  }, [uid]);

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
    <DropdownMenu onOpenChange={(open) => open && uid && refreshInvites()}>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button
            variant="outline"
            aria-label="Abrir menu de cuenta"
            className="relative size-11 justify-center rounded-full border-border bg-background/95 p-0 shadow-md backdrop-blur"
          >
            {pendingInvites > 0 && <InviteDot />}
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
            className="relative h-9 gap-1.5 pl-1.5 pr-2"
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
            {pendingInvites > 0 && <InviteDot />}
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
              <Link href="/mis-invitaciones" className={cn("flex items-center gap-2")}>
                <MailPlus className="size-4" aria-hidden="true" />
                Mis invitaciones
                {pendingInvites > 0 && (
                  <span className="ml-auto rounded-full bg-[#E63946] px-1.5 text-xs font-semibold text-white">
                    <span className="sr-only">{pendingInvites} pendientes: </span>
                    {pendingInvites}
                  </span>
                )}
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
              <>
              {hasTeamEvents && (
                <DropdownMenuItem asChild>
                  <Link href="/studio/events" className={cn("flex items-center gap-2")}>
                    <LayoutDashboard className="size-4" aria-hidden="true" />
                    Eventos del equipo
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/premium" className={cn("flex items-center gap-2 font-medium text-primary")}>
                  <Sparkles className="size-4" aria-hidden="true" />
                  Mejorar a Premium
                </Link>
              </DropdownMenuItem>
              </>
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
