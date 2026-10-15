"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import type { SiteSuggestionResult } from "@/application/services/siteSuggestion/SiteSuggestionService"

export interface SuggestSiteChangeInput {
  siteId: string
  field: string
  description: string
  source?: string
  declaration: boolean
}

export async function suggestSiteChangeAction(input: SuggestSiteChangeInput): Promise<SiteSuggestionResult> {
  const tokens = await getTokens(await cookies(), authConfig)
  const t = tokens?.decodedToken
  if (!t?.uid) return { success: false, error: "Inicia sesión para sugerir un cambio." }

  try {
    const { siteId, field, description, source, declaration } = input
    return await createServerContainer().siteSuggestionService.submit(
      { uid: t.uid, name: t.name || t.email || "Usuario" },
      { siteId, field, description, source, declaration },
    )
  } catch (e) {
    console.error("[suggestSiteChange]", e)
    return { success: false, error: "No se pudo enviar la sugerencia. Intenta nuevamente." }
  }
}

/** Lectura ligera sin caché: ¿la sesión ya tiene una sugerencia pendiente en este sitio? */
export async function hasPendingSiteSuggestionAction(siteId: string): Promise<boolean> {
  const tokens = await getTokens(await cookies(), authConfig)
  const uid = tokens?.decodedToken?.uid
  if (!uid) return false
  try {
    return await createServerContainer().siteSuggestionService.hasPending(uid, siteId)
  } catch (e) {
    console.error("[hasPendingSiteSuggestion]", e)
    return false
  }
}
