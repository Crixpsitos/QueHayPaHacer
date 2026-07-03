"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, UserRound, ChevronRight, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useAuth } from "@/app/store/auth/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { logoutAction } from "@/app/actions/auth/logout.action";
import { getActiveSectionLabel } from "../lib/navigation";

interface StudioHeaderProps {
  displayName: string;
  email?: string;
  photoURL?: string;
}

export function StudioHeader({ displayName, email, photoURL }: StudioHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setUser } = useAuth();
  const section = getActiveSectionLabel(pathname);
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    setUser(null);
    await logoutAction();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/studio" className="shrink-0 text-base font-bold tracking-tight text-slate-900">
          QueHayPaHacer
        </Link>
        <span className="hidden items-center gap-1.5 text-sm text-slate-400 sm:flex">
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-slate-600">Estudio</span>
          <ChevronRight className="h-4 w-4" />
          <span className="truncate font-medium text-slate-900">{section}</span>
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/"
          className="hidden h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-gray-100 hover:text-slate-900 sm:inline-flex"
        >
          <Home className="h-4 w-4" />
          Inicio
        </Link>
        <Link
          href="/profile"
          className="hidden h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-gray-100 hover:text-slate-900 sm:inline-flex"
        >
          <UserRound className="h-4 w-4" />
          Perfil
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-indigo-500">
            <Avatar className="h-9 w-9 border border-gray-200">
              <AvatarImage src={photoURL} alt={displayName} />
              <AvatarFallback className="bg-indigo-50 text-xs font-semibold text-indigo-700">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="truncate text-sm font-semibold text-slate-900">{displayName}</span>
              {email && <span className="truncate text-xs font-normal text-slate-400">{email}</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/" className="cursor-pointer sm:hidden">
                <Home className="mr-2 h-4 w-4" />
                Volver al inicio
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <UserRound className="mr-2 h-4 w-4" />
                Volver al perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                void handleLogout();
              }}
              className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
