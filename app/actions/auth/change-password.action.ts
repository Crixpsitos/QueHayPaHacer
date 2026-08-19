"use server";

import { getFirebaseAdminAuth } from "@/infraestructure/firebase/config/admin/firebase";

interface ChangePasswordPayload {
  uid: string;
  newPassword: string;
}

interface ChangePasswordResult {
  success: boolean;
  error?: string;
  message?: string;
}

export async function changePasswordAction(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResult> {
  try {
    const { uid, newPassword } = payload;

    // Validar que la contraseña sea segura
    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        error: "La contraseña debe tener al menos 8 caracteres.",
      };
    }

    // Validar que contenga letras y números
    const hasLetters = /[a-zA-Z]/.test(newPassword);
    const hasNumbers = /[0-9]/.test(newPassword);

    if (!hasLetters || !hasNumbers) {
      return {
        success: false,
        error: "La contraseña debe incluir letras y números.",
      };
    }

    // Obtener la instancia de Auth de Firebase Admin
    const auth = getFirebaseAdminAuth();

    // Actualizar la contraseña en Firebase Admin
    await auth.updateUser(uid, {
      password: newPassword,
    });

    return {
      success: true,
      message: "Contraseña actualizada correctamente.",
    };
  } catch (error) {
    console.error("[CHANGE PASSWORD ERROR]", error);

    if (error instanceof Error) {
      if ((error as { code?: string }).code === "auth/user-not-found") {
        return {
          success: false,
          error: "El usuario no existe.",
        };
      }
      if (error.message.includes("INVALID_PASSWORD")) {
        return {
          success: false,
          error: "La contraseña no es válida.",
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al cambiar la contraseña. Intenta de nuevo.",
    };
  }
}
