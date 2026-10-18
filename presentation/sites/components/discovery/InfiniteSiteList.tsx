"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button/button";
import { SiteDiscoveryCard } from "./SiteDiscovery";
import { SiteItemListJsonLd } from "./SiteJsonLd";
import type { SiteDetail } from "../../view-models/SiteFormViewModel";
import { loadMoreSitesAction } from "@/app/actions/sites/load-more-sites.action";

interface InfiniteSiteListProps {
  /** Tipo de sitio, o "all" para todos. */
  category: string;
  initialSites: SiteDetail[];
  initialCursor: string | null;
  /** Sitios que ya se ven en otra sección de la página (p. ej. destacados): no se repiten. */
  excludeIds?: string[];
}

/** Lista de sitios con "Cargar más" (cursor). Primera página del server (cacheada). */
export function InfiniteSiteList({ category, initialSites, initialCursor, excludeIds = [] }: InfiniteSiteListProps) {
  const skip = new Set(excludeIds);
  const [loaded, setSites] = useState(initialSites);
  const sites = loaded.filter((s) => !skip.has(s.id));
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await loadMoreSitesAction(category, cursor);
      setSites((prev) => [...prev, ...res.sites]);
      setCursor(res.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  if (sites.length === 0 && !cursor) {
    return (
      <div className="py-16 text-center">
        <h3 className="text-xl font-semibold text-foreground">Todavía no hay lugares aquí</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos sumando sitios constantemente. Vuelve pronto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SiteItemListJsonLd sites={sites} />
        {sites.map((s) => (
          <div key={s.id} className="card-reveal h-full">
            <SiteDiscoveryCard site={s} />
          </div>
        ))}
      </div>
      {cursor && (
        <div className="flex justify-center">
          <Button onClick={loadMore} disabled={loading} aria-busy={loading} variant="outline" className="min-h-11 min-w-36 transition-transform duration-150 active:scale-[0.97] motion-reduce:active:scale-100">
            {loading && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
            {loading ? "Cargando…" : "Cargar más"}
          </Button>
        </div>
      )}
    </div>
  );
}
