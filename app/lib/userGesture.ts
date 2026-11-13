"use client"

/**
 * Espera el primer gesto real de la persona (toque, clic, tecla o scroll con `isTrusted`). Los bots y las visitas que no tocan nada
 * nunca lo disparan: así el prefetch por visibilidad no cuesta renders de servidor por tráfico que no navega.
 */
let touched = false
const waiting = new Set<() => void>()
let armed = false

function arm() {
  if (armed || typeof window === "undefined") return
  armed = true
  const fire = (e: Event) => {
    if (!e.isTrusted) return
    touched = true
    for (const f of waiting) f()
    waiting.clear()
    for (const n of EVENTS) window.removeEventListener(n, fire)
  }
  const EVENTS = ["pointerdown", "touchstart", "keydown", "scroll"] as const
  for (const n of EVENTS) window.addEventListener(n, fire, { passive: true })
}

export function afterUserGesture(run: () => void): () => void {
  arm()
  if (touched) { run(); return () => undefined }
  waiting.add(run)
  return () => { waiting.delete(run) }
}

/** No precargar con ahorro de datos o red lenta. */
export function networkAllowsPrefetch(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return !(c?.saveData || (c?.effectiveType && /(^|-)2g$/.test(c.effectiveType)))
}
