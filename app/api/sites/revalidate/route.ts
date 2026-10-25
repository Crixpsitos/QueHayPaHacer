import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import * as v from "valibot";
import { hasValidBearer } from "@/app/api/_lib/bearerAuth";
import { siteTagsToRevalidate } from "@/app/api/sites/_lib/siteTags";

const Body = v.object({
  siteId: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/)),
  /** Autores cuyas listas ("Mis sitios", perfil) cambian: el actual y, si cambió, el anterior. */
  authorIds: v.optional(v.pipe(v.array(v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/))), v.maxLength(4))),
});

/**
 * Refresca las cachés de un sitio tras un cambio hecho FUERA de la app (moderación a mano en Firestore,
 * scripts de reclamos): ahí no se puede llamar a `updateTag`/`revalidateTag`. Lo llama la Cloud Function
 * `notifySiteModeration` y, si están configuradas las variables, `scripts/list-site-claims.ts`.
 * Auth: Bearer `SITE_REVALIDATE_WEBHOOK_SECRET`. Route Handler → `expire: 0` (updateTag es solo de Server Actions).
 */
export async function POST(request: Request) {
  const secret = process.env.SITE_REVALIDATE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Revalidation webhook is not configured." }, { status: 503 });
  if (!hasValidBearer(request, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = v.safeParse(Body, await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const { siteId, authorIds = [] } = parsed.output;
  const tags = siteTagsToRevalidate(siteId, authorIds);
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ success: true, tags: tags.length });
}
