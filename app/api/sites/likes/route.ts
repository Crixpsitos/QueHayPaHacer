import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerContainer } from "@/infraestructure/di/container";

/**
 * POST /api/sites/likes
 * Body: { ids: string[] } (máx. 50)
 */
export async function POST(request: NextRequest) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) return NextResponse.json({});

  const userId = tokens.decodedToken.uid;
  const body = await request.json().catch(() => ({}));
  // tope de 50 ids: evita lecturas masivas a Firestore con un solo request
  const siteIds: string[] = Array.isArray(body.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string" && id.length > 0).slice(0, 50)
    : [];

  if (siteIds.length === 0) return NextResponse.json({});

  const { siteInteractionService } = createServerContainer();
  const result = await siteInteractionService.findLikedByUser(siteIds, userId);
  return NextResponse.json(result);
}
