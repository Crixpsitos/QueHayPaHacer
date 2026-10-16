"use server"

import { updateTag } from "next/cache"
import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { siteSuggestionsTag } from "./_tag"
import { suggestionResolvedNotification } from "@/domain/entities/notification/messages"

/** Aprobar = "la acepto y la voy a reflejar" (no edita el sitio). El servidor verifica que el sitio sea del uid de sesión. */
export async function resolveSiteSuggestionAction(
  id: string,
  decision: "approve" | "reject",
  note?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, error: "Inicia sesión." }
  try {
    const { siteSuggestionService, notificationService } = createServerContainer()
    const res = await siteSuggestionService.resolve(uid, id, decision, note)
    if (!res.success) return res
    updateTag(siteSuggestionsTag(uid))
    if (res.suggester) {
      const { uid: toUid, siteName, field } = res.suggester
      await notificationService.notify(
        toUid,
        suggestionResolvedNotification({ siteName, field, accepted: decision === "approve", note }),
        `suggestion-resolved-${id}`,
      )
    }
    return { success: true }
  } catch (e) {
    console.error("[resolveSiteSuggestion]", e)
    return { success: false, error: "No se pudo resolver la sugerencia. Intenta nuevamente." }
  }
}
