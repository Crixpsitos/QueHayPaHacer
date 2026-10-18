"use server";

import { getSessionUid } from "@/app/actions/_session";

import { createServerContainer } from "@/infraestructure/di/container";
import { updateTag } from "next/cache";

interface UpdateProfileVisibilityPayload {
  uid: string;
  isPublic: boolean;
}

interface UpdateProfileVisibilityResult {
  success: boolean;
  error?: string;
  message?: string;
}

export async function updateProfileVisibilityAction(
  payload: UpdateProfileVisibilityPayload,
): Promise<UpdateProfileVisibilityResult> {
  try {
    const { uid, isPublic } = payload;
    if (!uid || (await getSessionUid()) !== uid) return { success: false, error: "No autorizado." };

    const { userService } = createServerContainer();
    const user = await userService.getUserById(uid);

    if (!user) {
      return { success: false, error: "No encontramos tu perfil." };
    }

    if (isPublic && user.participation === "consumer") {
      return {
        success: false,
        error: "Los perfiles consumidores siempre son privados.",
      };
    }

    // Actualizar la visibilidad del perfil en la BD
    await userService.updateUser(uid, {
      isPublic,
    });

    // isPublic vive en user-profile-${uid}: read-your-writes para el propio usuario.
    updateTag(`user-profile-${uid}`);

    const visibilityText = isPublic ? "público" : "privado";
    return {
      success: true,
      message: `Tu perfil es ahora ${visibilityText}.`,
    };
  } catch (error) {
    console.error("[UPDATE PROFILE VISIBILITY ERROR]", error);

    return {
      success: false,
      error: "Error al actualizar la visibilidad del perfil. Intenta de nuevo.",
    };
  }
}
