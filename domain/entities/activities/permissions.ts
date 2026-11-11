import type { Activity } from "./Activity"
import { isPubliclyVisible, type LinkedSite } from "./visibility"

/**
 * Permisos (spec 7) como funciones puras; la identidad (`uid`, `isAdmin`) siempre sale del token en el servidor.
 * D12: solo el autor del sitio (o QHPA) crea o vincula actividades de ese sitio.
 */
export function canCreateForSite(i: { uid: string | null; siteAuthorUid: string | null; siteExists: boolean; isAdmin: boolean }): boolean {
  if (!i.uid || !i.siteExists) return false
  return i.isAdmin || i.siteAuthorUid === i.uid
}

export const canCreateGlobal = (i: { uid: string | null }): boolean => Boolean(i.uid)

export function canManageActivity(a: Pick<Activity, "ownerUid">, i: { uid: string | null; isAdmin: boolean }): boolean {
  return Boolean(i.uid) && (i.isAdmin || a.ownerUid === i.uid)
}

/** Ver una actividad: cualquiera si es pública; si no, solo quien la administra (vista previa) o QHPA. */
export function canViewActivity(a: Activity, i: { uid: string | null; isAdmin: boolean }, site?: LinkedSite | null): boolean {
  return isPubliclyVisible(a, site) || canManageActivity(a, i)
}
