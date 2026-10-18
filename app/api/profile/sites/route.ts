import { getCachedUserSites } from "@/presentation/profile/lib/cachedProfileData";
import { NextRequest, NextResponse } from "next/server";
import { canViewProfile } from "@/app/actions/_session";

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "uid parameter is required" }, { status: 400 });
  }

  if (!(await canViewProfile(uid))) {
    return NextResponse.json({ error: "Perfil no disponible" }, { status: 404 });
  }

  try {
    const sites = await getCachedUserSites(uid);

    return NextResponse.json(sites.filter((site) => site.publicationStatus === "published"));
  } catch (error) {
    console.error("Error fetching user sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch user sites" },
      { status: 500 }
    );
  }
}
