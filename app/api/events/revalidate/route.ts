import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import * as v from "valibot";
import { hasValidBearer } from "@/app/api/_lib/bearerAuth";
import { createServerContainer } from "@/infraestructure/di/container";
import { linkedSiteIds, refreshSiteEventCounts, revalidateSitesFromRoute } from "@/app/lib/sites/siteEvents";

const Id = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/));
const Body = v.object({
  eventId: Id,
  /** Autores cuyas listas ("Mis eventos", perfil) cambian. */
  authorIds: v.optional(v.pipe(v.array(Id), v.maxLength(4))),
});

/**
 * Refresca las cachés de un evento tras un cambio hecho FUERA de la app (baja a mano en Firestore): ahí no se
 * puede llamar a `updateTag`/`revalidateTag`. Lo llama la Cloud Function `notifyEventChanges`.
 * Mismo secreto que `/api/sites/revalidate` (Bearer `SITE_REVALIDATE_WEBHOOK_SECRET`). Route Handler → `expire: 0`.
 */
export async function POST(request: Request) {
  const secret = process.env.SITE_REVALIDATE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Revalidation webhook is not configured." }, { status: 503 });
  if (!hasValidBearer(request, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = v.safeParse(Body, await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const { eventId, authorIds = [] } = parsed.output;
  // Mismos nombres que el webhook de moderación (app/api/events/moderation/route.ts).
  const tags = [
    `event-${eventId}`,
    "event-list",
    "explore",
    ...authorIds.flatMap((uid) => [`profile-events-${uid}`, `profile-stats-${uid}`]),
  ];
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  // Una baja a mano en Firestore también cambia la agenda de los sitios vinculados.
  const event = await createServerContainer().eventsService.getEventById(eventId).catch(() => null);
  revalidateSitesFromRoute(await refreshSiteEventCounts(await linkedSiteIds(event)));
  revalidatePath("/", "page");
  revalidatePath("/eventos", "layout");
  return NextResponse.json({ success: true, tags: tags.length });
}
