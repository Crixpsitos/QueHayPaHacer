"use client"

import { useState } from "react"
import { Bike, Bus, Car, Footprints, LocateFixed, Navigation } from "lucide-react"
import { cn } from "@/app/lib/utils/cn"
import {
  adviseTravel, busRoutesToOffer, googleMapsDirectionsUrl, haversineKm,
  type DirectionsAdvice, type LatLng, type TravelMode,
} from "@/domain/entities/sites/directions"
import type { SiteTransitView } from "@/domain/entities/sites/value-objects/SiteTransit"

type State =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "ready"; advice: DirectionsAdvice }
  | { kind: "denied" }
  | { kind: "unavailable" }
  | { kind: "error" }

const MODE: Record<TravelMode, { label: string; Icon: typeof Car }> = {
  walk: { label: "Caminando", Icon: Footprints },
  bike: { label: "En bici", Icon: Bike },
  motor: { label: "Taxi, moto o carro", Icon: Car },
}

const km = (n: number) => `${n.toFixed(1).replace(".", ",")} km`
const distanceText = (straightKm: number) =>
  straightKm < 1 ? `unos ${Math.max(50, Math.round((straightKm * 1000) / 50) * 50)} m` : km(straightKm)

const listFormat = new Intl.ListFormat("es", { style: "long", type: "conjunction" })

const MESSAGES: Record<"denied" | "unavailable" | "error", string> = {
  denied: "No tenemos permiso para ver tu ubicación. Puedes activarla en el navegador o abrir el mapa y poner tu punto de partida allí.",
  unavailable: "Este dispositivo no permite obtener la ubicación. Abre el mapa y pon tu punto de partida allí.",
  error: "No pudimos ubicarte. Intenta de nuevo o abre el mapa y pon tu punto de partida allí.",
}

/**
 * "¿Cómo llego?". La ubicación se pide SOLO al tocar el botón, se usa en este dispositivo y no se guarda ni se
 * envía. Los tiempos son aproximados. El bus solo aparece si el dueño informó rutas, no están "por confirmar" y la
 * distancia por calle supera 1 km; va sin minutos (no se estima el tiempo de un bus).
 */
export function HowToGetThere({ destination, transit }: { destination: LatLng; transit?: SiteTransitView | null }) {
  const [state, setState] = useState<State>({ kind: "idle" })

  const locate = () => {
    if (!("geolocation" in navigator)) return setState({ kind: "unavailable" })
    setState({ kind: "locating" })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const straightKm = haversineKm({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }, destination)
        setState({ kind: "ready", advice: adviseTravel(straightKm) })
      },
      (err) => setState({ kind: err.code === err.PERMISSION_DENIED ? "denied" : "error" }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  }

  const busy = state.kind === "locating"
  const buses = state.kind === "ready" && !state.advice.far ? busRoutesToOffer(state.advice.routeKm, transit) : []
  return (
    <div className="mt-4 rounded-2xl border border-[#E4E4E7] p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#09090B]">
        <Navigation className="size-4 text-[#E63946]" aria-hidden /> ¿Cómo llego?
      </h3>
      <p className="mt-1 text-xs text-[#71717A]">
        Calcula la distancia desde donde estás. Tu ubicación se usa solo en tu dispositivo y no se guarda.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={locate}
          disabled={busy}
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#09090B] px-4 text-sm font-semibold text-white transition-opacity",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#09090B] disabled:opacity-60",
          )}
        >
          <LocateFixed className={cn("size-4", busy && "animate-pulse")} aria-hidden />
          {busy ? "Buscando tu ubicación…" : state.kind === "ready" ? "Actualizar mi ubicación" : "Usar mi ubicación"}
        </button>
        <a
          href={googleMapsDirectionsUrl(destination)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#E4E4E7] px-4 text-sm font-semibold text-[#09090B] hover:bg-[#F4F4F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#09090B]"
        >
          Abrir ruta en Google Maps
        </a>
      </div>

      <div aria-live="polite" className="empty:hidden">
        {state.kind === "ready" && (
          <div className="mt-4 border-t border-[#F4F4F5] pt-3">
            <p className="text-sm text-[#09090B]">
              Estás a <strong>{distanceText(state.advice.straightKm)}</strong> en línea recta
              {!state.advice.far && state.advice.straightKm >= 1 && <> (≈ {km(state.advice.routeKm)} por calle)</>}.
            </p>
            {state.advice.far ? (
              <p className="mt-2 text-xs text-[#71717A]">
                Estás lejos de este sitio. Abre la ruta en Google Maps para ver cómo llegar desde tu ciudad.
              </p>
            ) : (
              <>
                <ul className="mt-2 grid gap-1.5">
                  {state.advice.options.map(({ mode, minutes }, i) => {
                    const { label, Icon } = MODE[mode]
                    return (
                      <li key={mode} className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm", i === 0 ? "bg-[#FDF2F4] font-medium" : "text-[#52525B]")}>
                        <Icon className="size-4 shrink-0 text-[#E63946]" aria-hidden />
                        <span className="flex-1">{label}</span>
                        <span className="tabular-nums">≈ {minutes} min</span>
                      </li>
                    )
                  })}
                  {buses.length > 0 && (
                    <li className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[#52525B]">
                      <Bus className="mt-0.5 size-4 shrink-0 text-[#E63946]" aria-hidden />
                      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                        Bus · {listFormat.format(buses)}
                        <span className="block text-xs text-[#71717A]">Informado por el dueño</span>
                      </span>
                    </li>
                  )}
                </ul>
                <p className="mt-2 text-xs text-[#71717A]">
                  Tiempos aproximados según la distancia; el tráfico y el recorrido real pueden variar.
                </p>
              </>
            )}
          </div>
        )}
        {(state.kind === "denied" || state.kind === "unavailable" || state.kind === "error") && (
          <p className="mt-3 text-xs text-[#71717A]" role="status">{MESSAGES[state.kind]}</p>
        )}
      </div>
    </div>
  )
}
