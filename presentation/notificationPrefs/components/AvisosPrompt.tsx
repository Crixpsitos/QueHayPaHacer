"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Bell, X } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { useConsent } from "@/app/lib/analytics/useConsent"
import { enablePushDevice } from "@/presentation/notificationPrefs/lib/pushClient"
import { getMyPrefsAction, saveMyPrefsAction } from "@/app/actions/notificationPrefs/prefs.action"

const KEY = "qhpa-avisos-until"
const PATHS = ["/", "/actividades", "/eventos", "/donde-ir", "/mis-planes"]
const DAY = 86_400_000
const snooze = (days: number) => { try { localStorage.setItem(KEY, String(Date.now() + days * DAY)) } catch { /* sin almacenamiento: se vuelve a preguntar */ } }

/**
 * Invitación a activar avisos, dentro de la app y con sesión iniciada: aparece a los pocos segundos en las páginas principales
 * si la persona nunca eligió. Un toque activa «Para ti» + el resumen por correo (martes y viernes) y las notificaciones del
 * celular; el permiso del navegador solo se pide después de ese toque. «Ahora no» la calla 14 días y «No, gracias» 90.
 */
export function AvisosPrompt() {
  const pathname = usePathname()
  const { state: consent } = useConsent()
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const eligible = PATHS.includes(pathname) && (consent === "granted" || consent === "denied")

  useEffect(() => {
    if (!eligible) return
    try { if (Number(localStorage.getItem(KEY) ?? 0) > Date.now()) return } catch { /* sigue */ }
    let on = true
    const t = setTimeout(() => {
      void getMyPrefsAction().then((p) => { if (on && p && !p.consented && !p.push.enabled) setShow(true) }).catch(() => {})
    }, 6000)
    return () => { on = false; clearTimeout(t) }
  }, [eligible])

  if (!show || !eligible) return null
  const activate = async () => {
    setBusy(true); setMsg(null)
    const r = await saveMyPrefsAction({ email: { forYou: true, weekly: true }, push: { enabled: true } }, true)
    if (!r.success) { setBusy(false); return setMsg(r.error) }
    const d = await enablePushDevice()
    setBusy(false)
    snooze(3650)
    setDone(true) // ya está: los botones desaparecen y no se puede volver a tocar
    setMsg(d.ok ? "Listo: te avisaremos." : `Activamos el correo. ${d.error}`)
    setTimeout(() => setShow(false), 2500)
  }
  const close = (days: number) => { snooze(days); setShow(false) }
  return (
    <div role="region" aria-label="Activar avisos" className="fixed inset-x-3 bottom-20 z-40 grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-xl sm:bottom-4 sm:left-auto sm:right-4 sm:w-96">
      <button type="button" onClick={() => close(14)} aria-label="Cerrar" className="absolute right-2 top-2 grid size-9 place-items-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2"><X className="size-4" aria-hidden /></button>
      <div className="flex items-start gap-3 pr-8">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-dark text-white"><Bell className="size-5" aria-hidden /></span>
        <div className="grid gap-1">
          <h2 className="font-heading text-lg font-bold leading-tight">¿Te avisamos de lo bueno?</h2>
          <p className="text-sm leading-snug text-muted-foreground">Un correo los martes y viernes con planes que te pueden gustar, el resumen de la semana y notificaciones en el celular cuando una actividad tuya sale mañana. Pocos avisos, y te sales cuando quieras.</p>
        </div>
      </div>
      <p className="text-xs leading-snug text-muted-foreground">Al activar, autorizas estos avisos de Qué Hay Pa Hacer. Los cambias en <a href="/avisos" className="font-semibold text-primary-dark underline-offset-2 hover:underline">Mis avisos</a>.</p>
      {msg ? <p role="status" className="text-sm font-semibold text-[#14532D]">{msg}</p> : null}
      {done ? null : <div className="flex flex-wrap gap-2">
        <Button type="button" size="lg" className="h-11" disabled={busy} onClick={() => void activate()}>{busy ? "Activando…" : "Activar avisos"}</Button>
        <Button type="button" variant="ghost" size="lg" className="h-11" disabled={busy} onClick={() => close(14)}>Ahora no</Button>
        <Button type="button" variant="ghost" size="lg" className="h-11 text-muted-foreground" disabled={busy} onClick={() => close(90)}>No, gracias</Button>
      </div>}
    </div>
  )
}
