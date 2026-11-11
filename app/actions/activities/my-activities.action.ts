"use server"

import { cacheLife, cacheTag } from "next/cache"
import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { toMySummary, type MyActivitySummary } from "@/presentation/activities/lib/activityStatus"

/** Función con caché por usuario (el uid entra como argumento: una función "use cache" no puede leer cookies). */
async function fetchMine(uid: string): Promise<MyActivitySummary[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag(`activities-${uid}`)
  return (await createServerContainer().activityService.listMine(uid)).map(toMySummary)
}

/** Las actividades de la sesión, en cualquier estado. null si no hay sesión. Se invalida al crear, editar o pausar. */
export async function getMyActivitiesAction(): Promise<MyActivitySummary[] | null> {
  const uid = await getSessionUid()
  return uid ? fetchMine(uid) : null
}
