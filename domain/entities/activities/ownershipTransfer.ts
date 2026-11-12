import type { Activity, ActivityHost } from "./Activity"

export interface NewOwner {
  uid: string
  displayName: string
  photoURL: string
}

export interface TransferPatch {
  ownerUid: string
  host: ActivityHost
  previousOwnerUid: string
}

/**
 * Un reclamo de sitio aprobado cambia al autor del sitio; sus actividades pasan al nuevo autor (si no, D12 se rompería
 * en silencio). Devuelve el cambio a aplicar, o null si no corresponde (global, o ya es suya).
 */
export function transferPatch(a: Pick<Activity, "kind" | "siteId" | "ownerUid">, owner: NewOwner): TransferPatch | null {
  if (a.kind !== "site" || !a.siteId || a.ownerUid === owner.uid) return null
  return { ownerUid: owner.uid, host: { kind: "user", id: owner.uid, displayName: owner.displayName, photoURL: owner.photoURL }, previousOwnerUid: a.ownerUid }
}
