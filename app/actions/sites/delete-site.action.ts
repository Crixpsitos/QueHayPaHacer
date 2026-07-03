"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"

type Result = { success: true } | { success: false; error: string }

export async function deleteSiteAction(siteId: string): Promise<Result> {
  const tokens = await getTokens(await cookies(), authConfig)
  if (!tokens?.decodedToken?.uid) return { success: false, error: "No autenticado" }

  const { sitesService } = createServerContainer()

  try {
    await sitesService.deleteSite(tokens.decodedToken.uid, siteId)
    return { success: true }
  } catch (e) {
    console.error("[deleteSite]", e)
    return { success: false, error: "No se pudo eliminar el sitio" }
  }
}
