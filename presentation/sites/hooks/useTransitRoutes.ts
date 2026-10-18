"use client"

import { useEffect, useState } from "react"
import { getTransitRoutesAction } from "@/app/actions/config/get-transit-routes.action"
import type { TransitRoute } from "@/domain/entities/sites/value-objects/SiteTransit"

/**
 * Catálogo de rutas de bus (cacheado en el servidor). Una sola petición por carga de página, compartida por
 * todos los montajes del formulario (escritorio + drawer móvil). `null` mientras carga.
 */
let promise: Promise<TransitRoute[]> | null = null

export function useTransitRoutes(): TransitRoute[] | null {
  const [routes, setRoutes] = useState<TransitRoute[] | null>(null)
  useEffect(() => {
    let alive = true
    promise ??= getTransitRoutesAction().catch(() => { promise = null; return [] as TransitRoute[] })
    promise.then((r) => alive && setRoutes(r))
    return () => { alive = false }
  }, [])
  return routes
}
