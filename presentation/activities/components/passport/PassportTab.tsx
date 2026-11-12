"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Stamp } from "lucide-react"
import { getMyPassportAction, type PassportView } from "@/app/actions/activities/stamp.action"

/** Pestaña «Pasaporte» de Mis planes: un sello por cada actividad donde escaneaste el QR del local. */
export function PassportTab() {
  const [p, setP] = useState<PassportView | null | undefined>(undefined)
  useEffect(() => { let on = true; void getMyPassportAction().then((r) => { if (on) setP(r) }); return () => { on = false } }, [])
  if (p === undefined) return <div className="h-32 animate-pulse rounded-3xl bg-muted" aria-hidden />
  if (!p || !p.stamps.length) return (
    <div className="grid justify-items-start gap-2 rounded-3xl border border-border bg-card p-5">
      <h2 className="font-semibold">Tu pasaporte está vacío</h2>
      <p className="text-sm text-muted-foreground">Cuando escanees el QR de una actividad en el local, recibes su sello. Con {p?.goal ?? 3} sellos distintos ganas la insignia «Pasaporte de Ibagué».</p>
    </div>
  )
  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold text-primary-dark">{p.stamps.length} {p.stamps.length === 1 ? "sello" : "sellos"}{p.stamps.length < p.goal ? ` · te faltan ${p.goal - p.stamps.length} para la insignia` : " · insignia ganada"}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {p.stamps.map((s) => (
          <li key={s.slug}>
            <Link href={`/actividades/${s.slug}`} className="grid h-full content-start justify-items-center gap-2 rounded-3xl border-2 border-dashed border-primary-dark/40 bg-card p-4 text-center outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/40">
              <span className="grid size-12 place-items-center rounded-full bg-primary-dark text-white"><Stamp className="size-6" aria-hidden /></span>
              <span className="font-heading text-sm font-bold leading-snug">{s.title}</span>
              <span className="text-xs text-muted-foreground">{s.date}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
