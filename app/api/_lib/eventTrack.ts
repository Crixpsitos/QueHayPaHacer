import { NextResponse } from "next/server"
import * as v from "valibot"
import { EventIdSchema, EventTrackBodySchema } from "@/application/dto/events/EventTrackDto"
import { ActivityIdSchema, ActivityTrackBodySchema } from "@/application/dto/activities/ActivityTrackDto"
import type { ActivityTrackType, EventTrackType } from "@/domain/entities/analytics/trackTypes"
import type { TrafficSource } from "@/domain/entities/analytics/trafficSource"
import { clientIp } from "./ipRateLimit"
import { isSameOriginBeacon, readBoundedJson } from "./beaconGuard"
import { createDailyDedupe } from "./dailyDedupe"

const MAX_BODY = 1024
const DROPPED = () => new NextResponse(null, { status: 204 }) // lo descartado no se distingue de lo aceptado

interface Deps<T extends string = EventTrackType> {
  record: (id: string, type: T, day: string, source: TrafficSource) => Promise<void>
  day: () => string
  ipLimit: (ip: string) => boolean
  globalLimit: () => boolean
}

/**
 * Lógica de `POST /api/events/[id]/track` con sus dependencias inyectadas (testeable sin Firebase).
 * Orden: mismo origen → cuerpo ≤ 1 KB → forma válida → tope por IP → repetido de 24 h → tope global → escritura → marca.
 * El repetido va antes del tope global para que un repetido no gaste cupo; la marca va al final (ver dailyDedupe).
 */
export const createEventTrackHandler = (deps: Deps) => createTrackHandler<EventTrackType>(deps, EventIdSchema, EventTrackBodySchema, "event-track")

/** Mismo flujo para actividades (view/directions/cta/share). */
export const createActivityTrackHandler = (deps: Deps<ActivityTrackType>) => createTrackHandler<ActivityTrackType>(deps, ActivityIdSchema, ActivityTrackBodySchema, "activity-track")

type BodySchema = typeof EventTrackBodySchema | typeof ActivityTrackBodySchema

function createTrackHandler<T extends string>(deps: Deps<T>, idSchema: typeof EventIdSchema, bodySchema: BodySchema, label: string) {
  const dedupe = createDailyDedupe()
  return async function handle(request: Request, id: string): Promise<NextResponse> {
    if (!isSameOriginBeacon(request.headers)) return DROPPED()
    const raw = await readBoundedJson(request, MAX_BODY)
    if (raw === null) return DROPPED()
    const body = v.safeParse(bodySchema, raw)
    if (!v.safeParse(idSchema, id).success || !body.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 })
    }
    const ip = clientIp(request)
    if (!deps.ipLimit(ip)) return new NextResponse(null, { status: 429 })
    const { type, src = "direct" } = body.output as { type: T; src?: string }
    const ua = request.headers.get("user-agent") ?? ""
    if (dedupe.isRepeat(ip, ua, `${id}:${type}`)) return DROPPED()
    if (!deps.globalLimit()) return DROPPED()
    try {
      await deps.record(id, type, deps.day(), src as TrafficSource)
      dedupe.mark(ip, ua, `${id}:${type}`) // solo si se escribió: un fallo no deja a la persona sin su conteo
    } catch (error) {
      console.error(`[${label}]`, error)
    }
    return new NextResponse(null, { status: 204 })
  }
}
