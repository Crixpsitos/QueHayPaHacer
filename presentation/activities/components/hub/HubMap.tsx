"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre"
import "maplibre-gl/dist/maplibre-gl.css"
import { cn } from "@/app/lib/utils/cn"
import { CLOCK_FIRST_HOUR, CLOCK_LAST_HOUR, clampClockHour, hhmmToMinutes, hourlyCounts, isActiveAt } from "@/domain/entities/activities/dayClock"
import { bogotaDateIso } from "@/domain/entities/activities/value-objects/occurrences"
import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"
import { IBAGUE_CENTER } from "@/presentation/sites/lib/constants"
import type { HubMapData, MapPin } from "@/presentation/activities/data/fetchers"

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "a. m." : h === 12 ? "m." : "p. m."}`
const bogotaHour = () => Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "America/Bogota" }).format(new Date()).slice(0, 2))

/**
 * Mapa del día con reloj: las barras dicen cuántas actividades empiezan cada hora; al elegir una, los pines de lo que
 * está pasando a esa hora se encienden y el resto queda en gris. La hora de «ahora» se calcula en el navegador (la página se cachea).
 */
export function HubMap({ data }: { data: HubMapData }) {
  const [hour, setHour] = useState<number | null>(null)
  const [selected, setSelected] = useState<MapPin | null>(null)
  const counts = useMemo(() => hourlyCounts(data.hours.map((hhmm) => ({ hhmm }))), [data.hours])
  const max = Math.max(1, ...counts)
  const isToday = bogotaDateIso(new Date()) === data.date

  useEffect(() => {
    const t = setTimeout(() => {
      const first = counts.findIndex((n) => n > 0)
      setHour(isToday ? clampClockHour(bogotaHour()) : first >= 0 ? CLOCK_FIRST_HOUR + first : CLOCK_FIRST_HOUR)
    }, 0)
    return () => clearTimeout(t)
  }, [counts, isToday])

  const activeIds = useMemo(() => {
    if (hour === null) return new Set(data.pins.map((p) => p.id))
    const at = hour * 60 + 30
    return new Set(data.pins.filter((p) => { const m = hhmmToMinutes(p.hhmm); return m !== null && isActiveAt(m, p.durationMinutes, at) }).map((p) => p.id))
  }, [data.pins, hour])

  const onNow = isToday && hour === clampClockHour(bogotaHour())
  return (
    <section aria-label="Mapa del día" className="grid overflow-hidden rounded-[2rem] border border-border bg-card shadow-card">
      <div className="grid gap-3 rounded-b-[1.5rem] bg-primary-dark px-4 pb-4 pt-5 text-white sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 className="font-heading text-2xl font-extrabold">{hour === null ? "El día en el mapa" : `${onNow ? "Ahora · " : ""}${hourLabel(hour)}`}</h2>
          <p className="text-sm text-white/70" aria-live="polite">{hour === null ? "" : `${activeIds.size} ${activeIds.size === 1 ? "pasando" : "pasando"} a esta hora`}</p>
        </div>
        <div role="group" aria-label="Hora del día" className="flex h-14 items-end gap-0.75">
          {counts.map((n, i) => {
            const h = CLOCK_FIRST_HOUR + i
            const on = hour === h
            return (
              <button key={h} type="button" aria-pressed={on} aria-label={`${hourLabel(h)}: ${n} ${n === 1 ? "actividad" : "actividades"}`} onClick={() => { setHour(h); setSelected(null) }}
                className="group flex h-full min-w-0 flex-1 items-end outline-none focus-visible:ring-2 focus-visible:ring-[#FFB703]">
                <span className={cn("w-full rounded-t-sm transition-colors", on ? "bg-[#FFB703]" : n ? "bg-white/70 group-hover:bg-white" : "bg-white/15")} style={{ height: `${Math.max(8, (n / max) * 100)}%` }} />
              </button>
            )
          })}
        </div>
        <div className="flex justify-between text-[0.6875rem] text-white/65" aria-hidden><span>{hourLabel(CLOCK_FIRST_HOUR)}</span><span>12 m.</span><span>6 p. m.</span><span>{hourLabel(CLOCK_LAST_HOUR)}</span></div>
        {isToday ? <div><button type="button" onClick={() => { setHour(clampClockHour(bogotaHour())); setSelected(null) }} className={cn("min-h-9 rounded-full px-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#FFB703]", onNow ? "bg-white text-foreground" : "bg-white/12")}>Ahora</button></div> : null}
      </div>

      <div className="relative h-[26rem] sm:h-[30rem]">
        <Map initialViewState={{ latitude: IBAGUE_CENTER.latitude, longitude: IBAGUE_CENTER.longitude, zoom: 12.5 }} mapStyle="https://tiles.openfreemap.org/styles/bright" scrollZoom={false} dragRotate={false} attributionControl={{ compact: true }} style={{ width: "100%", height: "100%" }} onClick={() => setSelected(null)}>
          <NavigationControl position="bottom-right" showCompass={false} />
          {data.pins.map((p) => {
            const c = categoryStyle(p.categorySlug)
            const on = activeIds.has(p.id)
            return (
              <Marker key={p.id} latitude={p.lat} longitude={p.lng} anchor="bottom" onClick={(e) => { e.originalEvent.stopPropagation(); setSelected(p) }}>
                <button type="button" aria-label={`${p.title}, ${p.placeName}`} className={cn("grid size-10 -rotate-45 place-items-center rounded-[50%_50%_50%_4px] border-2 border-white shadow-card outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring", on ? "opacity-100" : "opacity-30 grayscale", selected?.id === p.id && "ring-4 ring-[#FFB703]")} style={{ background: c.bg, color: c.ink }}>
                  <c.Icon className="size-4 rotate-45" aria-hidden />
                </button>
              </Marker>
            )
          })}
        </Map>
        {selected ? (
          <div className="absolute inset-x-3 bottom-3 grid gap-2 rounded-3xl bg-card p-4 shadow-hover sm:left-auto sm:w-96">
            <p className="text-xs font-semibold text-muted-foreground">{selected.categoryName}{selected.hhmm ? ` · ${hourLabel(Number(selected.hhmm.slice(0, 2)))}` : ""}</p>
            <h3 className="font-heading text-lg font-bold leading-snug">{selected.title}</h3>
            <p className="text-sm text-muted-foreground">{selected.placeName} · {selected.priceFrom}</p>
            <Link href={`/actividades/${selected.slug}`} className="grid min-h-11 place-items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring">Ver actividad</Link>
          </div>
        ) : null}
      </div>
      {data.withoutPlace ? <p className="px-4 py-3 text-sm text-muted-foreground sm:px-6">{data.withoutPlace} más no tienen punto fijo: míralas en la agenda de abajo.</p> : null}
    </section>
  )
}
