"use client";

import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

const DEBOUNCE_MS = 350;

interface EventsSearchInputProps {
  /** Valor inicial del query param `q` (renderizado en el server). */
  query: string;
  placeholder?: string;
}

export function EventsSearchInput({
  query,
  placeholder = "Buscar por nombre…",
}: EventsSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(query);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Mantener el input en sync si la URL cambia por fuera (ej. navegación atrás).
  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const pushQuery = (next: string) => {
    const params = new URLSearchParams(searchParams);
    const trimmed = next.trim();

    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    // Cambiar la búsqueda invalida la posición del cursor: volvemos a la primera página.
    params.delete("cursor");
    params.delete("direction");

    startTransition(() => {
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushQuery(next), DEBOUNCE_MS);
  };

  const handleClear = () => {
    setValue("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushQuery("");
  };

  return (
    <div className="group relative flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Buscar eventos"
        className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-8 text-sm shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          value && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
              className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
