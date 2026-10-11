"use server";

import { getSessionUid } from "@/app/actions/_session";

import { authConfig, getFirebaseAdminAuth } from "@/infraestructure/firebase/config/admin/firebase";
import { removeServerCookies } from "next-firebase-auth-edge/next/cookies";
import { cookies } from "next/headers";
import { createServerContainer } from "@/infraestructure/di/container";

interface DeleteAccountPayload {
  uid: string;
}

interface DeleteAccountResult {
  success: boolean;
  error?: string;
  message?: string;
}

export async function deleteAccountAction(
  payload: DeleteAccountPayload,
): Promise<DeleteAccountResult> {
  try {
    const { uid } = payload;
    if (!uid || (await getSessionUid()) !== uid) return { success: false, error: "No autorizado." };

    const { userService } = createServerContainer();

    // Eliminar datos del usuario de la base de datos
    try {
      await userService.deleteUser(uid);
    } catch (dbError) {
      console.error("[DELETE USER FROM DB ERROR]", dbError);
      // Continuamos incluso si falla la eliminación de BD, ya que el objetivo es eliminar la cuenta
    }

    // Eliminar el usuario de Firebase Auth
    await getFirebaseAdminAuth().deleteUser(uid);
    // Sin esto la cookie de sesión sigue viva hasta expirar.
    await removeServerCookies(await cookies(), { cookieName: authConfig.cookieName });

    return {
      success: true,
      message: "Cuenta eliminada correctamente. Todos tus datos han sido removidos.",
    };
  } catch (error) {
    console.error("[DELETE ACCOUNT ERROR]", error);

    if (error instanceof Error) {
      if (error.message.includes("user-not-found")) {
        return {
          success: false,
          error: "El usuario no existe.",
        };
      }
    }

    return {
      success: false,
      error: "Error al eliminar la cuenta. Intenta de nuevo.",
    };
  }
}
