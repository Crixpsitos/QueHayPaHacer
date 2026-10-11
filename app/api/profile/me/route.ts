import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import {
  getCachedUserBadges,
  getCachedUserEvents,
  getCachedUserLikes,
  getCachedUserSites,
} from "@/presentation/profile/lib/cachedProfileData";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

const RECENT_ITEMS_PER_TYPE = 6;

/** `?events=all` devuelve todos los eventos propios (vista "Mis eventos"). */
export async function GET(request: NextRequest) {
  const tokens = await getTokens(await cookies(), authConfig);

  if (!tokens) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uid } = tokens.decodedToken;

  try {
    const [events, sites, likes, badges] = await Promise.all([
      getCachedUserEvents(
        uid,
        request.nextUrl.searchParams.get("events") === "all" ? undefined : RECENT_ITEMS_PER_TYPE,
      ),
      getCachedUserSites(uid, RECENT_ITEMS_PER_TYPE),
      getCachedUserLikes(uid, RECENT_ITEMS_PER_TYPE),
      getCachedUserBadges(uid, RECENT_ITEMS_PER_TYPE),
    ]);

    return NextResponse.json({ events, sites, likes, badges });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return NextResponse.json({ error: "Failed to fetch profile data" }, { status: 500 });
  }
}
