"use client"

import { useEffect, useState } from "react"
import { CalendarPlus } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { getMySavedAmongAction, setActivitySavedAction } from "@/app/actions/activities/engagement.action"

export interface PlanItem { id: string; title: string; hint?: string }

/**
 * «Armar mi plan»: eliges cuáles de estas actividades guardar (todas vienen marcadas, tú quitas las que no quieres)
 * y te lleva a tu semana, donde se ven por día y hora y con los cruces marcados.
 */
export function BuildPlanButton({ items }: { items: PlanItem[] }) {
  const [open, setOpen] = useState(false)
  const [already, setAlready] = useState<string[]>([])
  const [picked, setPicked] = useState<string[]>(() => items.map((i) => i.id))
  // lo que ya está en tu plan se marca y no se puede volver a agregar
  useEffect(() => {
    if (!open) return
    let live = true
    void getMySavedAmongAction(items.map((i) => i.id)).then((ids) => { if (!live) return; setAlready(ids); setPicked((p) => p.filter((id) => !ids.includes(id))) })
    return () => { live = false }
  }, [open, items])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const go = async () => {
    setBusy(true); setError(null)
    for (const id of picked) {
      const r = await setActivitySavedAction(id, true)
      if (!r.success) {
        setBusy(false)
        if (r.authRequired) return window.location.assign(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`)
        return setError(r.error)
      }
    }
    // navegación completa: así Mis planes siempre trae lo que acabas de guardar (nada viejo en caché)
    window.location.assign("/mis-planes")
  }
  if (!open) return <Button type="button" variant="outline" size="lg" className="h-12 justify-self-start" onClick={() => setOpen(true)}><CalendarPlus aria-hidden /> Armar mi plan</Button>
  return (
    <div className="grid gap-3 rounded-3xl border border-border bg-card p-4">
      <div className="grid gap-0.5">
        <h3 className="font-heading text-lg font-bold">Elige qué va en tu plan</h3>
        <p className="text-sm text-muted-foreground">Quita las que no quieras. Se guardan en Mis planes y las ves por día y hora.</p>
      </div>
      <ul className="grid gap-2">
        {items.map((i) => (
          <li key={i.id}>
            <label className={`flex min-h-12 items-center gap-3 rounded-2xl border border-border px-3 py-2 ${already.includes(i.id) ? "bg-muted/60" : "cursor-pointer has-checked:border-primary-dark has-checked:bg-primary-light"}`}>
              <input type="checkbox" checked={already.includes(i.id) || picked.includes(i.id)} disabled={already.includes(i.id)} onChange={() => toggle(i.id)} className="size-5 shrink-0 accent-[#9B0A26]" />
              <span className="grid min-w-0 leading-tight"><span className="truncate font-semibold">{i.title}</span><span className="truncate text-sm text-muted-foreground">{already.includes(i.id) ? "Ya está en tu plan" : i.hint}</span></span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        {picked.length === 0 && already.length > 0 ? <Button asChild size="lg" className="h-12"><a href="/mis-planes">Ver mi plan</a></Button> : <Button type="button" size="lg" className="h-12" disabled={busy || picked.length === 0} onClick={() => void go()}>{busy ? "Guardando…" : `Guardar ${picked.length} en mi plan`}</Button>}
        <Button type="button" variant="ghost" size="lg" className="h-12" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
      {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  )
}
