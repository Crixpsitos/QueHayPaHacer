"use server";

import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { revalidateTag, updateTag } from "next/cache";

export type SiteInteractionType = "like" | "unlike" | "share";

export interface RecordSiteInteractionResult {
  success: boolean;
  authRequired?: boolean;
  error?: string;
}

export async function recordSiteInteractionAction(
  siteId: string,
  type: SiteInteractionType,
): Promise<RecordSiteInteractionResult> {
  if (!siteId?.trim()) return { success: false, error: "ID inválido." };

  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    return { success: false, authRequired: true, error: "Debes iniciar sesión para interactuar." };
  }

  const userId = tokens.decodedToken.uid;
  const { siteInteractionService } = createServerContainer();

  try {
    if (type === "like" || type === "unlike") {
      await siteInteractionService.registerLike(siteId, userId, type === "like");
    } else {
      await siteInteractionService.registerShare(siteId, userId);
    }

    updateTag(`site-${siteId}`);
    revalidateTag(`site-${siteId}`, "max");
    return { success: true };
  } catch (e) {
    console.error("[recordSiteInteraction]", e);
    return { success: false, error: "No se pudo registrar la interacción." };
  }
}

