"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import type { ExternalProfileType, ExternalSocialLinks } from "@/domain/entities/studio/Studio";

/** Solo campos públicos del externo (sin managedBy/email). */
export interface ExternalProfilePublic {
  id: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  type: ExternalProfileType;
  socialLinks?: ExternalSocialLinks;
}

/** Detalle público de un perfil externo (modal de créditos del evento). */
export async function getExternalProfileAction(
  id: string,
): Promise<{ success: boolean; error?: string; profile?: ExternalProfilePublic }> {
  try {
    if (!id) return { success: false, error: "id requerido." };
    const { studioService } = createServerContainer();
    const p = await studioService.getExternalProfile(id);
    if (!p) return { success: false, error: "Perfil no encontrado." };
    return {
      success: true,
      profile: {
        id: p.id,
        displayName: p.displayName,
        photoURL: p.photoURL,
        bio: p.bio,
        type: p.type,
        socialLinks: p.socialLinks,
      },
    };
  } catch (error) {
    console.error("[GET EXTERNAL PROFILE ERROR]", error);
    return { success: false, error: "No se pudo cargar el perfil." };
  }
}
