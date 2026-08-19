"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { getFirebaseAdminAuth } from "@/infraestructure/firebase/config/admin/firebase";
import { revalidateTag } from "next/cache";

interface UpdateAvatarInput {
  uid: string;
  photoURL: string;
  imagePath: string;
}

interface UpdateAvatarResult {
  success: boolean;
  error?: string;
}

const AVATAR_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-photo-url": "La URL de la foto no es valida.",
  "auth/user-not-found": "No encontramos tu usuario para actualizar la foto.",
};

function resolveAvatarErrorMessage(error: unknown): string {
  const codeFromError =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: string }).code)
      : "";

  const codeFromErrorInfo =
    typeof error === "object" && error !== null && "errorInfo" in error
      ? String(((error as { errorInfo?: { code?: string } }).errorInfo?.code ?? ""))
      : "";

  const code = codeFromError || codeFromErrorInfo;
  if (code && AVATAR_ERROR_MESSAGES[code]) {
    return AVATAR_ERROR_MESSAGES[code];
  }

  return "No se pudo actualizar la foto de perfil. Intenta nuevamente.";
}

export async function updateAvatarAction(input: UpdateAvatarInput): Promise<UpdateAvatarResult> {
  try {
    if (!input.uid || !input.photoURL || !input.imagePath) {
      return { success: false, error: "Faltan datos para actualizar la foto de perfil." };
    }

    const { userService, storageService } = createServerContainer();
    const currentUser = await userService.getUserById(input.uid);

    if (!currentUser) {
      return { success: false, error: "No encontramos tu perfil para actualizar la foto." };
    }

    const previousImagePath = currentUser.imagePath;

    await getFirebaseAdminAuth().updateUser(input.uid, {
      photoURL: input.photoURL,
    });

    await userService.updateUser(input.uid, {
      photoURL: input.photoURL,
      imagePath: input.imagePath,
    });

    if (previousImagePath && previousImagePath !== input.imagePath) {
      await storageService.delete(previousImagePath);
    }

    revalidateTag(`user-profile-${input.uid}`, "max");

    return { success: true };
  } catch (error) {
    console.error("Error updating avatar:", error);
    return {
      success: false,
      error: resolveAvatarErrorMessage(error),
    };
  }
}
