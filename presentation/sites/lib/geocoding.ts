import type { GeocodingResult } from "../view-models/SiteFormViewModel"
import { IBAGUE_CENTER } from "./constants"

const PHOTON = "https://photon.komoot.io"

function buildAddress(p: Record<string, string | undefined>): string {
  // city/state/country excluded — shown separately below the input
  const parts = [p.name, p.street, p.district, p.locality]
    .filter(Boolean) as string[]
  const seen = new Set<string>()
  return parts.filter((v) => { if (seen.has(v)) return false; seen.add(v); return true }).join(", ")
}

export async function forwardGeocode(query: string): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: `${query}, ibagué`,   // sesgar resultados a Ibagué
    limit: "5",
    lang: "default",
    lat: String(IBAGUE_CENTER.latitude),
    lon: String(IBAGUE_CENTER.longitude),
    zoom: "12",
  })
  const res = await fetch(`${PHOTON}/api?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.features ?? []).map((f: any, i: number) => {
    const p = f.properties
    const label = [p.name, p.street].filter(Boolean).join(", ") || "Lugar"
    const address = buildAddress(p)
    return {
      id: String(p.osm_id ?? i),
      label,
      address,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }
  })
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const res = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lng}&lang=en`)
  if (!res.ok) return null
  const data = await res.json()
  const f = data.features?.[0]
  if (!f) return null
  return buildAddress(f.properties) || null
}
