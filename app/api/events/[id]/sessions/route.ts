import { fetchEventSessions } from "@/presentation/events/data/eventDetailFetchers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Sesiones de un evento. Reemplaza a la server action de lectura: las actions
 * son POST y no se cachean, así que cada montaje del editor golpeaba Firestore.
 *
 * El caché vive en `fetchEventSessions` ("use cache" + cacheLife("weeks") +
 * tag `event-sessions-${eventId}`, que las actions de sesión invalidan). El
 * cuerpo del handler es dinámico (lee cookies para auth), pero el hit de caché
 * evita la lectura a Firestore igualmente.
 */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/events/[id]/sessions">,
) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    // ponytail: las fechas viajan como string ISO (JSON no tiene Date). Los
    // consumidores ya hacen `new Date(session.startDate)`, así que no revivimos.
    return NextResponse.json(await fetchEventSessions(id));
  } catch (error) {
    console.error("GET /api/events/[id]/sessions error:", error);
    return NextResponse.json(
      { error: "Error al obtener las sesiones." },
      { status: 500 },
    );
  }
}
