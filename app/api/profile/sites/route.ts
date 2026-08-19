import { getCachedUserSites } from "@/presentation/profile/lib/cachedProfileData";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "uid parameter is required" }, { status: 400 });
  }

  try {
    const sites = await getCachedUserSites(uid);

    return NextResponse.json(sites);
  } catch (error) {
    console.error("Error fetching user sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch user sites" },
      { status: 500 }
    );
  }
}
