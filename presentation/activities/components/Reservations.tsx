"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, MessageCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { getReservationsAction, setJoinClosedAction, setJoinStatusAction } from "@/app/actions/activities/join.action"
import type { ManagerView } from "@/application/services/activities/ActivityJoinService"
import { cn } from "@/app/lib/utils/cn"
import { departureSummaries, funnelFor, rowsFor, whatsappHref, type StatusFilter } from "@/presentation/activities/lib/reservations"
import type { JoinStatusValue } from "@/domain/entities/activities/activityJoin"

const shortDate = (key: string) => (key === "open" ? "Sin fecha fija" : new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Bogota" }).format(new Date(`${key}T12:00:00-05:00`)).replace(".", ""))
const longDate = (key: string) => (key === "open" ? "sin fecha fija" : new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }).format(new Date(`${key}T12:00:00-05:00`)))
const when = (d: Date) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(d))
const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?"

const PILL: Record<JoinStatusValue, { text: string; cls: string }> = {
  pending: { text: "Por confirmar", cls: "bg-accent text-[#7a5200]" },
  confirmed: { text: "Confirmado", cls: "bg-[#E4F5E8] text-[#14532D]" },
  noShow: { text: "No pagó", cls: "bg-[#FDE8EA] text-primary-dark" },
}
const FILTERS: { v: StatusFilter; label: string }[] = [{ v: "all", label: "Todas" }, { v: "pending", label: "Por confirmar" }, { v: "confirmed", label: "Confirmadas" }, { v: "noShow", label: "No pagó" }]
const chip = "flex min-h-11 shrink-0 flex-col items-center justify-center rounded-full border px-4 text-sm font-semibold leading-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/30"

