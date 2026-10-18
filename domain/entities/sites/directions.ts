/**
 * "¿Cómo llego?": distancia desde donde está la persona y qué medio conviene. Todo se calcula en el navegador
 * con la ubicación que la persona comparte; no se guarda ni se envía a ningún servidor.
 * Es una aproximación honesta: distancia en línea recta × factor de recorrido, y velocidades urbanas típicas.
 * Los buses salen solo de lo que el dueño del sitio informó (ver SiteTransit): nunca se calculan ni se estima su tiempo.
 */
export interface LatLng {
  latitude: number
  longitude: number
}

/** Coordenadas finitas, en rango y distintas de (0,0) (los sitios sin geo real guardan 0,0). */
export function isUsableCoordinates(c: Partial<LatLng> | null | undefined): c is LatLng {
  const { latitude: lat, longitude: lng } = c ?? {}
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat!) <= 90 && Math.abs(lng!) <= 180 && !(lat === 0 && lng === 0)
}

/** Distancia en línea recta (km) entre dos puntos (fórmula de Haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLng = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export type TravelMode = "walk" | "bike" | "motor"

export interface TravelOption {
  mode: TravelMode
  /** Minutos aproximados, redondeados a 5. */
  minutes: number
}

export interface DirectionsAdvice {
  straightKm: number
  /** Distancia estimada por calle (línea recta × ROUTE_FACTOR). */
  routeKm: number
  /** Del más conveniente al menos; vacío si está muy lejos para estimar. */
  options: TravelOption[]
  /** Más de FAR_KM: no se estiman tiempos (la persona no está en la ciudad). */
  far: boolean
}

export const ROUTE_FACTOR = 1.3
export const FAR_KM = 40
/** km/h urbanos aproximados (Ibagué: tráfico y pendientes). */
const SPEED = { walk: 5, bike: 12, motor: 22 } as const

const minutesFor = (km: number, speed: number) => Math.max(5, Math.round(((km / speed) * 60) / 5) * 5)

export function adviseTravel(straightKm: number): DirectionsAdvice {
  const routeKm = straightKm * ROUTE_FACTOR
  if (straightKm > FAR_KM) return { straightKm, routeKm, options: [], far: true }
  const opt = (mode: TravelMode): TravelOption => ({ mode, minutes: minutesFor(routeKm, SPEED[mode]) })

  let modes: TravelMode[]
  if (routeKm <= 1.5) modes = ["walk", "motor"]
  else if (routeKm <= 5) modes = routeKm <= 3 ? ["motor", "bike", "walk"] : ["motor", "bike"]
  else modes = ["motor"]
  return { straightKm, routeKm, options: modes.map(opt), far: false }
}

/** Enlace de ruta de Google Maps hacia el sitio; sin `travelmode` para que la persona elija el medio allí. */
export const googleMapsDirectionsUrl = (to: LatLng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${to.latitude},${to.longitude}`

/** Desde esta distancia por calle (km) vale la pena ofrecer el bus. */
export const BUS_MIN_KM = 1

/**
 * Nombres de las rutas de bus a ofrecer en "¿Cómo llego?". Solo si el sitio tiene buses informados, la distancia por
 * calle supera BUS_MIN_KM y el estado NO es "por confirmar". Sin tiempos: no se estima el tiempo de un bus.
 */
export function busRoutesToOffer(
  routeKm: number,
  transit: { unconfirmed: boolean; routes: { label: string }[] } | null | undefined,
): string[] {
  if (!transit || transit.unconfirmed || routeKm <= BUS_MIN_KM) return []
  return transit.routes.map((r) => r.label)
}
