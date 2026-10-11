import { cookies } from "next/headers"
import { getTokens } from "next-firebase-auth-edge"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import { fetchEventDetailById } from "@/presentation/events/data/eventDetailFetchers"

/**
 * uid de la sesión verificada por cookie. Las Server Actions son endpoints
 * públicos: nunca confiar en un uid enviado por el cliente.
 */
export async function getSessionUid(): Promise<string | null> {
  const tokens = await getTokens(await cookies(), authConfig)
  return tokens?.decodedToken.uid ?? null
}

// Cacheado (tag `user-profile-<uid>`, que ya invalidan las acciones de perfil):
// evita una lectura sin caché por página/slot del Studio.
async function getCachedUserPlan(uid: string): Promise<string | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag(`user-profile-${uid}`)
  const user = await createServerContainer().userService.getUserById(uid)
  return user?.plan ?? null
}

/** uid si la sesión tiene plan Premium (requisito del Studio), si no null. */
export async function getPremiumSessionUid(): Promise<string | null> {
  const uid = await getSessionUid()
  if (!uid) return null
  return (await getCachedUserPlan(uid)) === "premium" ? uid : null
}

/** Studio: sesión Premium y autora del evento. Usar en páginas y actions, no solo en el layout. */
export async function isStudioEventOwner(eventId: string): Promise<boolean> {
  const uid = await getPremiumSessionUid()
  if (!uid || !eventId) return false
  const event = await fetchEventDetailById(eventId)
  return event?.author.id === uid
}

/** Studio: sesión Premium y autora del sitio. */
export async function isStudioSiteOwner(siteId: string): Promise<boolean> {
  const uid = await getPremiumSessionUid()
  if (!uid || !siteId) return false
  return createServerContainer().sitesService.isOwner(uid, siteId)
}

/** Perfil visible para la sesión: público, o es el propio. */
export async function canViewProfile(uid: string): Promise<boolean> {
  if ((await getSessionUid()) === uid) return true
  const user = await createServerContainer().userService.getUserById(uid)
  return Boolean(user?.isPublic)
}
