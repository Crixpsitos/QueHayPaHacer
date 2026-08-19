"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import type { UserSearchItem } from "@/domain/entities/studio/Studio";

/** Busca usuarios para invitar a mi red (typeahead). Solo cuentas profesionales. */
export async function searchCollaboratorsAction(
  query: string,
): Promise<{ success: boolean; error?: string; results?: UserSearchItem[] }> {
  try {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) return { success: false, error: "No hay sesión activa." };
    if (query.trim().length < 2) return { success: true, results: [] };

    const { userService, studioService } = createServerContainer();
    const me = await userService.getUserById(tokens.decodedToken.uid);
    if (me?.accountType !== "professional") {
      return { success: false, error: "Solo cuentas profesionales pueden invitar colaboradores." };
    }

    const results = await studioService.searchPotentialCollaborators(
      tokens.decodedToken.uid,
      query,
    );
    return { success: true, results };
  } catch (error) {
    console.error("[SEARCH COLLABORATORS ERROR]", error);
    return { success: false, error: "No se pudo buscar." };
  }
}
