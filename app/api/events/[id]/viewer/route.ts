import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { createServerContainer } from "@/infraestructure/di/container";
import { getEventAccess, getSessionUid } from "@/app/actions/_session";
import { recordEventView } from "@/app/actions/events/_recordEventView";
import {
  fetchEventDetailById,
  fetchUserLiked,
  fetchUserRegistered,
} from "@/presentation/events/data/eventDetailFetchers";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * Estado de la PERSONA que mira un evento (me gusta, inscripción, dueño, equipo). La página pública del evento es
 * igual para todos y se cachea en el CDN; esto se pide aparte desde el cliente y nunca se cachea.
 * Aquí también se registra la vista (antes la registraba el render del servidor, que ya no ve a cada visitante).
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/events/[id]/viewer">) {
  const uid = await getSessionUid();
  if (!uid) return NextResponse.json({ uid: null }, { headers: NO_STORE });

  const { id } = await ctx.params;
  const event = await fetchEventDetailById(id);
  if (!event || event.status !== "published") return NextResponse.json({ uid }, { headers: NO_STORE });

  const sessionId = request.nextUrl.searchParams.get("sessionId") ?? undefined;
  const isOwner = Boolean(event.author?.id && event.author.id === uid);

  const [liked, registered, access, owner] = await Promise.all([
    fetchUserLiked(id, uid),
    fetchUserRegistered(id, uid, sessionId),
    // Rol de equipo sin caché (los cambios de rol valen al instante); solo si no es el dueño.
    isOwner ? null : getEventAccess(id),
    isOwner ? createServerContainer().userService.getUserById(uid) : null,
  ]);

  after(() => recordEventView(id, uid));

  return NextResponse.json(
    {
      uid,
      liked,
      registered,
      isOwner,
      teamRole: access?.role,
      isPremiumOwner: owner?.plan === "premium",
    },
    { headers: NO_STORE },
  );
}
