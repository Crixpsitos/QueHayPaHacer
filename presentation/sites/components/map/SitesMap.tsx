"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Map, {
  Marker,
  NavigationControl,
  type MapRef,
  type MapLayerMouseEvent,
  type MarkerDragEvent,
} from "react-map-gl/maplibre"
import { AnimatePresence, motion } from "motion/react"
import { Home, Minus, MousePointerClick, Plus } from "lucide-react"
import Link from "next/link"
import "maplibre-gl/dist/maplibre-gl.css"

import { MapSearch } from "./MapSearch"
import { PickMarkerPin, BrowseMarkerPin } from "./SiteMarker"
import { IBAGUE_CENTER, DEFAULT_ZOOM } from "../../lib/constants"
import type { Coordinates, GeocodingResult, MapSiteMarker } from "../../view-models/SiteFormViewModel"
import { cn } from "@/app/lib/utils/cn"

// ── Browse mode ──────────────────────────────────────────────────────────────

interface BrowseProps {
  mode: "browse"
  markers: MapSiteMarker[]
  hoveredId: string | null
  selectedId: string | null
  onHoverSite: (id: string | null) => void
  onSelectSite: (id: string) => void
  focus?: Coordinates | null
  focusNonce?: number
}

// ── Pick mode ────────────────────────────────────────────────────────────────

interface PickProps {
  mode: "pick"
  coordinates: Coordinates | null
  coverUrl?: string
  onPick: (coords: Coordinates, address?: string) => void
}

type SitesMapProps = BrowseProps | PickProps

export function SitesMap(props: SitesMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [dragging, setDragging] = useState(false)

  // flyTo when list card is clicked
  useEffect(() => {
    if (props.mode !== "browse" || !props.focus) return
    mapRef.current?.flyTo({
      center: [props.focus.longitude, props.focus.latitude],
      zoom: 15,
      duration: 1200,
      essential: true,
    })
  }, [props.mode === "browse" && props.focus, props.mode === "browse" && (props as BrowseProps).focusNonce])

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (props.mode !== "pick") return
      props.onPick({ latitude: e.lngLat.lat, longitude: e.lngLat.lng })
    },
    [props],
  )

  const handleDragEnd = useCallback(
    (e: MarkerDragEvent) => {
      if (props.mode !== "pick") return
      setDragging(false)
      props.onPick({ latitude: e.lngLat.lat, longitude: e.lngLat.lng })
    },
    [props],
  )

  const handleSearchSelect = useCallback(
    (r: GeocodingResult) => {
      mapRef.current?.flyTo({ center: [r.lng, r.lat], zoom: 16, duration: 1400 })
      if (props.mode === "pick") props.onPick({ latitude: r.lat, longitude: r.lng }, r.address)
    },
    [props],
  )

  const cursor = props.mode === "pick"
    ? ((props as PickProps).coordinates ? "grab" : "crosshair")
    : undefined

  return (
    <div className="relative size-full overflow-hidden">
      <Map
        ref={mapRef}
        initialViewState={{ latitude: IBAGUE_CENTER.latitude, longitude: IBAGUE_CENTER.longitude, zoom: DEFAULT_ZOOM }}
        mapStyle="https://tiles.openfreemap.org/styles/bright"
        onClick={handleClick}
        cursor={cursor}
        attributionControl={{ compact: true }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* browse mode: native controls at bottom-right */}
        {props.mode === "browse" && <NavigationControl position="bottom-right" showCompass={false} />}

        {/* Browse markers */}
        {props.mode === "browse" && (props as BrowseProps).markers.map((m) => (
          <Marker
            key={m.id}
            latitude={m.coordinates.latitude}
            longitude={m.coordinates.longitude}
            anchor="bottom"
            style={{ cursor: "pointer" }}
            onClick={(e) => { e.originalEvent.stopPropagation(); (props as BrowseProps).onSelectSite(m.id) }}
          >
            <div
              onMouseEnter={() => (props as BrowseProps).onHoverSite(m.id)}
              onMouseLeave={() => (props as BrowseProps).onHoverSite(null)}
            >
              <BrowseMarkerPin
                status={m.status}
                name={m.name}
                coverUrl={m.coverUrl}
                active={(props as BrowseProps).hoveredId === m.id || (props as BrowseProps).selectedId === m.id}
              />
            </div>
          </Marker>
        ))}

        {/* Pick marker */}
        {props.mode === "pick" && (props as PickProps).coordinates && (
          <Marker
            latitude={(props as PickProps).coordinates!.latitude}
            longitude={(props as PickProps).coordinates!.longitude}
            anchor="bottom"
            draggable
            onDragStart={() => setDragging(true)}
            onDragEnd={handleDragEnd}
          >
            <PickMarkerPin coverUrl={(props as PickProps).coverUrl} lifted={dragging} />
          </Marker>
        )}
      </Map>

      {/* pick mode: zoom buttons centered on the right, above the form drawer */}
      {props.mode === "pick" && (
        <div className="pointer-events-none absolute inset-y-0 right-3 z-20 flex flex-col items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="pointer-events-auto flex size-9 items-center justify-center rounded-lg border border-border bg-background/95 shadow-md backdrop-blur transition-colors hover:bg-muted"
            aria-label="Acercar"
          >
            <Plus className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="pointer-events-auto flex size-9 items-center justify-center rounded-lg border border-border bg-background/95 shadow-md backdrop-blur transition-colors hover:bg-muted"
            aria-label="Alejar"
          >
            <Minus className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {/* Overlay: círculo Home (browse) morfa en barra de búsqueda (pick).
          Usa animate width/height (CSS real) — NO layout/scale — para que
          overflow-hidden clipee los hijos sin distorsionarlos. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start px-4 pt-4 sm:px-5">
        <div className="w-full max-w-sm">
          <motion.div
            animate={{
              width:  props.mode === "pick" ? "100%" : 36,
              height: 36,
              borderRadius: props.mode === "pick" ? 24 : 18,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="pointer-events-auto overflow-hidden border border-border bg-background/95 shadow-md backdrop-blur"
          >
            <AnimatePresence mode="wait" initial={false}>
              {props.mode === "browse" ? (
                <motion.div
                  key="home"
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { delay: 0.22, duration: 0.14 } }}
                  exit={{ y: -8, opacity: 0, transition: { duration: 0.07 } }}
                  className="flex size-9 items-center justify-center"
                >
                  <Link href="/" aria-label="Ir al inicio" className="flex size-full items-center justify-center text-foreground/60 transition-colors hover:text-foreground">
                    <Home className="size-4" aria-hidden />
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="search"
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { delay: 0.16, duration: 0.14 } }}
                  exit={{ y: -8, opacity: 0, transition: { duration: 0.07 } }}
                  className="size-full"
                >
                  <MapSearch onSelect={handleSearchSelect} embedded />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Hint solo en pick sin ubicación */}
      <AnimatePresence>
        {props.mode === "pick" && !(props as PickProps).coordinates && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-x-0 bottom-16 z-10 flex justify-center px-4 lg:bottom-6"
          >
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
              <MousePointerClick className="size-3.5 shrink-0 text-primary sm:size-4" aria-hidden />
              <span className="sm:hidden">Toca el mapa para ubicar</span>
              <span className="hidden sm:inline">Busca una dirección o haz clic en el mapa para ubicar tu sitio</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
