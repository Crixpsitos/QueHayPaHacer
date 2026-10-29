"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { SPRING_SNAPPY } from "@/app/components/motion/primitives";
import { cn } from "@/app/lib/utils/cn";
import { dateParts } from "./format";

/** Botón principal (crimson): solo para la acción de la página. */
export const ctaClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D42F3C] px-6 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#C92F3B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42F3C] focus-visible:ring-offset-2 active:scale-[0.98] active:bg-[#9B0A26] motion-reduce:transition-none motion-reduce:active:scale-100";

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

/** Estado "inscrito": si acaba de ocurrir (`animateIn`) entra con un resorte suave; si ya venía así, aparece quieto. */
export function RegisteredChip({ children, animateIn }: { children: ReactNode; animateIn: boolean }) {
  const still = useReducedMotion();
  const enter = animateIn && !still;
  return (
    <motion.p
      initial={enter ? { opacity: 0, scale: 0.94 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING_SNAPPY}
      className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
    >
      <motion.span
        className="shrink-0"
        initial={enter ? { scale: 0 } : false}
        animate={{ scale: 1 }}
        transition={{ ...SPRING_SNAPPY, delay: enter ? 0.12 : 0 }}
      >
        <CheckCircle2 className="size-5" aria-hidden="true" />
      </motion.span>
      {children}
    </motion.p>
  );
}

/**
 * Barra fija inferior en móvil con precio + acción principal. Entra deslizándose
 * solo cuando el CTA de la boleta (`#watchId`) no está en pantalla, para no duplicarlo.
 */
export function MobileCtaBar({ price, sub, children, watchId = "ticket-cta" }: { price: string; sub?: string; children: ReactNode; watchId?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById(watchId);
    // Sin CTA que observar, la barra se muestra siempre.
    if (!el) {
      const t = setTimeout(() => setShow(true));
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [watchId]);

  return (
    <div
      inert={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[#E4E4E7] bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 ease-out motion-reduce:transition-none lg:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
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
