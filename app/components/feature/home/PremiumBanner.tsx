import Link from "@/app/components/ui/navigation/IntentLink"
import { Check } from "lucide-react";
import { FOUNDER_LIMIT, FOUNDER_MONTHS, PREMIUM_PRICE_COP, formatCOP } from "@/presentation/profile/lib/membership";

const PERKS = ["Funciones en varias fechas", "Control de asistencia", "Estadísticas de cada evento"];

/** Pase Premium en forma de boleta: talón vinotinto con el precio y la oferta de fundador, perforado, y a un lado lo que incluye. */
export function PremiumBanner() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card sm:flex-row">
      {/* Talón: la perforación es horizontal en móvil y vertical desde sm */}
      <div className="flex items-start justify-between gap-3 border-b-[3px] border-dashed border-white bg-primary-dark px-4.5 pb-5 pt-4.5 text-white sm:flex-1 sm:basis-55 sm:flex-col sm:justify-start sm:gap-0 sm:border-b-0 sm:border-r-[3px] sm:p-7">
        <div>
          <p className="text-sm text-white/85 sm:text-base">Pase Premium</p>
          <p className="mt-1 whitespace-nowrap font-heading text-[2.5rem] font-extrabold leading-none sm:mt-1.5 sm:text-5xl">{formatCOP(PREMIUM_PRICE_COP)}</p>
          <p className="mt-0.5 text-sm text-white/85 sm:mb-4 sm:text-base">al mes</p>
        </div>
        <span className="shrink rounded-full bg-brand-gold px-3 py-1.5 text-center text-[0.8125rem] font-semibold text-wine sm:self-start sm:px-3.5 sm:py-1.75 sm:text-sm">Fundadores: {FOUNDER_MONTHS} meses gratis</span>
      </div>
      <div className="p-4.5 sm:flex-2 sm:basis-80 sm:p-7">
        <h2 className="font-heading text-[1.3125rem] font-bold leading-tight sm:text-[1.625rem]">¿Organizas eventos? Pásate a Premium.</h2>
        <ul className="mt-3 flex flex-col gap-2.5 sm:mt-3.5">
          {PERKS.map((t) => (
            <li key={t} className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4.5 shrink-0 text-primary-dark" strokeWidth={2.6} aria-hidden />
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-3 sm:mt-4.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
          <p className="order-first text-[0.8125rem] text-amber-ink sm:order-last sm:text-sm">Los primeros {FOUNDER_LIMIT} creadores tienen {FOUNDER_MONTHS} meses gratis.</p>
          <Link href="/premium" className="flex min-h-12 items-center justify-center rounded-full bg-primary-dark px-6 font-semibold text-white outline-none transition-colors hover:bg-wine focus-visible:ring-3 focus-visible:ring-ring/50">
            Conocer Premium
          </Link>
        </div>
      </div>
    </div>
  );
}
