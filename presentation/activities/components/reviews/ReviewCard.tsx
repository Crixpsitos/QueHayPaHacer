"use client"

import Image from "next/image"
import { MessageCircle } from "lucide-react"
import { cn } from "@/app/lib/utils/cn"
import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"
import type { ReviewView } from "@/presentation/activities/lib/reviewView"
import { Stars } from "./Stars"

const TILT = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"]

/** Polaroid: foto (o el color de la categoría), nombre, estrellas y una frase. Toda la tarjeta abre la historia. */
export function ReviewCard({ r, i, categorySlug, onOpen }: { r: ReviewView; i: number; categorySlug: string; onOpen: () => void }) {
  const c = categoryStyle(categorySlug)
  return (
    <li className="w-44 shrink-0 snap-start sm:w-auto">
      <button type="button" onClick={onOpen} aria-label={`Leer la reseña de ${r.name}`} className={cn("grid w-full gap-2 rounded-md border border-border bg-card p-2.5 pb-3.5 text-left shadow-card outline-none transition-transform hover:rotate-0 focus-visible:rotate-0 focus-visible:ring-3 focus-visible:ring-ring/40 motion-reduce:transition-none motion-reduce:rotate-0", TILT[i % TILT.length])}>
        <span className="relative grid aspect-square place-items-center overflow-hidden rounded-sm" style={{ background: c.bg, color: c.ink }}>
          {r.photos[0] ? <Image src={r.photos[0].url} alt={r.photos[0].alt || `Foto de ${r.name}`} fill sizes="12rem" className="object-cover" /> : <c.Icon className="size-10 opacity-60" aria-hidden />}
          {r.inVerification ? <span className="absolute inset-x-0 bottom-0 bg-accent px-2 py-1 text-xs font-semibold text-[#7a5200]">En verificación</span> : null}
        </span>
        <span className="flex items-center gap-1.5 font-heading text-sm font-bold">{r.name}{r.verifiedByQhpa ? <span className="rounded-full bg-primary-dark px-2 py-0.5 text-[0.6875rem] font-semibold text-white">Verificada</span> : null}</span>
        <Stars value={r.rating} />
        <span className="line-clamp-2 text-sm leading-snug text-muted-foreground">{r.title || r.body || `Fue en ${r.visitedLabel}`}</span>
        {r.reply ? <span className="flex items-center gap-1 text-xs font-semibold text-primary-dark"><MessageCircle className="size-3.5" aria-hidden />Respondió quien organiza</span> : null}
      </button>
    </li>
  )
}
