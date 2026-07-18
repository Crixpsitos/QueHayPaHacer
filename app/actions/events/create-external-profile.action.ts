"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { revalidatePath } from "next/cache";
import type { ExternalProfileType } from "@/domain/entities/studio/Studio";

const TYPES: ExternalProfileType[] = ["producer", "artist", "venue", "person"];

export interface CreatedExternal {
  refId: string;
  displayName: string;
  photoURL?: string;
}

/**
 * Crea un perfil externo (entra a mi red). Recibe FormData (imagen + campos).
 * Si viene `eventId`, además lo acredita en ese evento ("credit"). Solo cuentas
 * profesionales.
 */
export async function createExternalProfileAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string; external?: CreatedExternal }> {
  try {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) return { success: false, error: "No hay sesión activa." };
    const uid = tokens.decodedToken.uid;

    const eventId = String(formData.get("eventId") ?? "").trim(); // opcional
    const displayName = String(formData.get("displayName") ?? "").trim();
    const type = String(formData.get("type") ?? "") as ExternalProfileType;
    const bio = String(formData.get("bio") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    // La imagen ya se subió a GCS en el cliente (signed URL); aquí solo llega la URL.
    const photoURL = String(formData.get("photoURL") ?? "").trim() || undefined;

    const socialLinks = {
      instagram: String(formData.get("instagram") ?? "").trim() || undefined,
      facebook: String(formData.get("facebook") ?? "").trim() || undefined,
      tiktok: String(formData.get("tiktok") ?? "").trim() || undefined,
      website: String(formData.get("website") ?? "").trim() || undefined,
    };

    if (!displayName) return { success: false, error: "El nombre es obligatorio." };
    if (!TYPES.includes(type)) return { success: false, error: "Tipo inválido." };

    const { userService, studioService } = createServerContainer();

    const me = await userService.getUserById(uid);
    if (me?.accountType !== "professional") {
      return { success: false, error: "Solo cuentas profesionales pueden agregar colaboradores." };
    }

    const profile = await studioService.createExternalProfile(
      uid,
      { displayName, type, bio: bio || undefined, email: email || undefined, socialLinks },
      photoURL,
    );

    if (eventId) {
      await studioService.addCollaboratorToEvent(
        eventId,
        {
          refId: profile.id,
          kind: "external",
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          role: "credit",
        },
        uid,
      );
    }

    revalidatePath("/studio/collaborators");

    return {
      success: true,
      external: { refId: profile.id, displayName: profile.displayName, photoURL: profile.photoURL },
    };
  } catch (error) {
    console.error("[CREATE EXTERNAL PROFILE ERROR]", error);
    const message = error instanceof Error ? error.message : "No se pudo crear el perfil externo.";
    return { success: false, error: message };
  }
}
