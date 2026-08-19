"use client";

import { Search } from "lucide-react";

const DEFAULT_PAGE_SIZES = [9, 18, 36];

interface ListToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  placeholder?: string;
  pageSizes?: number[];
}

export function ListToolbar({
  query,
  onQueryChange,
  pageSize,
  onPageSizeChange,
  placeholder = "Buscar…",
  pageSizes = DEFAULT_PAGE_SIZES,
}: ListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none transition-colors focus:border-indigo-400"
        />
      </div>
      <label className="flex items-center gap-1.5 text-xs text-slate-500">
        Mostrar
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none focus:border-indigo-400"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
