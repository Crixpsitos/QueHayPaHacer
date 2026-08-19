"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Home, LayoutDashboard, LogOut, MapPin, Settings, User as UserIcon } from "lucide-react";

import { logoutAction } from "@/app/actions/auth/logout.action";
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

  const accountTypeLabel = user?.profile?.accountType
    ? user.profile.accountType.toLowerCase().replace(/_/g, " ")
    : "Cuenta personal";

  const displayName = user?.displayName ?? user?.profile?.username ?? "Tu cuenta";

  // El acceso al Estudio del Organizador es solo para cuentas profesionales.
  const isProfessional = user?.customClaims?.role === "professional";

  const handleLogout = async () => {
    setUser(null);
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
              {user?.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
              <AvatarFallback>
                {user?.displayName?.[0]?.toUpperCase() ?? (
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
              {user?.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
              <AvatarFallback>
                {user?.displayName?.[0]?.toUpperCase() ?? (
                  <UserIcon className="size-3.5" aria-hidden="true" />
                )}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-28 truncate text-sm sm:inline">{displayName}</span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
        <DropdownMenuLabel className="pb-2 font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="truncate font-semibold text-foreground">
              {user?.profile?.username ? `@${user.profile.username}` : displayName}
            </span>
            <span className="truncate text-xs capitalize text-muted-foreground">
              {accountTypeLabel}
            </span>
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
              <Link href="/login">Iniciar sesion</Link>
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
              <Link href="/sites" className={cn("flex items-center gap-2")}>
                <MapPin className="size-4" aria-hidden="true" />
                Mis sitios
              </Link>
            </DropdownMenuItem>
            {isProfessional && (
              <DropdownMenuItem asChild>
                <Link href="/studio" className={cn("flex items-center gap-2")}>
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  Ir a estudio
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
