"use server";

import { getSessionUid } from "@/app/actions/_session";

import { getFirebaseAdminAuth } from "@/infraestructure/firebase/config/admin/firebase";

interface ChangePasswordPayload {
  uid: string;
  newPassword: string;
  /** ID token emitido tras reauthenticateWithCredential en el cliente. */
  idToken: string;
}

// Ventana de "login reciente" exigida para cambiar la contraseña.
const MAX_AUTH_AGE_SECONDS = 5 * 60;

interface ChangePasswordResult {
  success: boolean;
  error?: string;
  message?: string;
}

export async function changePasswordAction(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResult> {
  try {
    const { uid, newPassword, idToken } = payload;
    if (!uid || (await getSessionUid()) !== uid) return { success: false, error: "No autorizado." };

    const auth = getFirebaseAdminAuth();
    const decoded = idToken ? await auth.verifyIdToken(idToken).catch(() => null) : null;
    if (!decoded || decoded.uid !== uid || Date.now() / 1000 - decoded.auth_time > MAX_AUTH_AGE_SECONDS) {
      return { success: false, error: "Vuelve a ingresar tu contraseña actual." };
    }

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
    }

    return {
      success: false,
      error: "Error al cambiar la contraseña. Intenta de nuevo.",
    };
  }
}
