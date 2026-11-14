"use client"

import { useEffect, useMemo, useRef } from "react"
import Map, { AttributionControl, Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre"
import "maplibre-gl/dist/maplibre-gl.css"
import { cn } from "@/app/lib/utils/cn"
import { DEFAULT_ZOOM, IBAGUE_CENTER } from "../../lib/constants"

export interface GuiaPin { id: string; name: string; lat: number; lng: number; /** Número de la lista; sin número es un punto pequeño. */ n: number | null }

const FIT = { padding: 56, maxZoom: 15, duration: 600 }

/** Mapa de la guía: pines numerados que coinciden con la lista. Tocar un pin lo elige (la tarjeta la pinta quien lo usa). */
export default function GuiaMap({ pins, activeId, onSelect }: { pins: GuiaPin[]; activeId: string | null; onSelect: (id: string | null) => void }) {
  const ref = useRef<MapRef>(null)
  const bounds = useMemo((): [[number, number], [number, number]] | null => {
    if (!pins.length) return null
    const lats = pins.map((p) => p.lat), lngs = pins.map((p) => p.lng)
    return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]]
  }, [pins])
  // Al filtrar, el mapa se acomoda a lo que queda.
  useEffect(() => { if (bounds) ref.current?.fitBounds(bounds, FIT) }, [bounds])

  return (
    <Map
      ref={ref}
      initialViewState={bounds ? { bounds, fitBoundsOptions: FIT } : { latitude: IBAGUE_CENTER.latitude, longitude: IBAGUE_CENTER.longitude, zoom: DEFAULT_ZOOM }}
      mapStyle="https://tiles.openfreemap.org/styles/bright"
      // En celular el mapa va dentro de la página: un dedo baja la página, dos mueven el mapa.
      cooperativeGestures
      attributionControl={false}
      onClick={() => onSelect(null)}
      // La atribución arranca plegada (su botón «i» la abre): desplegada tapa medio mapa en celular.
      onLoad={(e) => { const a = e.target.getContainer().querySelector(".maplibregl-ctrl-attrib"); a?.classList.remove("maplibregl-compact-show"); a?.removeAttribute("open") }}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="top-left" showCompass={false} />
      {/* Arriba: abajo van la tarjeta del sitio elegido y «Abrir el mapa». */}
      <AttributionControl compact position="top-right" />
      {pins.map((p) => {
        const on = p.id === activeId
        return (
          <Marker key={p.id} latitude={p.lat} longitude={p.lng} anchor={p.n ? "bottom" : "center"} style={{ zIndex: on ? 3 : p.n ? 2 : 1 }} onClick={(e) => { e.originalEvent.stopPropagation(); onSelect(p.id) }}>
            {/* El marcador de maplibre ya es el botón (clic y teclado); esto es solo su dibujo. Los mismos sitios están en la lista. */}
            <span title={p.name}
              className={cn("grid cursor-pointer place-items-center border-white transition-transform motion-reduce:transition-none",
                p.n ? "size-9 origin-bottom -rotate-45 rounded-[99px_99px_99px_4px] border-[2.5px]" : "size-4 rounded-full border-2",
                on ? "scale-125 bg-primary" : "bg-primary-dark")}>
              {p.n ? <span className="rotate-45 font-heading text-[0.9375rem] font-bold text-white">{p.n}</span> : null}
            </span>
          </Marker>
        )
      })}
    </Map>
  )
}
