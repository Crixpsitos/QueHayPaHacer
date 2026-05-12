"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, User as UserIcon } from "lucide-react";

import { logoutAction } from "@/app/actions/auth/logout.action";
import { useAuth } from "@/app/store/auth/AuthContext";
import { cn } from "@/app/lib/utils/cn";
import { Button } from "../../ui/button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

function AccountTriggerSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-9 w-9 rounded-4xl border border-border bg-background p-2 sm:w-auto sm:min-w-44 sm:px-3 sm:py-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="size-4 animate-pulse rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <div className="hidden min-w-0 sm:block">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-300 dark:bg-zinc-700" />
            <div className="mt-1 h-2 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="hidden size-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 sm:block" />
      </div>
    </div>
  );
}

export function NavbarAccountMenu() {
  const router = useRouter();
  const { user, isHydrating, setUser } = useAuth();

  if (isHydrating) {
    return <AccountTriggerSkeleton />;
  }

  const accountTypeLabel = user?.profile?.accountType
    ? user.profile.accountType.toLowerCase().replace(/_/g, " ")
    : "Cuenta personal";

  const handleLogout = async () => {
    setUser(null);
    await logoutAction();
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {!user ? (
          <Button
            variant="outline"
            aria-label="Abrir menu de cuenta"
            className="h-9 w-9 justify-center p-0 sm:w-auto sm:min-w-44 sm:justify-between sm:gap-2 sm:px-3"
          >
            <span className="flex items-center gap-2">
              <UserIcon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cuenta</span>
            </span>
            <ChevronDown className="hidden size-4 opacity-60 sm:inline" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="outline"
            aria-label="Abrir menu de cuenta"
            className="h-9 w-9 justify-center p-0 sm:w-auto sm:min-w-44 sm:justify-between sm:gap-2 sm:px-3"
          >
            <span className="flex min-w-0 items-center gap-2">
              <UserIcon className="size-4 shrink-0" aria-hidden="true" />
              <span className="hidden min-w-0 text-left leading-[1.05] sm:block">
                <span className="block truncate text-[12px] font-semibold">
                  {user.displayName ?? user.profile?.username ?? "Tu cuenta"}
                </span>
                <span className="block truncate text-[10px] font-normal text-zinc-500 dark:text-zinc-400">
                  {accountTypeLabel}
                </span>
              </span>
            </span>
            <ChevronDown className="hidden size-4 shrink-0 opacity-60 sm:inline" aria-hidden="true" />
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">
          {user?.profile?.username ? `@${user.profile.username}` : "Cuenta"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

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
              <Link href="/profile">Mi perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/my-events">Mis eventos</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Configuracion</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={handleLogout}>
              <DropdownMenuItem asChild variant="destructive">
                <button type="submit" className={cn("w-full text-left")}>Cerrar sesion</button>
              </DropdownMenuItem>
            </form>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
