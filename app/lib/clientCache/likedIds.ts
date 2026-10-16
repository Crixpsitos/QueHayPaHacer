import { invalidateMyData, readCache, updateCache } from "./clientCache";

export type LikeKind = "events" | "sites";
type LikedMap = Record<string, true>;

// Los ids con "me gusta" casi no cambian fuera de esta app; el servidor corrige en cuanto responde.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const key = (kind: LikeKind) => `likes:${kind}`;

/** Mezcla lo fresco del servidor (solo para los `queried` ids) con lo guardado. Pura. */
export function applyFreshLikes(stored: LikedMap, queried: string[], fresh: Record<string, boolean>): LikedMap {
  const next = { ...stored };
  for (const id of queried) {
    if (fresh[id] === true) next[id] = true;
    else delete next[id];
  }
  return next;
}

/** Ids con like guardados de esta sesión. Sin uid: nada. */
export async function readLikedIds(kind: LikeKind, uid: string | null | undefined): Promise<Record<string, boolean>> {
  if (!uid) return {};
  return (await readCache<LikedMap>(key(kind), uid, MAX_AGE_MS))?.data ?? {};
}

/** Guarda la respuesta fresca del servidor para los ids consultados. */
export async function saveFreshLikes(kind: LikeKind, uid: string | null | undefined, queried: string[], fresh: Record<string, boolean>): Promise<void> {
  if (!uid) return;
  await updateCache<LikedMap>(key(kind), uid, MAX_AGE_MS, (prev) => applyFreshLikes(prev ?? {}, queried, fresh));
}

/** Un like/unlike confirmado por el usuario. */
export async function setLikedId(kind: LikeKind, uid: string | null | undefined, id: string, liked: boolean): Promise<void> {
  await saveFreshLikes(kind, uid, [id], { [id]: liked });
  await invalidateMyData(); // la trayectoria y las preferencias incluyen tus likes
}
