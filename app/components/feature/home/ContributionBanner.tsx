"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarPlus, MapPin, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Section } from "@/app/components/layout/shared/Section";
import { useAuth } from "@/app/store/auth/AuthContext";
import { useModalStore } from "@/app/store/modal/modal.store";
import { LoginForm } from "@/app/components/feature/auth/LoginForm";
import { loginModalAction } from "@/app/actions/auth/login-modal.action";

const CONTRIBUTION_IMAGE = "/banners/home-community.jpg";

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
    <Section spacing="sm">
      <div className="relative isolate min-h-80 overflow-hidden rounded-2xl bg-zinc-950 shadow-card sm:min-h-88">
        <Image
          src={CONTRIBUTION_IMAGE}
          alt="Personas compartiendo una experiencia en la ciudad"
          fill
          sizes="(max-width: 1536px) 100vw, 1536px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/65 to-black/15" aria-hidden />
        <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" aria-hidden />

        <div className="relative flex min-h-80 max-w-2xl flex-col justify-end px-6 py-8 text-white sm:min-h-88 sm:px-10 sm:py-10 lg:px-12">
          <span className="mb-4 w-fit rounded-full border border-white/25 bg-black/25 px-3 py-1 text-xs font-semibold uppercase text-white backdrop-blur-sm">
            Comparte lo que está pasando
          </span>
          <h2 className="max-w-xl text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
            ¿Conoces un plan o un lugar que todos deberían descubrir?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            Recuérdalo: puedes crear eventos y proponer sitios para que más personas los encuentren en QHPA.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg">
              {user ? (
                <Link href="/eventos/create">
                  <CalendarPlus className="size-4" aria-hidden />
                  Crear evento
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <button type="button" disabled={isHydrating} onClick={() => openLoginModal("/eventos/create")}>
                  <CalendarPlus className="size-4" aria-hidden />
                  Crear evento
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              )}
            </Button>
            <Button asChild size="lg" className="border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              {user ? (
                <Link href="/sites/create">
                  <MapPin className="size-4" aria-hidden />
                  Proponer sitio
                </Link>
              ) : (
                <button type="button" disabled={isHydrating} onClick={() => openLoginModal("/sites/create")}>
                  <MapPin className="size-4" aria-hidden />
                  Proponer sitio
                </button>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}