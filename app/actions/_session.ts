import { cookies } from "next/headers"
import { cache } from "react"
import { getTokens } from "next-firebase-auth-edge"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { redirect } from "next/navigation"
import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import { can, resolveEventRole, type EventAccessRole, type TeamAction, type TeamRole } from "@/domain/entities/events/teamAccess"
import type { TeamEventItem } from "@/domain/entities/studio/Studio"

/**
 * CONTRATO DE PERMISOS DE EQUIPO (la matriz vive en domain/entities/events/teamAccess.ts)
 * - `getEventAccess(eventId)`            → { role, ownerId, uid } | null. Lee el evento SIN caché (los cambios de
 *   rol / expulsiones valen al instante, incluso con varias instancias) y lo deduplica por request.
 *   Dueño: exige su propio Premium. Miembro (editor/viewer/checkin): sin Premium propio, pero solo mientras
 *   el DUEÑO siga Premium. credit/externos/extraños → null.
 * - `requireEventPermission(eventId, action)` → getEventAccess + `can`; null si no puede.
 *   Tercer parámetro `{ ownerNeedsPremium: false }` solo para editar/publicar (el dueño sin Premium sigue editando lo suyo).
 * - `isStudioEventOwner(eventId)`        → solo el dueño (borrar, gestionar equipo).
 * - `getMyTeamAccess()` / `listMyTeamEvents()` → eventos donde soy miembro (caché `team-access-<uid>`).
 * - Acción `changeCollaboratorRoleAction` (app/actions/studio) y campo `viewerRole` en los view-models.
 * Las pantallas ocultan; el servidor autoriza.
 */

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

// Sin `use cache`: el rol debe reflejar el guardado actual. `cache` de React deduplica dentro del request.
const loadEventFresh = cache(async (eventId: string) => createServerContainer().eventsService.getEventById(eventId))

export interface EventAccess {
  role: Exclude<EventAccessRole, "credit">
  ownerId: string
  uid: string
}

export async function getEventAccess(
  eventId: string,
  opts: { ownerNeedsPremium?: boolean } = {},
): Promise<EventAccess | null> {
  const uid = await getSessionUid()
  if (!uid || !eventId) return null
  const event = await loadEventFresh(eventId)
  if (!event) return null
  const role = resolveEventRole(event, uid)
  if (!role || role === "credit") return null
  const ownerId = event.author.id
  if (role === "owner") {
    if (opts.ownerNeedsPremium !== false && (await getCachedUserPlan(uid)) !== "premium") return null
  } else if ((await getCachedUserPlan(ownerId)) !== "premium") {
    return null
  }
  return { role, ownerId, uid }
}

export async function requireEventPermission(
  eventId: string,
  action: TeamAction,
  opts: { ownerNeedsPremium?: boolean } = {},
): Promise<EventAccess | null> {
  const access = await getEventAccess(eventId, opts)
  return access && can(access.role, action) ? access : null
}

/** Studio: sesión Premium y autora del evento (acciones solo del dueño: borrar, gestionar equipo). */
export async function isStudioEventOwner(eventId: string): Promise<boolean> {
  return (await getEventAccess(eventId))?.role === "owner"
}

/** Tag que invalidan las ops de equipo (agregar/quitar/cambiar rol) de `uid`. */
export const teamAccessTag = (uid: string) => `team-access-${uid}`

// Caché corto: decide qué shell ve el usuario; la autorización real por evento NO usa este caché.
async function cachedTeamEvents(uid: string): Promise<TeamEventItem[]> {
  "use cache"
  cacheLife("seconds")
  cacheTag(teamAccessTag(uid))
  const items = await createServerContainer().studioService.listTeamEventsForUser(uid)
  const owners = [...new Set(items.map((i) => i.ownerId))]
  const premium = new Set<string>()
  await Promise.all(owners.map(async (o) => { if ((await getCachedUserPlan(o)) === "premium") premium.add(o) }))
  return items.filter((i) => premium.has(i.ownerId))
}

/** Eventos donde la sesión es miembro con rol de Studio (dueño Premium). Máx. 50. Para el listado del modo limitado. */
export async function listMyTeamEvents(): Promise<(Omit<TeamEventItem, "role"> & { role: Exclude<TeamRole, "credit"> })[]> {
  const uid = await getSessionUid()
  if (!uid) return []
  return (await cachedTeamEvents(uid)) as Awaited<ReturnType<typeof listMyTeamEvents>>
}

export async function getMyTeamAccess(): Promise<{ hasTeamEvents: boolean }> {
  return { hasTeamEvents: (await listMyTeamEvents()).length > 0 }
}

/**
 * Studio limitado: quien no es Premium pero es miembro de eventos ajenos solo ve "Eventos del equipo".
 * Las páginas propias del Premium (resumen, sitios, colaboradores, soporte) lo llaman primero para
 * llevarlo a /studio/events. NO sustituye los guards de datos (`getPremiumSessionUid`, etc.).
 */
export async function redirectLimitedToEvents(): Promise<void> {
  if (!(await getSessionUid()) || (await getPremiumSessionUid())) return
  if ((await listMyTeamEvents()).length > 0) redirect("/studio/events")
}

/** Perfil visible para la sesión: público, o es el propio. */
export async function canViewProfile(uid: string): Promise<boolean> {
  if ((await getSessionUid()) === uid) return true
  const user = await createServerContainer().userService.getUserById(uid)
  return Boolean(user?.isPublic)
}
