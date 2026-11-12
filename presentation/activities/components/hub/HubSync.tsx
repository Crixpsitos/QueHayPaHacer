"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { parseFilters } from "@/domain/entities/activities/filters"
import { filterHref } from "@/presentation/activities/lib/filterHref"

/**
 * Red de seguridad del hub. El router de Next guarda la página por ruta sin mirar el query: al entrar al hub por navegación
 * suave (inicio → Actividades) y luego cambiar un filtro, la URL cambia pero se pintaba el contenido anterior (el hub sin
 * filtros, con «El plan de la semana») hasta que llegaba el correcto. Si lo que se pintó (`rendered`, calculado en el
 * servidor) no coincide con la URL actual, NO se muestra ese contenido viejo: se ve un esqueleto y se pide el correcto al
 * servidor una sola vez por URL.
 */
export function HubSync({ rendered, children }: { rendered: string; children: ReactNode }) {
  const router = useRouter()
  const params = useSearchParams()
  const asked = useRef<string | null>(null)
  const wanted = filterHref(parseFilters(Object.fromEntries(params.entries())), {})
  const stale = wanted !== rendered

  useEffect(() => {
    if (!stale || asked.current === wanted) return
    asked.current = wanted
    router.refresh()
  }, [stale, wanted, router])

  if (stale) return <div className="grid gap-6" aria-busy="true" aria-label="Cargando actividades"><div className="h-64 animate-pulse rounded-[2rem] bg-muted" /><div className="h-12 animate-pulse rounded-2xl bg-muted" /><div className="h-56 animate-pulse rounded-3xl bg-muted" /></div>
  return <>{children}</>
}
