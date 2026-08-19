"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Hook reutilizable para listas/tablas del Studio: búsqueda + límite + paginación
 * (client-side). Lo usan la tabla de eventos, el grid de sitios y otras listas.
 */
export function usePagedList<T>(
  items: T[],
  searchSelector: (item: T) => string,
  initialPageSize = 9,
) {
  const [query, setQueryState] = useState("");
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => searchSelector(item).toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  const paged = useMemo(
    () => filtered.slice(page * pageSize, page * pageSize + pageSize),
    [filtered, page, pageSize],
  );

  const setQuery = (value: string) => {
    setQueryState(value);
    setPage(0);
  };

  const setPageSize = (value: number) => {
    setPageSizeState(value);
    setPage(0);
  };

  const rangeStart = filtered.length === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min(filtered.length, page * pageSize + pageSize);

  return {
    query,
    setQuery,
    pageSize,
    setPageSize,
    page,
    setPage,
    pageCount,
    paged,
    total: filtered.length,
    rangeStart,
    rangeEnd,
  };
}
