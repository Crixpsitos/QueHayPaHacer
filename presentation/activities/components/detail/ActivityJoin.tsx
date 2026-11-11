"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Clock } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { Input } from "@/app/components/ui/input"
import { cancelJoinAction, getJoinStatusAction, joinActivityAction } from "@/app/actions/activities/join.action"
import type { JoinStatus, OccurrenceStatus } from "@/application/services/activities/ActivityJoinService"
import { cn } from "@/app/lib/utils/cn"

const dateLabel = (o: OccurrenceStatus) =>
  o.date ? new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }).format(new Date(`${o.date}T12:00:00-05:00`)) : "Cuando quieras"
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function pill(o: OccurrenceStatus): { text: string; cls: string } | null {
  if (o.myStatus === "pending") return { text: "Por pagar", cls: "bg-accent text-[#7a5200]" }
  if (o.myStatus === "confirmed") return { text: "Estás dentro", cls: "bg-[#E4F5E8] text-[#14532D]" }
  if (o.full) return { text: "Sin cupos", cls: "bg-muted text-muted-foreground" }
  if (o.spotsLeft === 1) return { text: "Último cupo", cls: "bg-accent text-[#7a5200]" }
  if (o.spotsLeft !== null) return { text: `Quedan ${o.spotsLeft}`, cls: "bg-[#E4F5E8] text-[#14532D]" }
  return null
}

/**
 * Reservar cupo en una o varias salidas. La ficha se cachea por horas: cupos y "mi estado" se piden aquí, tras montar.
 * Gratis: un toque. De pago: se pide el WhatsApp con consentimiento y el pago se coordina fuera de QHPA.
 */
