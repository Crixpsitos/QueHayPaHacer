"use client"

import { useState } from "react"
import { Link2, Loader2 } from "lucide-react"
import { resolveMapsLinkAction } from "@/app/actions/places/resolve-maps-link.action"

/** «Pega el enlace de Google Maps»: saca las coordenadas exactas del lugar y las pone en el mapa. No toca la dirección escrita. */
export function MapsLinkInput({ onCoords, className }: { onCoords: (lat: number, lng: number) => void; className?: string }) {
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const go = async () => {
    if (!value.trim()) return
    setBusy(true); setMsg(null)
    const r = await resolveMapsLinkAction(value)
    setBusy(false)
    if (!r.ok) return setMsg({ ok: false, text: r.error })
    onCoords(r.coords.lat, r.coords.lng)
    setValue("")
    setMsg({ ok: true, text: "Listo: movimos el punto a esa ubicación. Tu dirección escrita no cambió." })
  }
  return (
    <div className={className ?? "grid gap-1.5"}>
      <label htmlFor="maps-link" className="flex items-center gap-1.5 text-xs font-medium text-foreground"><Link2 className="size-3.5" aria-hidden /> ¿Tienes el enlace de Google Maps?</label>
      <div className="flex gap-2">
        <input id="maps-link" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void go() } }} placeholder="Pega aquí el enlace o «4.4389, -75.2322»" className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
        <button type="button" onClick={() => void go()} disabled={busy || !value.trim()} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-primary-dark px-4 text-sm font-semibold text-white outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Usar</button>
      </div>
      {msg ? <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-xs font-medium text-[#14532D]" : "text-xs font-medium text-destructive"}>{msg.text}</p> : null}
    </div>
  )
}
