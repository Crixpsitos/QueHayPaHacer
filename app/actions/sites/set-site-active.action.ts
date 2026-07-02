"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"

type Result = { success: true } | { success: false; error: string }

export async function setSiteActiveAction(siteId: string, active: boolean): Promise<Result> {
  const tokens = await getTokens(await cookies(), authConfig)
  if (!tokens?.decodedToken?.uid) return { success: false, error: "No autenticado" }

  const { sitesService } = createServerContainer()

  try {
    await sitesService.setActive(tokens.decodedToken.uid, siteId, active)
    return { success: true }
  } catch (e) {
    console.error("[setSiteActive]", e)
    return { success: false, error: "No se pudo cambiar la visibilidad" }
  }
}
