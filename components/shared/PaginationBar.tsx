"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  pageCount: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationBar({
  page,
  pageCount,
  total,
  rangeStart,
  rangeEnd,
  onPageChange,
  className,
}: PaginationBarProps) {
  if (total === 0) return null;

  return (
    <div
      className={
        "flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 " + (className ?? "")
      }
    >
      <span className="tabular-nums">
        {rangeStart}–{rangeEnd} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 px-2 font-medium text-slate-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Anterior
        </button>
        <span className="px-1.5 tabular-nums">
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
          disabled={page >= pageCount - 1}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 px-2 font-medium text-slate-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
