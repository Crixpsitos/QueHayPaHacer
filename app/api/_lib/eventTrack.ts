import { NextResponse } from "next/server"
import * as v from "valibot"
import { EventIdSchema, EventTrackBodySchema } from "@/application/dto/events/EventTrackDto"
import type { EventTrackType } from "@/domain/entities/analytics/trackTypes"
import type { TrafficSource } from "@/domain/entities/analytics/trafficSource"
import { clientIp } from "./ipRateLimit"
import { isSameOriginBeacon, readBoundedJson } from "./beaconGuard"
import { createDailyDedupe } from "./dailyDedupe"

const MAX_BODY = 1024
const DROPPED = () => new NextResponse(null, { status: 204 }) // lo descartado no se distingue de lo aceptado

interface Deps {
  record: (eventId: string, type: EventTrackType, day: string, source: TrafficSource) => Promise<void>
  day: () => string
  ipLimit: (ip: string) => boolean
  globalLimit: () => boolean
}

/**
 * Lógica de `POST /api/events/[id]/track` con sus dependencias inyectadas (testeable sin Firebase).
 * Orden: mismo origen → cuerpo ≤ 1 KB → forma válida → tope por IP → repetido de 24 h → tope global → escritura.
 * El repetido va antes del tope global para que un repetido no gaste cupo.
 */
export function createEventTrackHandler(deps: Deps) {
  const dedupe = createDailyDedupe()
  return async function handle(request: Request, id: string): Promise<NextResponse> {
    if (!isSameOriginBeacon(request.headers)) return DROPPED()
    const raw = await readBoundedJson(request, MAX_BODY)
    if (raw === null) return DROPPED()
    const body = v.safeParse(EventTrackBodySchema, raw)
    if (!v.safeParse(EventIdSchema, id).success || !body.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 })
    }
    const ip = clientIp(request)
    if (!deps.ipLimit(ip)) return new NextResponse(null, { status: 429 })
    const { type, src = "direct" } = body.output
    if (dedupe.isRepeat(ip, request.headers.get("user-agent") ?? "", `${id}:${type}`)) return DROPPED()
    if (!deps.globalLimit()) return DROPPED()
    try {
      await deps.record(id, type, deps.day(), src as TrafficSource)
    } catch (error) {
      console.error("[event-track]", error)
    }
    return new NextResponse(null, { status: 204 })
  }
}
