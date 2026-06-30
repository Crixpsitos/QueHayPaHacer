import { getCachedProfileStats } from "@/presentation/profile/lib/cachedProfileData";
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

    const stats = await getCachedProfileStats(uid);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
