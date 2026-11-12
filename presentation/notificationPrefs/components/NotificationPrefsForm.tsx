"use client"

import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button/button"
import { getMyPrefsAction, saveMyPrefsAction, type PrefsView } from "@/app/actions/notificationPrefs/prefs.action"

const Row = ({ id, title, text, checked, onChange }: { id: string; title: string; text: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label htmlFor={id} className="flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40">
    <input id={id} type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[#9B0A26]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="grid gap-0.5"><span className="font-semibold">{title}</span><span className="text-sm text-muted-foreground">{text}</span></span>
  </label>
)

/** Preferencias de avisos: correo y push. Por defecto solo lo de tus propias reservas; lo demás exige autorización. */
export function NotificationPrefsForm() {
  const [p, setP] = useState<PrefsView | null | undefined>(undefined)
  const [authorized, setAuthorized] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { let on = true; void getMyPrefsAction().then((r) => { if (on) setP(r) }); return () => { on = false } }, [])
  if (p === undefined) return <div className="h-64 animate-pulse rounded-3xl bg-muted" aria-busy="true" />
  if (!p) return <p className="text-sm text-muted-foreground">Inicia sesión para elegir tus avisos.</p>
  const set = (patch: Partial<PrefsView["email"]>, push?: boolean) => setP({ ...p, email: { ...p.email, ...patch }, push: { enabled: push ?? p.push.enabled } })
  const wantsMore = p.email.forYou || p.email.weekly || p.push.enabled
  const save = async () => {
    setBusy(true); setMsg(null)
    const r = await saveMyPrefsAction({ email: p.email, push: p.push }, authorized)
    setBusy(false)
    if (!r.success) return setMsg({ ok: false, text: r.error })
    setP(r.prefs); setMsg({ ok: true, text: "Listo, guardamos tus avisos." })
  }
  return (
    <form className="grid gap-5" onSubmit={(e) => { e.preventDefault(); void save() }}>
      <div className="grid gap-3">
        <h2 className="font-heading text-lg font-bold">Correo</h2>
        <Row id="tr" title="Sobre mis reservas" text="Confirmación de tu cupo, «mañana sale…» y último cupo. Solo de actividades donde te apuntaste." checked={p.email.transactional} onChange={(v) => set({ transactional: v })} />
        <Row id="fy" title="Para ti" text="Actividades y sitios que te pueden interesar, según lo que guardas y marcas «Yo fui». Máximo uno al día." checked={p.email.forYou} onChange={(v) => set({ forYou: v })} />
        <Row id="wk" title="Qué hacer esta semana" text="Un resumen semanal de eventos y actividades en Ibagué." checked={p.email.weekly} onChange={(v) => set({ weekly: v })} />
      </div>
      <div className="grid gap-3">
        <h2 className="font-heading text-lg font-bold">Avisos en el celular</h2>
        <Row id="pu" title="Notificaciones push" text="Avisos útiles y pocos, con tope diario. Después de guardar, el navegador te pedirá permiso." checked={p.push.enabled} onChange={(v) => set({}, v)} />
      </div>
      {wantsMore ? (
        <label className="flex items-start gap-3 text-[0.8125rem] leading-snug"><input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[#9B0A26]" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} />Autorizo a Qué Hay Pa Hacer a enviarme estos avisos y a usar mis guardados y «Yo fui» para elegir qué mostrarme, según la <a href="/privacidad" className="font-semibold text-primary-dark underline">Política de privacidad</a>. Puedo cambiarlo o darme de baja cuando quiera.</label>
      ) : null}
      {msg ? <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-sm font-semibold text-[#14532D]" : "text-sm font-medium text-destructive"}>{msg.text}</p> : null}
      <Button type="submit" size="lg" className="h-12 w-fit" disabled={busy}>{busy ? "Guardando…" : "Guardar mis avisos"}</Button>
    </form>
  )
}
