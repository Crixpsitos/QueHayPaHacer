"use client";
import { useEffect, useState } from "react";
import { readLikedIds, type LikeKind } from "./likedIds";

/** ¿Este id tiene like guardado en este navegador? false en servidor y primer render (sin desajuste de hidratación). */
export function useStoredLiked(kind: LikeKind, uid: string | null | undefined, id: string): boolean {
  const [liked, setLiked] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void readLikedIds(kind, uid).then((m) => !cancelled && setLiked(Boolean(uid && m[id])));
    return () => {
      cancelled = true;
    };
  }, [kind, uid, id]);
  return liked;
}
