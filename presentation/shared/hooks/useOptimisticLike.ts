"use client";
import { useEffect, useRef, useState } from "react";
import { createLikeSync, type LikeState } from "../lib/createLikeSync";

/**
 * Estado de "me gusta" optimista (ver createLikeSync). `commit` devuelve false si el servidor lo rechaza
 * (p. ej. pide iniciar sesión): el corazón y el contador vuelven solos.
 * `initialLiked`/`initialCount` pueden cambiar (llega la sesión); se reaplican si no hay un toque sin confirmar.
 */
export function useOptimisticLike(
  initialLiked: boolean,
  initialCount: number,
  commit: (liked: boolean) => Promise<boolean>,
) {
  const [state, setState] = useState<LikeState>({ liked: initialLiked, count: initialCount });
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });
  const syncRef = useRef<ReturnType<typeof createLikeSync> | null>(null);

  if (!syncRef.current) {
    syncRef.current = createLikeSync({
      initial: { liked: initialLiked, count: initialCount },
      commit: (liked) => commitRef.current(liked),
      onChange: setState,
    });
  }

  useEffect(() => {
    syncRef.current?.reset({ liked: initialLiked, count: initialCount });
  }, [initialLiked, initialCount]);

  return { liked: state.liked, count: state.count, toggle: () => syncRef.current?.toggle() };
}
