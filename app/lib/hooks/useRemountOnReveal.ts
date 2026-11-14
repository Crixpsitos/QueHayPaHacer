"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Llave para remontar algo que se rompe al ocultarse y volver a mostrarse la página (Cache Components guarda las páginas a las que
 * navegaste en un `Activity` oculto: al volver con «Atrás» se corren otra vez los efectos). Los mapas de react-map-gl pierden así sus
 * marcadores (el mapa queda, los puntos no). Úsala como `key` del mapa: cambia solo cuando la página reaparece.
 * ponytail: en desarrollo (StrictMode) el mapa se monta dos veces al inicio; en producción una sola.
 */
export function useRemountOnReveal(): number {
  const [key, setKey] = useState(0)
  const hidden = useRef(false)
  useEffect(() => {
    if (hidden.current) {
      hidden.current = false
      setKey((k) => k + 1)
    }
    return () => { hidden.current = true }
  }, [])
  return key
}
