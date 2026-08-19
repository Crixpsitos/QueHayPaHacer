"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { revalidateTag } from "next/cache";

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
    if (!input.uid || !input.bannerUrl || !input.bannerPath) {
      return { success: false, error: "Faltan datos para actualizar el banner." };
    }

    const { userService, storageService } = createServerContainer();
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

    revalidateTag(`user-profile-${input.uid}`, "max");

    return { success: true };
  } catch (error) {
    console.error("Error updating banner:", error);
    return { success: false, error: "No se pudo actualizar el banner. Intenta nuevamente." };
  }
}
