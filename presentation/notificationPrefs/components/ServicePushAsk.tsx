"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { enablePushDevice } from "@/presentation/notificationPrefs/lib/pushClient"
import { getMyPrefsAction, saveMyPrefsAction } from "@/app/actions/notificationPrefs/prefs.action"

const KEY = "qhpa-service-push-until"
const snooze = (days: number) => { try { localStorage.setItem(KEY, String(Date.now() + days * 86_400_000)) } catch { /* sin almacenamiento: se vuelve a preguntar */ } }

/**
 * Se muestra justo después de inscribirte o reservar: «¿Te avisamos cuando sea mañana?». Es solo de servicio (esta y tus otras
 * inscripciones y reservas), no promoción: no pide la casilla de marketing. El permiso del navegador se pide solo tras tocar «Sí».
 */
export function ServicePushAsk({ className }: { className?: string }) {
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    try { if (Number(localStorage.getItem(KEY) ?? 0) > Date.now()) return } catch { /* sigue */ }
    let on = true
    void getMyPrefsAction().then((p) => { if (on && p && !p.push.service && !p.push.enabled) setShow(true) }).catch(() => {})
    return () => { on = false }
  }, [])

  if (!show) return null
  const accept = async () => {
    setBusy(true); setMsg(null)
    const r = await saveMyPrefsAction({ push: { service: true } }, false)
    if (!r.success) { setBusy(false); return setMsg(r.error) }
    const d = await enablePushDevice()
    setBusy(false)
    snooze(3650)
    setMsg(d.ok ? "Listo: te avisaremos cuando se acerque." : d.error)
    setTimeout(() => setShow(false), 3000)
  }
  return (
    <div role="region" aria-label="Avisos de tu inscripción" className={`grid gap-2 rounded-2xl border border-border bg-muted p-3 text-left ${className ?? ""}`}>
      <p className="flex items-center gap-2 text-sm font-semibold"><Bell className="size-4 text-primary-dark" aria-hidden /> ¿Te avisamos cuando sea mañana?</p>
      <p className="text-xs leading-snug text-muted-foreground">Una notificación en el celular sobre esta inscripción y tus otras reservas. Solo eso, nada de promociones.</p>
      {msg ? <p role="status" className="text-xs font-semibold text-[#14532D]">{msg}</p> : (
        <div className="flex gap-2">
          <Button type="button" className="h-10" disabled={busy} onClick={() => void accept()}>{busy ? "Activando…" : "Sí, avísame"}</Button>
          <Button type="button" variant="ghost" className="h-10" disabled={busy} onClick={() => { snooze(90); setShow(false) }}>No, gracias</Button>
        </div>
      )}
    </div>
  )
}
