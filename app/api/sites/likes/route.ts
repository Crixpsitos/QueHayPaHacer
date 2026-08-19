import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerContainer } from "@/infraestructure/di/container";

/**
 * POST /api/sites/likes
 * Body: { ids: string[] }
 */
export async function POST(request: NextRequest) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) return NextResponse.json({});

  const userId = tokens.decodedToken.uid;
  const body = await request.json().catch(() => ({}));
  const siteIds: string[] = Array.isArray(body.ids) ? body.ids : [];

  if (siteIds.length === 0) return NextResponse.json({});

  const { siteInteractionService } = createServerContainer();
  const result = await siteInteractionService.findLikedByUser(siteIds, userId);
  return NextResponse.json(result);
}
