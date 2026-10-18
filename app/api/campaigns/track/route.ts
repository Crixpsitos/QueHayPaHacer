import { NextResponse, type NextRequest } from "next/server";
import * as v from "valibot";
import { createServerContainer } from "@/infraestructure/di/container";

const Id = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/));
const Body = v.object({
  events: v.pipe(v.array(v.object({ id: Id, type: v.picklist(["view", "click"]) })), v.minLength(1), v.maxLength(10)),
});

const PER_MINUTE = 60;
// ponytail: límite por IP en memoria de cada instancia (Cloud Run); con varias instancias el tope real es mayor. Redis/Firestore si hace falta.
const hits = new Map<string, { n: number; reset: number }>();
const allowed = (ip: string, n: number) => {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { n, reset: now + 60_000 });
    return true;
  }
  h.n += n;
  return h.n <= PER_MINUTE;
};

const bogotaDay = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

/**
 * Cuenta vistas y clics de un banner (para anunciantes). Público: lo llama el navegador con sendBeacon.
 * Campañas inexistentes se ignoran; cada IP tiene un tope por minuto.
 */
export async function POST(request: NextRequest) {
  const parsed = v.safeParse(Body, await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const { events } = parsed.output;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowed(ip, events.length)) return new NextResponse(null, { status: 429 });

  const totals = new Map<string, { views: number; clicks: number }>();
  for (const e of events) {
    const t = totals.get(e.id) ?? { views: 0, clicks: 0 };
    if (e.type === "view") t.views++;
    else t.clicks++;
    totals.set(e.id, t);
  }

  const { campaignService } = createServerContainer();
  const day = bogotaDay();
  try {
    await Promise.all([...totals].map(([id, t]) => campaignService.recordStats(id, t.views, t.clicks, day)));
  } catch (error) {
    console.error("[campaign-track]", error);
  }
  return new NextResponse(null, { status: 204 });
}
