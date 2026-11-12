"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { parseFilters } from "@/domain/entities/activities/filters"
import { filterHref } from "@/presentation/activities/lib/filterHref"

/**
 * Red de seguridad del hub. El router de Next guarda la página por ruta sin mirar el query: al entrar al hub por navegación
 * suave (inicio → Actividades) y luego cambiar un filtro, la URL cambia pero se sigue mostrando el contenido anterior
 * (sin datos nuevos, sin fechas en amarillo, sin insignias de filtros) hasta recargar. Si lo que se pintó (`rendered`, calculado
 * en el servidor) no coincide con la URL actual, se pide el contenido correcto al servidor UNA vez por URL.
 */
export function HubSync({ rendered }: { rendered: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const asked = useRef<string | null>(null)
  const wanted = filterHref(parseFilters(Object.fromEntries(params.entries())), {})

  useEffect(() => {
    if (wanted === rendered || asked.current === wanted) return
    asked.current = wanted
    router.refresh()
  }, [wanted, rendered, router])

  return null
}
