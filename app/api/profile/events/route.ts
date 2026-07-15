import { getCachedUserEvents } from "@/presentation/profile/lib/cachedProfileData";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Fuera del try: leer searchParams dispara el bail de prerender
  // (NEXT_PRERENDER_INTERRUPTED). Es señal de control de Next, no debe
  // atraparse ni loguearse — la ruta simplemente queda dinámica.
  const uid = request.nextUrl.searchParams.get("uid");

  if (!uid) {
    return NextResponse.json(
      { error: "uid parameter is required" },
      { status: 400 }
    );
  }

  try {
    const events = await getCachedUserEvents(uid);

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching user events:", error);
    return NextResponse.json(
      { error: "Failed to fetch user events" },
      { status: 500 }
    );
  }
}
