"use server"

import { cacheLife, cacheTag } from "next/cache"
import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { siteSuggestionsTag } from "./_tag"

// Cacheado por usuario (el menú de cuenta lo pide en cada carga). Se invalida al crear/resolver (updateTag).
async function countPending(uid: string): Promise<number> {
  "use cache"
  cacheLife("minutes")
  cacheTag(siteSuggestionsTag(uid))
  return createServerContainer().siteSuggestionService.countPendingForOwner(uid)
}

/** Sugerencias pendientes sobre los sitios del usuario en sesión. */
export async function getPendingSiteSuggestionsCountAction(): Promise<number> {
  const uid = await getSessionUid()
  if (!uid) return 0
  try {
    return await countPending(uid)
  } catch {
    return 0
  }
}
