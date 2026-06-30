import { getCachedUserLikes } from "@/presentation/profile/lib/cachedProfileData";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { error: "uid parameter is required" },
        { status: 400 }
      );
    }

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
