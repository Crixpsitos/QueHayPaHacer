"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function leaveEntityAction(entityUid: string): Promise<ActionResult> {
  try {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) {
      return { success: false, error: "No hay sesión activa." };
    }
    const { studioService } = createServerContainer();
    await studioService.leaveEntity(tokens.decodedToken.uid, entityUid);
    return { success: true };
  } catch (error) {
    console.error("[LEAVE ENTITY ERROR]", error);
    return { success: false, error: "No se pudo salir de la entidad." };
  }
}
