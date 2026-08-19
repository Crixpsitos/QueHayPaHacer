"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button/button";
import { SiteDiscoveryCard } from "./SiteDiscovery";
import { SiteItemListJsonLd } from "./SiteJsonLd";
import type { SiteDetail } from "../../view-models/SiteFormViewModel";
import { loadMoreSitesAction } from "@/app/actions/sites/load-more-sites.action";

interface InfiniteSiteListProps {
  category: string;
  initialSites: SiteDetail[];
  initialCursor: string | null;
}

/** Lista de sitios con "Cargar más" (cursor). Primera página del server (cacheada). */
export function InfiniteSiteList({ category, initialSites, initialCursor }: InfiniteSiteListProps) {
  const [sites, setSites] = useState(initialSites);
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

  if (sites.length === 0) {
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
          <SiteDiscoveryCard key={s.id} site={s} />
        ))}
      </div>
      {cursor && (
        <div className="flex justify-center">
          <Button onClick={loadMore} disabled={loading} variant="outline">
            {loading ? "Cargando..." : "Cargar más"}
          </Button>
        </div>
      )}
    </div>
  );
}
