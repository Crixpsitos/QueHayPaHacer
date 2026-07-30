"use server";

import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";

/**
 * Devuelve qué sitios del array ya tiene liked el usuario actual.
 * Retorna {} si no está autenticado.
 */
export async function getSiteLikesAction(
  siteIds: string[],
): Promise<Record<string, boolean>> {
  if (siteIds.length === 0) return {};

  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) return {};

  const userId = tokens.decodedToken.uid;
  const { siteInteractionService } = createServerContainer();

  return siteInteractionService.findLikedByUser(siteIds, userId);
}