/** "Reservas" de una actividad: embudo, cupo, lista con WhatsApp autorizado y confirmación de pago. Solo dueño o QHPA. */
export function Reservations({ initial }: { initial: ManagerView }) {
  const [view, setView] = useState(initial)
  const departures = useMemo(() => departureSummaries(view.rows, view.join?.capacity ?? null), [view])
  const [key, setKey] = useState(departures[0]?.key ?? "")
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)

  const refresh = async () => { const v = await getReservationsAction(view.id); if (v) setView(v) }
  const run = async (f: () => Promise<{ success: boolean; error?: string }>) => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError(null)
    const r = await f()
    if (!r.success) setError(r.error ?? "No se pudo completar.")
    await refresh()
    setBusy(false)
    lock.current = false
  }

  const join = view.join
  const current = departures.find((d) => d.key === key)
  const funnel = funnelFor(view.rows, key, view)
  const list = rowsFor(view.rows, key, filter)
  const count = (s: StatusFilter) => rowsFor(view.rows, key, s).length
  const bar = (n: number) => `${Math.max(n > 0 ? 3 : 0, Math.min(100, funnel.views ? (n / funnel.views) * 100 : n ? 100 : 0))}%`

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-5">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="size-11 rounded-full bg-muted"><Link href="/actividades/mis" aria-label="Volver a mis actividades"><ArrowLeft aria-hidden /></Link></Button>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Mis actividades</p>
          <h1 className="font-heading text-2xl font-bold leading-tight">Reservas</h1>
          <p className="truncate text-sm text-muted-foreground">{view.title}</p>
        </div>
      </header>

      {!join ? (
        <div className="grid gap-2 rounded-3xl bg-muted p-4">
          <div className="font-semibold">Esta actividad no recibe reservas aquí</div>
          <p className="text-sm text-muted-foreground">Para activarlas, edita la actividad, paso «¿Cómo se unen?».</p>
          <Button asChild variant="outline" className="h-11 w-fit"><Link href={`/actividades/${view.id}/editar`}>Editar actividad</Link></Button>
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground">ELIGE LA SALIDA</h2>
            {departures.length ? (
              <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Salidas">
                {departures.map((d) => (
                  <button key={d.key} type="button" role="tab" aria-selected={d.key === key} onClick={() => setKey(d.key)} className={cn(chip, d.key === key ? "border-primary-dark bg-primary-dark text-white" : "border-border bg-card")}>
                    {shortDate(d.key)}<small className="text-[11px] font-medium opacity-70">{d.capacity ? `${d.taken} de ${d.capacity}` : `${d.taken} reservas`}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {!departures.length ? (
            <div className="grid gap-2 rounded-3xl border border-border bg-card p-4">
              <div className="font-semibold">Todavía nadie reservó</div>
              <p className="text-sm text-muted-foreground">Comparte tu enlace de WhatsApp o el afiche con QR para empezar a recibir reservas.</p>
              <Button asChild variant="outline" className="h-11 w-fit border-primary text-primary-dark"><Link href="/actividades/mis">Compartir con QR y afiche</Link></Button>
            </div>
          ) : (
            <>
              <section className="grid gap-3 rounded-3xl border border-border bg-card p-4" aria-label="Embudo">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground">EMBUDO · {shortDate(key).toUpperCase()}</h2>
                {([["Vieron", funnel.views, "#E4E4E7"], ["Reservaron", funnel.reserved, "#F6DDA0"], ["Por confirmar", funnel.pending, "#FFB703"], ["Confirmadas", funnel.confirmed, "#2F8F4E"], ["Fueron", funnel.visits, "#14532D"]] as const).map(([label, n, color]) => (
                  <div key={label} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2.5 text-sm">
                    <span>{label}</span>
                    <div className="h-3.5 overflow-hidden rounded-full bg-muted" aria-hidden><div className="h-full rounded-full" style={{ width: bar(n), background: color }} /></div>
                    <strong className="text-right">{n}</strong>
                  </div>
                ))}
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {funnel.showPercent ? `De cada 100 que ven la actividad, ${funnel.reservePercent} reservan. ` : "Los porcentajes aparecen desde 10 reservas. "}
                  «Vieron» y «Fueron» son de toda la actividad; las demás cifras son de esta salida.
                </p>
              </section>

              <section className="grid gap-3 rounded-3xl border border-border bg-card p-4" aria-label="Cupo">
                <div className="flex items-baseline justify-between">
                  <div className="font-heading text-3xl font-bold leading-none">{current?.taken ?? 0}{join.capacity ? <span className="text-lg font-semibold text-muted-foreground"> / {join.capacity}</span> : null}</div>
                  {join.capacity ? <span className="rounded-full bg-[#E4F5E8] px-2.5 py-1 text-xs font-semibold text-[#14532D]">Quedan {Math.max(0, join.capacity - (current?.taken ?? 0))}</span> : <span className="text-sm text-muted-foreground">Sin tope</span>}
                </div>
                {join.capacity ? <div role="progressbar" aria-valuemin={0} aria-valuemax={join.capacity} aria-valuenow={current?.taken ?? 0} aria-label="Cupos ocupados" className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-grad-primary" style={{ width: `${Math.min(100, ((current?.taken ?? 0) / join.capacity) * 100)}%` }} /></div> : null}
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="h-11"><Link href={`/actividades/${view.id}/editar`}>Cambiar cupo</Link></Button>
                  <Button type="button" variant="outline" className="h-11 border-primary text-primary-dark" disabled={busy} onClick={() => void run(() => setJoinClosedAction(view.id, !join.closed))}>{join.closed ? "Reabrir reservas" : "Cerrar reservas"}</Button>
                </div>
                <p className="text-xs text-muted-foreground">{join.closed ? "Las reservas están cerradas: la gente ve el aviso. Quienes ya estaban dentro siguen en la lista." : "Cerrar no saca a nadie. Puedes reabrir cuando quieras."}</p>
              </section>

              <section className="grid gap-2" aria-label="Lista de reservas">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {FILTERS.filter((f) => view.paid || f.v === "all" || f.v === "confirmed").map((f) => (
                    <button key={f.v} type="button" aria-pressed={filter === f.v} onClick={() => setFilter(f.v)} className={cn(chip, "min-h-10", filter === f.v ? "border-primary-dark bg-primary-dark text-white" : "border-border bg-card")}>
                      {f.label}<small className="text-[11px] font-medium opacity-70">{count(f.v)}</small>
                    </button>
                  ))}
                </div>
                <ul className="divide-y divide-border rounded-3xl border border-border bg-card px-4">
                  {list.length === 0 ? <li className="py-4 text-sm text-muted-foreground">Nadie en este filtro.</li> : null}
                  {list.map((r) => {
                    const wa = whatsappHref(r.phone, view.title, longDate(r.key))
                    return (
                      <li key={r.uid} className="grid gap-2.5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary-dark" aria-hidden>{initials(r.name)}</span>
                          <div className="min-w-0"><div className={cn("truncate font-semibold", r.status === "noShow" && "text-muted-foreground")}>{r.name || "Sin nombre"}</div><div className="text-xs text-muted-foreground">Reservó {when(r.createdAt)}</div></div>
                          <span className={cn("ml-auto whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", PILL[r.status].cls)}>{PILL[r.status].text}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {wa && r.status !== "noShow" ? <Button asChild variant="outline" className="h-11 border-[#B7E1C0] bg-[#F3FBF5] text-[#14532D]"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden /> Escribir · {r.phone!.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}</a></Button> : null}
                          {r.status === "pending" ? <Button type="button" className="h-11" disabled={busy} onClick={() => void run(() => setJoinStatusAction(view.id, r.key, r.uid, "confirmed"))}>Confirmar pago</Button> : null}
                          {r.status === "pending" ? <Button type="button" variant="outline" className="h-11 text-primary-dark" disabled={busy} onClick={() => void run(() => setJoinStatusAction(view.id, r.key, r.uid, "noShow"))}>No pagó</Button> : null}
                          {r.status === "confirmed" && view.paid ? <Button type="button" variant="outline" className="h-11" disabled={busy} onClick={() => void run(() => setJoinStatusAction(view.id, r.key, r.uid, "pending"))}>Deshacer</Button> : null}
                          {r.status === "noShow" ? <Button type="button" variant="outline" className="h-11" disabled={busy} onClick={() => void run(() => setJoinStatusAction(view.id, r.key, r.uid, "pending"))}>Devolver el cupo</Button> : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
                {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
                <p className="text-xs leading-relaxed text-muted-foreground">Ves el nombre y el WhatsApp solo de quienes autorizaron compartirlo para esta reserva. Úsalo únicamente para coordinar esta actividad. Cuando alguien reserva o cancela, te llega un aviso por la campanita.</p>
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}
