"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarCheck, CalendarPlus, Check, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { cn } from "@/app/lib/utils/cn"
import { addToPlanAction, getPlanItemAction, removeFromPlanAction } from "@/app/actions/activities/plan-items.action"
import { getMyActivityEngagementAction, setActivityPlanSlotAction, setActivitySavedAction } from "@/app/actions/activities/engagement.action"

type Kind = "event" | "site" | "activity"
interface Props {
  kind: Kind
  id: string
  title: string
  /** Evento: «sábado 14 de noviembre, 7:00 p. m.» (entra con su día y hora, que son fijos). */
  when?: string
  /** Actividad con horario propio: se ofrece «Según su horario» (sin elegir día). */
  hasSchedule?: boolean
  className?: string
}

const bogotaToday = () => new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 10)
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const dayLong = (iso: string) => new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`))
const hourLabel = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}` }

/**
 * «Agregar a mi plan»: el único botón para armar tu plan, igual en eventos, sitios y actividades.
 * Evento: un toque (entra con su día y hora). Sitio: eliges el día y, si quieres, la hora. Actividad: según su horario o el día que elijas.
 * Lo que agregas aparece en «Mis planes», por día y hora. «Voy a ir» y «Me gusta» son otra cosa: no arman el plan.
 */
export function AddToPlanButton({ kind, id, title, when, hasSchedule, className }: Props) {
  const [inPlan, setInPlan] = useState<{ date: string | null; time: string | null } | boolean>(false)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"schedule" | "day" | "none">(kind === "activity" && hasSchedule ? "schedule" : "day")
  const [date, setDate] = useState<string>("")
  const [time, setTime] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let live = true
    if (kind === "activity") void getMyActivityEngagementAction(id).then((r) => live && setInPlan(r.saved))
    else void getPlanItemAction(kind, id).then((it) => live && setInPlan(it ? { date: it.date, time: it.time } : false))
    return () => { live = false }
  }, [kind, id])

  const goLogin = () => window.location.assign(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`)
  const openSheet = () => { setError(null); setDone(false); setDate(bogotaToday()); setOpen(true) }
  const days = open ? Array.from({ length: 7 }, (_, i) => addDays(bogotaToday(), i)) : []
  const wantsDay = mode === "day"

  const submit = async () => {
    setBusy(true); setError(null)
    if (kind === "activity") {
      const saved = await setActivitySavedAction(id, true)
      if (!saved.success) { setBusy(false); return saved.authRequired ? goLogin() : setError(saved.error ?? "No se pudo agregar.") }
      if (wantsDay) {
        const s = await setActivityPlanSlotAction(id, { date, time: time || null })
        if (!s.success) { setBusy(false); return setError(s.error ?? "No se pudo guardar el día.") }
      }
      setInPlan(true)
    } else {
      const r = await addToPlanAction(kind, id, kind === "site" && wantsDay ? { date, time: time || null } : null)
      if (!r.success) { setBusy(false); return r.authRequired ? goLogin() : setError(r.error) }
      setInPlan({ date: r.item.date, time: r.item.time })
    }
    setBusy(false); setDone(true)
  }

  const remove = async () => {
    setBusy(true)
    const r = kind === "activity" ? await setActivitySavedAction(id, false) : await removeFromPlanAction(kind, id)
    setBusy(false)
    if (r.success) { setInPlan(false); setDone(false); setOpen(false) } else setError("error" in r && r.error ? r.error : "No se pudo quitar.")
  }

  const planned = inPlan !== false
  const slotText = typeof inPlan === "object" && inPlan.date ? `${dayLong(inPlan.date)}${inPlan.time ? ` · ${hourLabel(inPlan.time)}` : ""}` : null
  const btn = "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40"

  return (
    <>
      <button type="button" onClick={planned ? () => { setError(null); setDone(true); setOpen(true) } : openSheet} aria-haspopup="dialog"
        className={cn(className ?? `${btn} border-primary text-primary-dark hover:bg-primary-light`, planned && "border-[#14532D] bg-[#E4F5E8] text-[#14532D] hover:bg-[#E4F5E8]")}>
        {planned ? <CalendarCheck className="size-4" aria-hidden /> : <CalendarPlus className="size-4" aria-hidden />}
        {planned ? "En tu plan" : "Agregar a mi plan"}
        {planned && slotText ? <span className="font-normal">· {slotText}</span> : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {done ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Check className="size-5 text-[#14532D]" aria-hidden /> Está en tu plan</DialogTitle>
                <DialogDescription>{title}{slotText ? ` · ${slotText}` : kind === "event" && when ? ` · ${when}` : ""}. Lo verás en «Mis planes», por día y hora.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Link href="/mis-planes" prefetch={false} className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark px-5 text-sm font-semibold text-white">Ver mi plan</Link>
                <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold">Seguir viendo</button>
                <button type="button" onClick={() => void remove()} disabled={busy} className="min-h-11 text-sm font-semibold text-primary-dark underline disabled:opacity-60">Quitar de mi plan</button>
              </div>
              {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Agregar a mi plan</DialogTitle>
                <DialogDescription>{title}</DialogDescription>
              </DialogHeader>
              {kind === "event" ? (
                <p className="rounded-2xl bg-muted/70 p-4 text-sm leading-relaxed">Este evento entra a tu plan en su día y hora{when ? <>: <strong>{when}</strong></> : ""}. Aparecerá en tu semana y se cruzará con lo demás si coinciden.</p>
              ) : (
                <div className="grid gap-4">
                  <div role="radiogroup" aria-label="¿Cuándo?" className="grid gap-2">
                    {kind === "activity" && hasSchedule ? <Chip on={mode === "schedule"} onClick={() => setMode("schedule")}>Según su horario</Chip> : null}
                    <Chip on={mode === "day"} onClick={() => setMode("day")}>Elegir día y hora</Chip>
                    <Chip on={mode === "none"} onClick={() => setMode("none")}>Sin día por ahora</Chip>
                  </div>
                  {wantsDay ? (
                    <div className="grid gap-3">
                      <div role="group" aria-label="Día" className="flex flex-wrap gap-2">
                        {days.map((d, i) => (
                          <button key={d} type="button" aria-pressed={date === d} onClick={() => setDate(d)} className={cn("min-h-11 rounded-2xl border px-3 text-sm font-semibold first-letter:uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/40", date === d ? "border-transparent bg-primary-dark text-white" : "border-border bg-card")}>{i === 0 ? "Hoy" : dayLong(d)}</button>
                        ))}
                      </div>
                      <label className="grid gap-1 text-sm font-semibold">Hora <span className="font-normal text-muted-foreground">(opcional)</span>
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="min-h-11 w-40 rounded-xl border border-border bg-white px-3 text-sm font-normal" />
                      </label>
                    </div>
                  ) : null}
                </div>
              )}
              {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
              <button type="button" onClick={() => void submit()} disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-dark px-5 text-sm font-semibold text-white disabled:opacity-60">
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CalendarPlus className="size-4" aria-hidden />} Agregar a mi plan
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" role="radio" aria-checked={on} onClick={onClick} className={cn("min-h-12 rounded-2xl border px-4 text-left text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/40", on ? "border-primary-dark bg-primary-light text-primary-dark" : "border-border bg-card")}>{children}</button>
}
