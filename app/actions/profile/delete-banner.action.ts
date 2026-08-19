"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

interface DeleteBannerResult {
  success: boolean;
  error?: string;
}

export async function deleteBannerAction(uid: string): Promise<DeleteBannerResult> {
  try {
    if (!uid) return { success: false, error: "No hay sesión activa." };

    // Verificar sesión server-side — no confiar únicamente en el uid del cliente
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) return { success: false, error: "No hay sesión activa." };
    if (tokens.decodedToken.uid !== uid) return { success: false, error: "No autorizado." };

    const { userService, storageService } = createServerContainer();
    const currentUser = await userService.getUserById(uid);

    if (!currentUser) {
      return { success: false, error: "No se encontró el perfil." };
    }

    // Leer el path ANTES de borrar (no confiamos en el cliente para esto)
    const bannerPath = currentUser.bannerPath;

    await userService.updateUser(uid, { bannerUrl: null, bannerPath: null });

    // Borrar del storage en best-effort — no bloquea si falla
    if (bannerPath) {
      try {
        await storageService.delete(bannerPath);
      } catch {
        // Storage puede ya no existir; no es crítico
      }
    }

    revalidateTag(`user-profile-${uid}`, "max");
    return { success: true };
  } catch (error) {
    console.error("Error deleting banner:", error);
    return { success: false, error: "No se pudo eliminar la portada. Intenta nuevamente." };
  }
}
