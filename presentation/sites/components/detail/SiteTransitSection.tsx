"use client"

import { useEffect, useState, useSyncExternalStore, useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bus, CheckCircle2, Flag, TriangleAlert } from "lucide-react"
import { useAuth } from "@/app/store/auth/AuthContext"
import { cn } from "@/app/lib/utils/cn"
import { getSiteTransitViewAction } from "@/app/actions/site-transit/get-site-transit.action"
import { reportTransitOutdatedAction } from "@/app/actions/site-transit/report-transit-outdated.action"
import type { SiteDetail } from "../../view-models/SiteFormViewModel"
import type { SiteTransitView } from "@/domain/entities/sites/value-objects/SiteTransit"
import { timeAgoEs } from "../../lib/timeAgo"

const dateFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" })
const listFmt = new Intl.ListFormat("es", { style: "long", type: "conjunction" })

const noopSubscribe = () => () => {}
let cachedNow: number | null = null
const clientNow = () => (cachedNow ??= Date.now())

const btn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#E4E4E7] px-4 text-sm font-semibold text-[#09090B] hover:bg-[#F4F4F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#09090B] disabled:opacity-60"

/**
 * Buses que llegan al sitio. Dato declarado por el dueño (nunca verificado): siempre "Informado por el dueño · hace X"
 * y un botón "Está desactualizado". Sin dato no se muestra la sección (a los visitantes les sobra un bloque vacío).
 * "Por confirmar" (reportes o ruta cambiada) atenúa las rutas y lo dice.
 */
export function SiteTransitSection({
  view, siteId, authorId, className,
}: { view: SiteTransitView | null; siteId: string; authorId: string; className?: string }) {
  const { user, isHydrating } = useAuth()
  const pathname = usePathname()
  // El "hace X" usa la hora del cliente (null en el servidor): así el HTML del servidor y el del cliente coinciden.
  const now = useSyncExternalStore(noopSubscribe, clientNow, () => null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, startTransition] = useTransition()

  if (!view) return null
  const ago = now === null ? null : timeAgoEs(view.updatedAt, now)
  const isAuthor = !!user && user.uid === authorId

  const report = () =>
    startTransition(async () => {
      setError(null)
      const res = await reportTransitOutdatedAction(siteId)
      if (res.success || res.error === "Ya reportaste esta información.") setDone(true)
      else setError(res.error)
    })

  return (
    <section className={cn("min-w-0", className)} aria-labelledby={`transit-${siteId}`}>
      <h3 id={`transit-${siteId}`} className="flex items-center gap-2 text-sm font-semibold text-[#09090B]">
        <Bus className="size-4 text-[#E63946]" aria-hidden /> Buses
      </h3>

      {view.unconfirmed && (
        <p role="status" className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 [overflow-wrap:anywhere]">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {view.changedLabels.length > 0
              ? `${view.changedLabels.length > 1 ? "Las rutas" : "La ruta"} ${listFmt.format(view.changedLabels)} ${view.changedLabels.length > 1 ? "cambiaron" : "cambió"}; el dueño debe reconfirmar.`
              : "Por confirmar: puede estar desactualizado."}
            {view.changedLabels.length > 0 && view.byReports && " Además, varias personas avisaron que está desactualizado."}
          </span>
        </p>
      )}

      <ul className={cn("mt-2 grid gap-1.5", view.unconfirmed && "opacity-60")}>
        {view.routes.map((r) => (
          <li key={r.id} className="min-w-0 rounded-lg bg-[#F4F4F5] px-3 py-2 text-sm text-[#09090B]">
            <span className="font-medium">{r.label}</span>
            {r.note && <span className="block text-xs text-[#52525B] [overflow-wrap:anywhere]">{r.note}</span>}
          </li>
        ))}
      </ul>

      <p className="mt-2 text-xs text-[#71717A]">
        Informado por el dueño · {ago ?? dateFmt.format(view.updatedAt)}. Confirma antes de ir: las rutas pueden cambiar.
      </p>

      {!isHydrating && !isAuthor && (
        <div className="mt-2">
          {done ? (
            <p role="status" className="flex items-center gap-2 text-xs text-[#52525B]">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden /> Gracias, tomamos nota de tu aviso.
            </p>
          ) : user ? (
            <button type="button" onClick={report} disabled={busy} className={btn}>
              <Flag className="size-4" aria-hidden />
              {busy ? "Enviando…" : "Está desactualizado"}
            </button>
          ) : (
            <Link href={`/login?redirect_to=${encodeURIComponent(pathname)}`} className={btn}>
              <Flag className="size-4" aria-hidden />
              Está desactualizado
            </Link>
          )}
          {error && <p role="alert" className="mt-1 text-xs text-[#E63946]">{error}</p>}
        </div>
      )}
    </section>
  )
}

/** Para el modal (cliente): trae el estado cacheado del servidor solo si el sitio tiene buses. */
export function SiteTransitFromSite({ site, className }: { site: Pick<SiteDetail, "id" | "transit" | "author">; className?: string }) {
  const [view, setView] = useState<SiteTransitView | null>(null)
  const has = !!site.transit
  useEffect(() => {
    if (!has) return
    let alive = true
    getSiteTransitViewAction(site.id).then((v) => alive && setView(v)).catch(() => {})
    return () => { alive = false }
  }, [has, site.id])
  return <SiteTransitSection view={has ? view : null} siteId={site.id} authorId={site.author.id} className={className} />
}
