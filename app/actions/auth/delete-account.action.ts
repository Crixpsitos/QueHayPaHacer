"use server";

import { getFirebaseAdminAuth } from "@/infraestructure/firebase/config/admin/firebase";
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

    if (!uid) {
      return {
        success: false,
        error: "No hay sesión activa para eliminar la cuenta.",
      };
    }

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
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al eliminar la cuenta. Intenta de nuevo.",
    };
  }
}
