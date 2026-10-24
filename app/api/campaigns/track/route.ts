import { NextResponse, type NextRequest } from "next/server";
import * as v from "valibot";
import { createServerContainer } from "@/infraestructure/di/container";
import { bogotaDay } from "@/domain/entities/sites/siteStats";
import { clientIp, createIpLimiter } from "@/app/api/_lib/ipRateLimit";

const Id = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/));
const Body = v.object({
  events: v.pipe(v.array(v.object({ id: Id, type: v.picklist(["view", "click"]) })), v.minLength(1), v.maxLength(10)),
});

const allowed = createIpLimiter(60);

/**
 * Cuenta vistas y clics de un banner (para anunciantes). Público: lo llama el navegador con sendBeacon.
 * Campañas inexistentes se ignoran; cada IP tiene un tope por minuto.
 */
export async function POST(request: NextRequest) {
  const parsed = v.safeParse(Body, await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const { events } = parsed.output;
  if (!allowed(clientIp(request), events.length)) return new NextResponse(null, { status: 429 });

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
