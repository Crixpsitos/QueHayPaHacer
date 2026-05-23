"use client";

import Link from "next/link";
import { Menu, Plus, X } from "lucide-react";
import { NavLink } from "../../ui/navigation/NavLink";
import { Button } from "../../ui/button/button";
import { NavbarAccountMenu } from "./NavbarAccountMenu";
import { Container } from "../shared/Container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { useAuth } from "@/app/store/auth/AuthContext";
import { useModalStore } from "@/app/store/modal/modal.store";
import { LoginForm } from "../../feature/auth/LoginForm";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth/login.action";
import { loginModalAction } from "@/app/actions/auth/login-modal.action";

interface ToastState {
  message: string;
  type: "error" | "info";
}

export const Navbar = () => {
  const { user, refreshUser } = useAuth();
  const { closeModal, openModal } = useModalStore();
  const router = useRouter();

  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast = (message: string, type: ToastState["type"] = "info") => {
    setToast({ message, type });
  };

  const routes = [
    { name: "Inicio", href: "/" },
    { name: "Eventos", href: "/events" },
    { name: "Donde parchar?", href: "/where-to-party" },
    { name: "Contactanos", href: "/contact" },
  ];

  const handleLoginSuccess = async () => {
    try {
      await refreshUser();

      closeModal();

      startTransition(() => {
        router.push("/events/create");
      });
    } catch {
      showToast("No se pudo completar el inicio de sesion.", "error");
    }
  };

  const handleLoginError = (message: string) => {
    showToast(message, "error");
  };


  const openLoginModal = () => {
    openModal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-3 top-3 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Cerrar modal"
            >
              <X className="size-4" />
            </button>

            <h3 className="mb-1 text-xl font-semibold">Inicia sesion para dar like</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Necesitamos autenticar tu cuenta para guardar tu interaccion.
            </p>

            <LoginForm
              loginAction={loginModalAction}
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
            />
          </div>
        </div>
    );
  };

  return (
    <header className="border-b border-zinc-200 bg-background/95 text-foreground backdrop-blur dark:border-zinc-800">
      <Container
        as="nav"
        aria-label="Principal"
        className="text-sm font-medium"
      >
        <div className="flex h-16 items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr]">
          <div className="justify-self-start">
            <Link
              href="/"
              aria-label="Ir al inicio"
              className="font-semibold tracking-tight text-zinc-800 transition-colors hover:text-zinc-950 dark:text-zinc-100 dark:hover:text-white"
            >
              Que Hay Pa Hacer?
            </Link>
          </div>

          <ul
            className="hidden items-center justify-self-center gap-1 md:flex"
            role="list"
          >
            {routes.map((route) => (
              <li key={route.name}>
                <NavLink
                  href={route.href}
                  className="rounded-full px-3 py-2 text-zinc-600 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-100"
                  activeClassName="bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {route.name}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-self-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="md:hidden"
                  aria-label="Abrir menu de navegacion"
                >
                  <Menu className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-56 md:hidden"
              >
                {routes.map((route) => (
                  <DropdownMenuItem asChild key={route.name}>
                    <Link href={route.href}>{route.name}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="bg-zinc-900 text-white focus:bg-zinc-700 focus:text-white dark:bg-zinc-100 dark:text-zinc-900 dark:focus:bg-zinc-300 dark:focus:text-zinc-900"
                >
                  <Link href="/events/create" className="font-semibold">
                    Crear tu evento
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <Button
                asChild
                variant="outline"
                className="hidden! border-transparent bg-zinc-900 text-white shadow-sm hover:bg-zinc-700 hover:text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 md:inline-flex!"
              >
                <Link
                  href="/events/create"
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Crear tu evento
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="hidden! border-transparent bg-zinc-900 text-white shadow-sm hover:bg-zinc-700 hover:text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 md:inline-flex!"
                onClick={openLoginModal}
              >
                <Plus className="size-4" aria-hidden="true" />
                Crear tu evento
              </Button>
            )}

            <NavbarAccountMenu />
          </div>
        </div>
      </Container>
    </header>
  );
};
