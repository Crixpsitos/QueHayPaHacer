"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { readCache, writeCache } from "./clientCache";

type Options = {
  /** Dueño de la caché (uid de la sesión). `undefined` = aún no se sabe: no se lee ni se pide nada. */
  uid: string | null | undefined;
  /** Hasta cuándo se pinta lo guardado. Pasado ese tiempo se espera lo fresco. */
  maxAgeMs: number;
};

/**
 * Stale-while-revalidate en el navegador (IndexedDB): pinta lo último guardado (si es de esta sesión) y
 * pide lo fresco en segundo plano; si lo fresco llega antes que la lectura, gana lo fresco.
 * `key` null/undefined desactiva todo. `isCached` es true mientras se muestra lo guardado.
 */
export function useCachedFetch<T>(key: string | null | undefined, fetcher: () => Promise<T>, { uid, maxAgeMs }: Options) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const fetcherRef = useRef(fetcher);
  const gotFresh = useRef(false);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const enabled = key != null && uid !== undefined;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    gotFresh.current = false;
    void readCache<T>(key, uid, maxAgeMs).then((hit) => {
      if (cancelled || !hit || gotFresh.current) return;
      setData(hit.data);
      setIsCached(true);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, key, uid, maxAgeMs]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const fresh = await fetcherRef.current();
      gotFresh.current = true;
      setData(fresh);
      setIsCached(false);
      setError(null);
      void writeCache(key, uid, fresh);
    } catch (e) {
      setError(e); // lo guardado, si hay, se queda a la vista
      setIsCached(false);
    }
  }, [enabled, key, uid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Cambio local inmediato (p. ej. tras editar): actualiza lo visible y lo guardado. */
  const mutate = useCallback(
    (update: (prev: T | undefined) => T) => {
      setData((prev) => {
        const next = update(prev);
        if (enabled) void writeCache(key, uid, next);
        return next;
      });
    },
    [enabled, key, uid],
  );

  return { data, isCached, error, refresh, mutate };
}
