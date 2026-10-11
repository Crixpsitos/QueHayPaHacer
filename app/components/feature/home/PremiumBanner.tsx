import Link from "next/link";
import { Section } from "@/app/components/layout/shared/Section";
import { Orbs } from "@/app/components/feature/premium/motion";
import { FOUNDER_LIMIT, FOUNDER_MONTHS, PREMIUM_PRICE_COP, formatCOP } from "@/presentation/profile/lib/membership";

/** Franja de Premium en el home: talón de boleta con el precio + oferta de fundador. */
export function PremiumBanner() {
  return (
    <Section spacing="sm">
      <div className="relative isolate overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white sm:flex">
        <Orbs variant="banner" interactive={false} />
        <div className="relative bg-[#09090B] px-6 py-6 text-white sm:w-64 sm:shrink-0 sm:py-8">
          <p className="text-sm text-white/60">Pase Premium</p>
          <p className="mt-2 font-heading text-4xl font-bold tracking-tight tabular-nums">{formatCOP(PREMIUM_PRICE_COP)}</p>
          <p className="text-sm text-white/70">al mes</p>
          {/* Perforación vertical (desktop) / horizontal (móvil) */}
          <span aria-hidden className="absolute inset-x-6 bottom-0 border-t-[3px] border-dashed border-white sm:inset-x-auto sm:inset-y-6 sm:bottom-auto sm:right-0 sm:border-t-0 sm:border-r-[3px]" />
        </div>
        <div className="relative flex flex-1 flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="max-w-xl">
            <h2 className="font-heading text-xl font-semibold text-[#09090B] sm:text-2xl">
              ¿Organizas eventos? Pásate a Premium.
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#52525B]">
              Funciones en varias fechas, control de asistencia y estadísticas de cada evento. Los primeros{" "}
              {FOUNDER_LIMIT} creadores tienen {FOUNDER_MONTHS} meses gratis.
            </p>
          </div>
          <Link
            href="/premium"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#E63946] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#C92F3B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2"
          >
            Conocer Premium
          </Link>
        </div>
      </div>
    </Section>
  );
}
