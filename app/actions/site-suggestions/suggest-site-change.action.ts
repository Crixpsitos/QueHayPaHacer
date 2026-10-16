"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import { updateTag } from "next/cache"
import { getAccountCreatedAt } from "@/app/actions/_accountCreatedAt"
import { siteSuggestionsTag } from "./_tag"
import { SUGGESTION_FIELD_LABELS, type SuggestionField } from "@/domain/entities/siteSuggestion/SiteSuggestion"

export interface SuggestSiteChangeInput {
  siteId: string
  field: string
  description: string
  source?: string
  declaration: boolean
}

export async function suggestSiteChangeAction(input: SuggestSiteChangeInput): Promise<{ success: true } | { success: false; error: string }> {
  const tokens = await getTokens(await cookies(), authConfig)
  const t = tokens?.decodedToken
  if (!t?.uid) return { success: false, error: "Inicia sesión para sugerir un cambio." }

  try {
    const { siteId, field, description, source, declaration } = input
    const res = await createServerContainer().siteSuggestionService.submit(
      { uid: t.uid, name: t.name || t.email || "Usuario", accountCreatedAt: await getAccountCreatedAt(t.uid) },
      { siteId, field, description, source, declaration },
    )
    if (!res.success) return res
    // El autor del sitio ve el aviso en su menú: invalida su conteo cacheado.
    if (res.siteAuthorId) {
      updateTag(siteSuggestionsTag(res.siteAuthorId))
      await createServerContainer().notificationService.notify(res.siteAuthorId, {
        type: "suggestion_received",
        title: `Nueva sugerencia en "${res.siteName ?? "tu sitio"}"`,
        body: SUGGESTION_FIELD_LABELS[field as SuggestionField],
        href: "/sites?sugerencias=1",
      })
    }
    return { success: true }
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
