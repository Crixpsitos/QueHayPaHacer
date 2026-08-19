"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import type { Collaborator } from "@/domain/entities/studio/Studio";

/** Mi red de colaboradores (aceptados + externos) para el editor de evento. */
export async function getMyCollaboratorsAction(): Promise<{
  success: boolean;
  error?: string;
  collaborators?: Collaborator[];
}> {
  try {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) return { success: false, error: "No hay sesión activa." };

    const { studioService } = createServerContainer();
    const collaborators = await studioService.getCollaborators(tokens.decodedToken.uid);
    return { success: true, collaborators };
  } catch (error) {
    console.error("[GET MY COLLABORATORS ERROR]", error);
    return { success: false, error: "No se pudieron cargar tus colaboradores." };
  }
}
