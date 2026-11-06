"use client"

import { useEffect } from "react"
import { toast } from "sonner"

const CHECK_EVERY_MS = 3 * 60 * 1000
const TOAST_ID = "new-version"

async function currentRevision(): Promise<string | null> {
  try {
    const res = await fetch("/api/version", { cache: "no-store" })
    if (!res.ok) return null
    const { revision } = (await res.json()) as { revision: string | null }
    return revision ?? null
  } catch {
    return null
  }
}

/**
 * Tras un despliegue, una pestaña abierta con la versión anterior falla al guardar ("Failed to find Server Action").
 * Compara la revisión del servidor al cargar contra la de ahora (al volver a la pestaña y cada 3 min) y avisa.
 * Sin K_REVISION (local) no hace nada.
 */
export function NewVersionNotice() {
  useEffect(() => {
    let baseline: string | null = null
    let stopped = false

    const check = async () => {
      const now = await currentRevision()
      if (stopped || !now) return
      if (!baseline) { baseline = now; return }
      if (now !== baseline) {
        toast("Hay una versión nueva de Que Hay Pa Hacer", {
          id: TOAST_ID,
          duration: Infinity,
          description: "Guarda lo que estás haciendo y recarga la página para seguir sin errores.",
          action: { label: "Recargar", onClick: () => window.location.reload() },
        })
      }
    }

    void check()
    const onVisible = () => { if (document.visibilityState === "visible") void check() }
    document.addEventListener("visibilitychange", onVisible)
    const timer = window.setInterval(check, CHECK_EVERY_MS)
    return () => { stopped = true; document.removeEventListener("visibilitychange", onVisible); window.clearInterval(timer) }
  }, [])

  return null
}
