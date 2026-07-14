import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";

interface CursorPaginationProps {
  /** Ruta base sin query, ej. "/studio/events" o `/studio/sites/${id}`. */
  basePath: string;
  /** Query de búsqueda actual a preservar (`q`). */
  query: string;
  /** ISO del cursor para "Siguiente". `null` = no hay más páginas. */
  nextCursor: string | null;
  /** ISO del cursor para "Anterior". `null` = ya estás en la primera página. */
  prevCursor: string | null;
  /** Params extra a preservar en el href (ej. `{ limit: "25" }`). */
  extraParams?: Record<string, string>;
}

function cursorHref(
  basePath: string,
  cursor: string,
  direction: "next" | "prev",
  query: string,
  extraParams?: Record<string, string>,
) {
  const params = new URLSearchParams({ ...extraParams, cursor, direction });
  if (query) params.set("q", query);
  return `${basePath}?${params.toString()}`;
}

function PaginationLink({
  href,
  disabled,
  direction,
}: {
  href: string | null;
  disabled: boolean;
  direction: "prev" | "next";
}) {
  const label = direction === "prev" ? "Anterior" : "Siguiente";
  const className = cn(
    "inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 px-2 text-xs font-medium text-slate-600 transition-colors",
    disabled ? "cursor-not-allowed opacity-40" : "hover:bg-gray-50",
  );

  if (disabled || !href) {
    return (
      <span className={className} aria-disabled="true">
        {direction === "prev" && <ChevronLeft className="h-3.5 w-3.5" />}
        {label}
        {direction === "next" && <ChevronRight className="h-3.5 w-3.5" />}
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      {direction === "prev" && <ChevronLeft className="h-3.5 w-3.5" />}
      {label}
      {direction === "next" && <ChevronRight className="h-3.5 w-3.5" />}
    </Link>
  );
}

/** Controles de paginación por cursor (Anterior / Siguiente). Reutilizable por ruta. */
export function CursorPagination({
  basePath,
  query,
  nextCursor,
  prevCursor,
  extraParams,
}: CursorPaginationProps) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <PaginationLink
        href={prevCursor ? cursorHref(basePath, prevCursor, "prev", query, extraParams) : null}
        disabled={!prevCursor}
        direction="prev"
      />
      <PaginationLink
        href={nextCursor ? cursorHref(basePath, nextCursor, "next", query, extraParams) : null}
        disabled={!nextCursor}
        direction="next"
      />
    </div>
  );
}
