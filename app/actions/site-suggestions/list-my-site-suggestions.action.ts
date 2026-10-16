"use server"

import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import type { SiteSuggestionItem } from "@/domain/entities/siteSuggestion/SiteSuggestion"

/** Sugerencias de MIS sitios (uid de la sesión; sin caché: no puede filtrarse entre usuarios). Pendientes primero. */
export async function listMySiteSuggestionsAction(): Promise<{ success: true; items: SiteSuggestionItem[] } | { success: false; error: string }> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, error: "Inicia sesión." }
  try {
    return { success: true, items: await createServerContainer().siteSuggestionService.listForOwner(uid) }
  } catch (e) {
    console.error("[listMySiteSuggestions]", e)
    return { success: false, error: "No se pudieron cargar las sugerencias." }
  }
}
