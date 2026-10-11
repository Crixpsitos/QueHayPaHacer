import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils/cn";
import { dateParts } from "./format";

/** Botón principal (crimson): solo para la acción de la página. */
export const ctaClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E63946] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#C92F3B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2 active:bg-[#9B0A26]";

/**
 * La boleta: talón oscuro con la fecha, perforación y cuerpo con precio y
 * acción. Es el único elemento "fuerte" del detalle.
 */
export function Ticket({ stub, children, className }: { stub: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-[#E4E4E7] bg-white shadow-card", className)}>
      <div className="relative bg-[#09090B] px-6 pb-7 pt-6 text-white">
        {stub}
        {/* Perforación: agujeros del color del lienzo en el borde + dos medias
            lunas que el overflow-hidden de la boleta corta por la mitad. */}
        <span aria-hidden="true" className="absolute inset-x-6 bottom-0 border-t-[3px] border-dashed border-[#FAFAFC]" />
        <span aria-hidden="true" className="absolute -left-3 bottom-0 z-10 size-6 translate-y-1/2 rounded-full border border-[#E4E4E7] bg-[#FAFAFC]" />
        <span aria-hidden="true" className="absolute -right-3 bottom-0 z-10 size-6 translate-y-1/2 rounded-full border border-[#E4E4E7] bg-[#FAFAFC]" />
      </div>
      <div className="space-y-5 px-6 pb-6 pt-6">{children}</div>
    </div>
  );
}

/** Bloque de fecha grande del talón: "10" + "sábado / octubre 2026". */
export function DateBlock({ date }: { date: string }) {
  const p = dateParts(date);
  return (
    <div className="flex items-end gap-3">
      <span className="font-heading text-7xl font-bold leading-[0.8] tracking-tighter tabular-nums">{p.day}</span>
      <span className="pb-0.5 text-sm leading-tight">
        <span className="block capitalize text-white/60">{p.weekday}</span>
        <span className="block font-medium">
          {p.month} {p.year}
        </span>
      </span>
    </div>
  );
}

/** Barra fija inferior en móvil con precio + acción principal. */
export function MobileCtaBar({ price, sub, children }: { price: string; sub?: string; children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E4E4E7] bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-4">
        <div className="min-w-0">
          <p className="font-heading text-lg font-semibold leading-tight text-[#09090B] tabular-nums">{price}</p>
          {sub && <p className="truncate text-xs text-[#71717A]">{sub}</p>}
        </div>
        <div className="ml-auto w-44 shrink-0">{children}</div>
      </div>
    </div>
  );
}
