"use client"

import { useEffect, useState } from "react"
import { Tag } from "lucide-react"
import { isPromoCurrent, isPromoLive } from "@/domain/entities/activities/value-objects/Promotion"
import type { ActivityPublicView } from "@/presentation/activities/lib/publicView"

type Promo = ActivityPublicView["promotions"][number]
const until = (iso: string) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`))

/**
 * Promociones vigentes. La ficha se cachea por horas, así que la vigencia se vuelve a comprobar en el navegador:
 * una promoción vencida NUNCA se muestra. «Ahora» se marca solo si aplica en este día y franja horaria.
 */
export function PromoCards({ promotions, title = "Promociones", activityTitle }: { promotions: Promo[]; title?: string; activityTitle?: string }) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { const t = setTimeout(() => setNow(new Date()), 0); return () => clearTimeout(t) }, [])
  const live = now ? promotions.filter((p) => isPromoCurrent(p.promo, now)) : promotions
  if (!live.length) return null
  return (
    <section aria-labelledby="promos" className="grid gap-3">
      <h2 id="promos" className="font-heading text-2xl font-extrabold tracking-tight">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {live.map((p) => (
          <li key={p.id} className="grid content-start gap-2 rounded-3xl border border-[#F6DDA0] bg-accent p-5">
            <div className="flex items-center gap-2"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-dark text-white"><Tag className="size-4" aria-hidden /></span><span className="font-heading text-lg font-bold leading-snug">{p.title}</span></div>
            <p className="font-semibold text-primary-dark">{p.rule}{now && isPromoLive(p.promo, now) ? <span className="ml-2 rounded-full bg-primary-dark px-2.5 py-0.5 text-xs font-bold text-white">Ahora</span> : null}</p>
            {activityTitle ? <p className="text-sm text-muted-foreground">En {activityTitle}</p> : null}
            {p.description ? <p className="text-sm leading-relaxed">{p.description}</p> : null}
            <p className="text-sm font-medium text-[#7a5200]">{p.label} · hasta el {until(p.validUntil)}</p>
            {p.termsNote ? <p className="text-xs text-muted-foreground">{p.termsNote}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
