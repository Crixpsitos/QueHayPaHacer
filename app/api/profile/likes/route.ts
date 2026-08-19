import { getCachedUserLikes } from "@/presentation/profile/lib/cachedProfileData";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "uid parameter is required" }, { status: 400 });
  }

  const tokens = await getTokens(await cookies(), authConfig);

  if (!tokens) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (tokens.decodedToken.uid !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const likes = await getCachedUserLikes(uid);

    return NextResponse.json(likes);
  } catch (error) {
    console.error("Error fetching user likes:", error);
    return NextResponse.json(
      { error: "Failed to fetch user likes" },
      { status: 500 }
    );
  }
}
