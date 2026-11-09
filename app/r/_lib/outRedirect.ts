import { NextResponse } from "next/server"
import { clientIp } from "@/app/api/_lib/ipRateLimit"
import { createDailyDedupe } from "@/app/api/_lib/dailyDedupe"

const ID = /^[A-Za-z0-9_-]{1,128}$/
const NOT_FOUND = () => new NextResponse("No encontrado", { status: 404, headers: { "Cache-Control": "no-store" } })

interface Deps {
  /** Destino guardado en el documento, o null (inexistente, no público, campo vacío o URL no segura). */
  resolve: (id: string, to: string | null, network: string | null) => Promise<string | null>
  record: (id: string, to: string) => Promise<void>
  ipLimit: (ip: string) => boolean
  globalLimit: () => boolean
  /** `after()` de Next en producción: contar no retrasa la redirección. */
  schedule: (fn: () => Promise<void>) => void
}

/**
 * Lógica de `GET /r/e|s/[id]?to=…`. `to` solo ELIGE qué campo del documento se usa; la URL de `Location` sale siempre del
 * documento (ver resolveTarget). Contar es best-effort: topes por IP y global y un conteo por persona/día; si se descarta
 * o falla, la persona igual llega a su destino.
 */
export function createOutHandler(deps: Deps) {
  const dedupe = createDailyDedupe()
  return async function handle(request: Request, id: string, params: URLSearchParams): Promise<NextResponse> {
    if (!ID.test(id)) return NOT_FOUND()
    const to = params.get("to")
    const target = await deps.resolve(id, to, params.get("n"))
    if (!target || !to) return NOT_FOUND()
    const ip = clientIp(request)
    const ua = request.headers.get("user-agent") ?? ""
    const resource = `${id}:${to}`
    if (request.method !== "HEAD" && deps.ipLimit(ip) && !dedupe.isRepeat(ip, ua, resource) && deps.globalLimit()) {
      deps.schedule(async () => {
        try {
          await deps.record(id, to)
          dedupe.mark(ip, ua, resource)
        } catch (error) {
          console.error("[out-redirect]", error)
        }
      })
    }
    return new NextResponse(null, { status: 307, headers: { Location: target, "Cache-Control": "no-store" } })
  }
}
