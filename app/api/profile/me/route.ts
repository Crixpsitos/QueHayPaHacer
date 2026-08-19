import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import {
  getCachedUserBadges,
  getCachedUserEvents,
  getCachedUserLikes,
  getCachedUserSites,
} from "@/presentation/profile/lib/cachedProfileData";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const tokens = await getTokens(await cookies(), authConfig);

  if (!tokens) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uid } = tokens.decodedToken;

  try {
    const [events, sites, likes, badges] = await Promise.all([
      getCachedUserEvents(uid),
      getCachedUserSites(uid),
      getCachedUserLikes(uid),
      getCachedUserBadges(uid),
    ]);

    return NextResponse.json({ events, sites, likes, badges });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return NextResponse.json({ error: "Failed to fetch profile data" }, { status: 500 });
  }
}
