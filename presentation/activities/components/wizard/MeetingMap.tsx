"use client"

import { useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { MEETING_TEXT_MAX } from "@/domain/entities/activities/Activity"
import { SearchLocationInput } from "@/presentation/events/components/ui/SearchLocationInput"
import { MapsLinkInput } from "@/presentation/shared/components/MapsLinkInput"
import { reverseGeocode } from "@/presentation/sites/lib/geocoding"
import { IBAGUE_CENTER } from "@/presentation/sites/lib/constants"
import { Field } from "./ui"

const MapZone = dynamic(() => import("@/presentation/events/components/mapzone/MapZone").then((m) => m.MapZone), { ssr: false, loading: () => <div className="h-72 animate-pulse bg-muted" aria-hidden /> })

interface Props {
  text: string
  geo: { lat: number; lng: number } | null
  onChange: (next: { text?: string; geo?: { lat: number; lng: number } | null }) => void
}

/**
 * Punto de encuentro fijo: se busca el lugar, se toca el mapa, se arrastra el pin o se pega un enlace de Google Maps.
 * La dirección se completa sola con la del punto (geocodificación inversa), salvo que la persona escriba la suya.
 */
export function MeetingMap({ text, geo, onChange }: Props) {
  const [finding, setFinding] = useState(false)
  const seq = useRef(0)
  const manual = useRef(text.trim().length > 0)

  const fillFromPin = async (lat: number, lng: number) => {
    const mine = ++seq.current
    setFinding(true)
    try {
      const address = await reverseGeocode(lat, lng, "default")
      if (mine === seq.current && address && !manual.current) onChange({ text: address.slice(0, MEETING_TEXT_MAX) })
    } catch { /* sin red: la dirección queda como estaba y se puede escribir */ }
    finally { if (mine === seq.current) setFinding(false) }
  }
  const setPin = (lat: number, lng: number) => { onChange({ geo: { lat, lng } }); void fillFromPin(lat, lng) }

  return (
    <div className="grid gap-4">
      <Field label="Busca el lugar" optional hint="Escribe el nombre del sitio o la calle y elígelo de la lista.">
        {() => (
          <SearchLocationInput
            cityName="Ibagué"
            countryIsoCode="CO"
            cityCoords={IBAGUE_CENTER}
            value=""
            onChange={(name, coords, address) => { manual.current = false; onChange({ text: (address || name).slice(0, MEETING_TEXT_MAX), geo: { lat: coords[1], lng: coords[0] } }) }}
          />
        )}
      </Field>

      <MapsLinkInput onCoords={setPin} />

      <div className="grid gap-1.5">
        <p className="text-sm font-semibold">Ubicación en el mapa</p>
        <p className="text-xs text-muted-foreground">Toca el mapa o arrastra el marcador. {finding ? <span className="inline-flex items-center gap-1 font-medium text-primary-dark"><Loader2 className="size-3 animate-spin" aria-hidden /> Buscando dirección…</span> : null}</p>
        <div className="overflow-hidden rounded-2xl border border-border">
          <MapZone cityCoords={IBAGUE_CENTER} pointCoords={geo} onMarkerDrag={setPin} />
        </div>
        {!geo ? <p className="text-xs text-muted-foreground">Sin pin, la ficha muestra solo la dirección escrita.</p> : null}
      </div>

      <Field label="Punto de encuentro" hint="Una dirección o un lugar conocido. Se completa sola con el pin; puedes corregirla.">
        {(id) => <Input id={id} value={text} maxLength={MEETING_TEXT_MAX} placeholder="Ej: Parque Murillo Toro, frente a la catedral" onChange={(e) => { manual.current = e.target.value.trim().length > 0; onChange({ text: e.target.value }) }} />}
      </Field>
    </div>
  )
}
