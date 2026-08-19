"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function EventsSearchRedirect() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (q) router.push(`/explorar?q=${encodeURIComponent(q)}`);
    },
    [query, router],
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="flex items-center gap-3 rounded-full border border-[#E4E4E7] bg-white px-4 py-2.5 shadow-subtle transition-all focus-within:border-[#E63946] focus-within:shadow-[0_0_0_3px_rgba(230,57,70,0.08)]">
        <Search className="size-4 shrink-0 text-[#71717A]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar eventos, artistas, lugares..."
          aria-label="Buscar eventos"
          className="min-w-0 flex-1 bg-transparent text-sm text-[#09090B] placeholder:text-[#71717A] outline-none"
        />
        {query.trim() && (
          <button
            type="submit"
            className="shrink-0 rounded-full bg-[#E63946] px-3.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#9B0A26]"
          >
            Buscar
          </button>
        )}
      </div>
    </form>
  );
}
