"use server"

import { updateTag } from "next/cache"
import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { siteSuggestionsTag } from "./_tag"

/** Aprobar = "la acepto y la voy a reflejar" (no edita el sitio). El servidor verifica que el sitio sea del uid de sesión. */
export async function resolveSiteSuggestionAction(
  id: string,
  decision: "approve" | "reject",
  note?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, error: "Inicia sesión." }
  try {
    const res = await createServerContainer().siteSuggestionService.resolve(uid, id, decision, note)
    if (res.success) updateTag(siteSuggestionsTag(uid))
    return res
  } catch (e) {
    console.error("[resolveSiteSuggestion]", e)
    return { success: false, error: "No se pudo resolver la sugerencia. Intenta nuevamente." }
  }
}
