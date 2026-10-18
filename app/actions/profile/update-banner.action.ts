"use server";

import { getSessionUid } from "@/app/actions/_session";

import { createServerContainer } from "@/infraestructure/di/container";
import { updateTag } from "next/cache";

interface UpdateBannerInput {
  uid: string;
  bannerUrl: string;
  bannerPath: string;
}

interface UpdateBannerResult {
  success: boolean;
  error?: string;
}

export async function updateBannerAction(
  input: UpdateBannerInput,
): Promise<UpdateBannerResult> {
  try {
    if (!input.uid || (await getSessionUid()) !== input.uid) return { success: false, error: "No autorizado." };
    if (!input.uid || !input.bannerUrl || !input.bannerPath) {
      return { success: false, error: "Faltan datos para actualizar el banner." };
    }

    const { userService, storageService } = createServerContainer();
    // Solo archivos propios: el path anterior se borra con credenciales admin.
    const ownPrefix = `public/profile/${input.uid}/banner/`;
    const expectedUrl = `https://storage.googleapis.com/${storageService.getBucketName}/${input.bannerPath}`;
    if (!input.bannerPath.startsWith(ownPrefix) || input.bannerPath.includes("..") || input.bannerUrl !== expectedUrl) {
      return { success: false, error: "Archivo de banner no válido." };
    }

    const currentUser = await userService.getUserById(input.uid);

    if (!currentUser) {
      return { success: false, error: "No encontramos tu perfil para actualizar el banner." };
    }

    const previousBannerPath = currentUser.bannerPath;

    await userService.updateUser(input.uid, {
      bannerUrl: input.bannerUrl,
      bannerPath: input.bannerPath,
    });

    if (previousBannerPath && previousBannerPath !== input.bannerPath) {
      await storageService.delete(previousBannerPath);
    }

    updateTag(`user-profile-${input.uid}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating banner:", error);
    return { success: false, error: "No se pudo actualizar el banner. Intenta nuevamente." };
  }
}
