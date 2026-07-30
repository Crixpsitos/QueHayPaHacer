import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerContainer } from "@/infraestructure/di/container";

/**
 * GET /api/sites/likes?ids=id1,id2,id3
 *
 * Reemplaza getSiteLikesAction: las Server Actions son POST y disparan una
 * petición en cada montaje. Un GET route es semánticamente correcto para lectura.
 */
export async function GET(request: NextRequest) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) return NextResponse.json({});

  const userId = tokens.decodedToken.uid;
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const siteIds = idsParam.split(",").map((s) => s.trim()).filter(Boolean);

  if (siteIds.length === 0) return NextResponse.json({});

  const { siteInteractionService } = createServerContainer();
  const result = await siteInteractionService.findLikedByUser(siteIds, userId);
  return NextResponse.json(result);
}
