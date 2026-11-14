"use client";

import Link from "@/app/components/ui/navigation/IntentLink"
import { CalendarPlus, MapPin, X } from "lucide-react";
import { useAuth } from "@/app/store/auth/AuthContext";
import { useModalStore } from "@/app/store/modal/modal.store";
import { LoginForm } from "@/app/components/feature/auth/LoginForm";
import { loginModalAction } from "@/app/actions/auth/login-modal.action";

export function ContributionBanner() {
  const { user, refreshUser, isHydrating } = useAuth();
  const { closeModal, openModal } = useModalStore();

  const openLoginModal = (destination: string) => {
    openModal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="relative w-full max-w-md rounded-xl bg-background p-6 text-foreground shadow-xl">
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-3 top-3 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Cerrar modal"
          >
            <X className="size-4" />
          </button>
          <h3 className="mb-1 text-xl font-semibold">Inicia sesión para continuar</h3>
          <p className="mb-5 text-sm text-muted-foreground">
            Accede a tu cuenta para crear un evento o proponer un sitio.
          </p>
          <LoginForm
            loginAction={loginModalAction}
            redirectTo={destination}
            onSuccess={async () => {
              await refreshUser();
              closeModal();
            }}
          />
        </div>
      </div>,
    );
  };

  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-wine p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8">
        <div className="max-w-xl">
          <h2 className="font-heading text-[1.375rem] font-bold leading-tight sm:text-3xl">
            ¿Conoces un plan o un lugar que todos deberían descubrir?
          </h2>
          <p className="mt-2 text-sm text-white/85 sm:mt-2.5 sm:text-base">
            Crea un evento o propón un sitio para que más gente lo encuentre aquí.
          </p>
        </div>
        <div className="flex gap-2 sm:shrink-0 sm:gap-2.5">
          {user ? (
            <Link href="/eventos/create" className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-gold px-6 font-semibold text-wine outline-none transition-colors hover:bg-brand-gold-dark focus-visible:ring-3 focus-visible:ring-white/70 sm:flex-none">
              <CalendarPlus className="size-4" aria-hidden />
              Crear evento
            </Link>
          ) : (
            <button type="button" disabled={isHydrating} onClick={() => openLoginModal("/eventos/create")} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-gold px-6 font-semibold text-wine outline-none transition-colors hover:bg-brand-gold-dark focus-visible:ring-3 focus-visible:ring-white/70 disabled:opacity-60 sm:flex-none">
              <CalendarPlus className="size-4" aria-hidden />
              Crear evento
            </button>
          )}
          {user ? (
            <Link href="/sites/create" className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-white px-6 font-semibold text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/70 sm:flex-none">
              <MapPin className="size-4" aria-hidden />
              Proponer sitio
            </Link>
          ) : (
            <button type="button" disabled={isHydrating} onClick={() => openLoginModal("/sites/create")} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-white px-6 font-semibold text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/70 disabled:opacity-60 sm:flex-none">
              <MapPin className="size-4" aria-hidden />
              Proponer sitio
            </button>
          )}
        </div>
    </div>
  );
}
