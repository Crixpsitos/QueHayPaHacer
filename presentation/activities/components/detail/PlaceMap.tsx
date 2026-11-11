"use client"

import Map, { Marker } from "react-map-gl/maplibre"
import "maplibre-gl/dist/maplibre-gl.css"
import type { CSSProperties } from "react"

/** Mapa de solo lectura con un pin del color de la categoría. Sin arrastre ni zoom con la rueda: es para ubicarse, no para explorar. */
export default function PlaceMap({ latitude, longitude, bg, ink, label }: { latitude: number; longitude: number; bg: string; ink: string; label: string }) {
  const pin: CSSProperties = { background: bg, color: ink }
  return (
    <Map
      initialViewState={{ latitude, longitude, zoom: 15.5 }}
      mapStyle="https://tiles.openfreemap.org/styles/bright"
      scrollZoom={false}
      dragRotate={false}
      attributionControl={{ compact: true }}
      style={{ width: "100%", height: "100%" }}
      aria-label={label}
    >
      <Marker latitude={latitude} longitude={longitude} anchor="bottom">
        <span className="grid size-10 -rotate-45 place-items-center rounded-[50%_50%_50%_4px] border-2 border-white shadow-card" style={pin}><span className="size-3 rotate-45 rounded-full bg-current" /></span>
      </Marker>
    </Map>
  )
}
