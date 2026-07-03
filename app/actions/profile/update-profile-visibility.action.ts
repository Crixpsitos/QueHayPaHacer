"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { revalidateTag } from "next/cache";

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

    if (!uid) {
      return {
        success: false,
        error: "No hay sesión activa.",
      };
    }

    const { userService } = createServerContainer();

    // Actualizar la visibilidad del perfil en la BD
    await userService.updateUser(uid, {
      isPublic,
    });

    // Invalidar SOLO los cache tags del perfil PÚBLICO (lo que ven otros usuarios)
    // No invalidamos el cache del perfil privado para evitar un refresh innecesario
    revalidateTag(`profile-stats-${uid}`, "max");
    revalidateTag(`profile-events-${uid}`, "max");
    revalidateTag(`profile-sites-${uid}`, "max");
    revalidateTag(`profile-likes-${uid}`, "max");
    revalidateTag(`profile-badges-${uid}`, "max");

    const visibilityText = isPublic ? "público" : "privado";
    return {
      success: true,
      message: `Tu perfil es ahora ${visibilityText}.`,
    };
  } catch (error) {
    console.error("[UPDATE PROFILE VISIBILITY ERROR]", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al actualizar la visibilidad del perfil. Intenta de nuevo.",
    };
  }
}
