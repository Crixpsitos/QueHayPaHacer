import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";

const fetchLike = async (eventId: string, userId: string): Promise<boolean> => {
  "use cache";
  cacheLife("hours");
  cacheTag(`event-interaction-${userId}-${eventId}`);
  const { eventInteractionsService } = createServerContainer();
  const interaction = await eventInteractionsService.getByEventAndUser(eventId, userId);
  return !!interaction?.liked;
};

async function getLikes(request: NextRequest, ids: string[]) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid || ids.length === 0) return NextResponse.json({});
  const userId = tokens.decodedToken.uid;
  const results = await Promise.all(ids.map(async (id) => ({ id, liked: await fetchLike(id, userId) })));
  return NextResponse.json(Object.fromEntries(results.map(({ id, liked }) => [id, liked])));
}

/** GET /api/events/likes?ids=id1,id2 */
export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
  return getLikes(request, ids);
}

/** POST /api/events/likes  body: { ids: string[] } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { ids?: string[] };
    const ids = (body.ids ?? []).filter(Boolean);
    return getLikes(request, ids);
  } catch {
    return NextResponse.json({});
  }
}
