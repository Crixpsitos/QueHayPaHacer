import { getCachedUserEvents } from "@/presentation/profile/lib/cachedProfileData";
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
    const events = await getCachedUserEvents(uid);

    return NextResponse.json(events.filter((event) => event.status === "published"));
  } catch (error) {
    console.error("Error fetching user events:", error);
    return NextResponse.json(
      { error: "Failed to fetch user events" },
      { status: 500 }
    );
  }
}