export function ActivityJoin({ activityId, hostName, priceFrom }: { activityId: string; hostName: string; priceFrom: string }) {
  const [status, setStatus] = useState<JoinStatus | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [asking, setAsking] = useState(false)
  const [phone, setPhone] = useState("")
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lock = useRef(false)

  const load = useCallback(async () => setStatus(await getJoinStatusAction(activityId)), [activityId])
  useEffect(() => { void load() }, [load])

  if (!status?.enabled) return null
  const goLogin = () => window.location.assign(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}#reservar`)
  const mine = status.occurrences.filter((o) => o.myStatus === "pending" || o.myStatus === "confirmed")
  const free = status.occurrences.filter((o) => !o.myStatus && !o.full)
  const bookable = !status.closed ? status.occurrences.filter((o) => !o.myStatus) : []

  const toggle = (key: string) => { setError(null); setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key])) }

  const submit = async () => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError(null)
    const done: string[] = []
    for (const key of picked) {
      const o = status.occurrences.find((x) => x.key === key)
      const r = await joinActivityAction(activityId, o?.date ?? null, status.paid ? { phone, consent } : undefined)
      if (r.success) { done.push(key); continue }
      if (r.authRequired) { lock.current = false; goLogin(); return }
      setError(`${o?.date ? cap(dateLabel(o)) + ": " : ""}${r.error}`)
      break
    }
    await load()
    setPicked((p) => p.filter((k) => !done.includes(k)))
    if (done.length) { setAsking(false); setConsent(false) }
    setBusy(false)
    lock.current = false
  }

  const start = () => {
    if (!picked.length) { setError("Elige al menos una salida."); return }
    if (status.paid && !asking) { setAsking(true); return }
    void submit()
  }

  const cancel = async (key: string) => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    const r = await cancelJoinAction(activityId, key)
    if (!r.success) setError(r.error)
    setConfirmCancel(null)
    await load()
    setBusy(false)
    lock.current = false
  }

  const phoneOk = /^\+?[\d\s().-]{10,16}$/.test(phone.trim())

  return (
    <section id="reservar" aria-labelledby="reservar-t" className="grid scroll-mt-24 gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="reservar-t" className="font-heading text-xl font-semibold">{status.paid ? "Reserva tu cupo" : "Únete"}</h2>
        <span className="text-sm text-muted-foreground">{status.paid ? "Reservar es gratis" : "Gratis"}</span>
      </div>

      {mine.map((o) => (
        <div key={o.key} className={cn("grid gap-3 rounded-2xl border p-4", o.myStatus === "pending" ? "border-[#F6DDA0]" : "border-[#B7E1C0]")}>
          <div className="flex items-center gap-3">
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", o.myStatus === "pending" ? "bg-accent text-[#7a5200]" : "bg-[#E4F5E8] text-[#14532D]")}>
              {o.myStatus === "pending" ? <Clock className="size-5" aria-hidden /> : <Check className="size-5" aria-hidden />}
            </span>
            <div>
              <div className="font-heading text-lg font-semibold">{o.myStatus === "pending" ? "Cupo reservado" : "Estás dentro"}</div>
              <div className="text-sm text-muted-foreground">{o.myStatus === "confirmed" && status.paid ? "Confirmado · " : ""}{cap(dateLabel(o))}</div>
            </div>
          </div>
          {o.myStatus === "pending" ? (
            <ol className="grid gap-2 text-sm leading-relaxed">
              <li><b>1.</b> {hostName} te escribirá por WhatsApp.</li>
              <li><b>2.</b> Pagas como te indiquen{status.payInstructions ? <>: <em>{status.payInstructions}</em></> : "."}</li>
              <li><b>3.</b> Te marcan como <strong>Confirmado</strong> y lo ves aquí.</li>
            </ol>
          ) : null}
          {confirmCancel === o.key ? (
            <div role="alertdialog" aria-label="Cancelar" className="grid gap-2 rounded-2xl bg-muted p-3">
              <p className="text-sm">¿Cancelar tu cupo? Liberas el lugar para otra persona.{status.paid ? " Si ya pagaste, habla con quien organiza para el reembolso: eso se arregla entre ustedes." : ""}</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="h-11 flex-1 border-primary text-primary-dark" disabled={busy} onClick={() => void cancel(o.key)}>Sí, cancelar</Button>
                <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => setConfirmCancel(null)}>Mantener</Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" className="h-11 text-primary-dark" onClick={() => setConfirmCancel(o.key)}>Cancelar mi {o.myStatus === "pending" ? "reserva" : "cupo"}</Button>
          )}
        </div>
      ))}

      {status.closed && !mine.length ? (
        <div className="grid gap-1 rounded-2xl bg-muted p-4"><div className="font-semibold">Las reservas están cerradas</div><p className="text-sm text-muted-foreground">Quien organiza cerró los cupos.</p></div>
      ) : null}

      {bookable.length ? (
        <fieldset className="grid gap-2" disabled={busy}>
          <legend className="sr-only">Elige una o varias salidas</legend>
          {bookable.map((o) => {
            const p = pill(o)
            const on = picked.includes(o.key)
            return (
              <label key={o.key} className={cn("flex min-h-14 items-center gap-3 rounded-2xl border-2 px-3.5 py-2 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30", o.full ? "border-border bg-muted text-muted-foreground" : on ? "cursor-pointer border-primary bg-primary-light" : "cursor-pointer border-border bg-card hover:bg-muted/50")}>
                <input type="checkbox" className="size-5 accent-[#D42F3C]" checked={on} disabled={o.full} onChange={() => toggle(o.key)} />
                <span className="font-semibold">{cap(dateLabel(o))}</span>
                {p ? <span className={cn("ml-auto whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", p.cls)}>{p.text}</span> : null}
              </label>
            )
          })}
          {status.paid ? <div className="flex items-baseline justify-between px-1 text-sm"><span className="text-muted-foreground">Entrada</span><span className="font-heading text-xl font-bold">{priceFrom}</span></div> : null}
          {status.paid && !asking ? <p className="rounded-2xl border border-[#F6DDA0] bg-accent p-3 text-sm leading-relaxed text-[#7a5200]"><strong>El pago no es aquí.</strong> Reservas el cupo y {hostName} te escribe por WhatsApp para coordinar el pago.</p> : null}

          {asking ? (
            <div className="grid gap-3 rounded-2xl border border-border p-3" role="group" aria-label="Datos para la reserva">
              <div className="font-heading text-lg font-semibold">Para que te escriban</div>
              <label className="grid gap-1.5 text-sm font-semibold">Tu WhatsApp
                <Input type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={phone} placeholder="300 123 4567" onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="flex items-start gap-3 text-sm leading-snug">
                <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[#D42F3C]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>Autorizo que Qué Hay Pa Hacer comparta mi nombre y mi WhatsApp con {hostName} solo para esta reserva. <a href="/privacidad" className="text-primary-dark underline" target="_blank" rel="noopener">Política de datos</a></span>
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="h-12 w-28" onClick={() => setAsking(false)}>Cancelar</Button>
                <Button type="button" size="lg" className="h-12 flex-1 text-base" disabled={busy || !consent || !phoneOk} onClick={start}>{busy ? "Reservando…" : "Reservar"}</Button>
              </div>
            </div>
          ) : (
            <Button type="button" size="lg" className="h-12 text-base" disabled={busy || !free.length} onClick={start}>
              {busy ? "Un momento…" : picked.length > 1 ? `${status.paid ? "Reservar" : "Unirme a"} ${picked.length} salidas` : status.paid ? "Reservar mi cupo" : "Unirme"}
            </Button>
          )}
          {!status.paid ? <p className="text-xs text-muted-foreground">Actividad gratis: quedas confirmado al instante y no se comparte tu teléfono.</p> : null}
        </fieldset>
      ) : null}

      {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
    </section>
  )
}
