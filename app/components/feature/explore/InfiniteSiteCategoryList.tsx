"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button/button";
import { SiteDiscoveryGrid } from "@/presentation/sites/components/discovery/SiteDiscovery";
import { loadMoreExploreSitesAction } from "@/app/actions/explore/load-more-explore-sites.action";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";
import type { SiteCategory } from "@/presentation/sites/view-models/SiteFormViewModel";

interface InfiniteSiteCategoryListProps {
  category: SiteCategory;
  initialSites: SiteDetail[];
  initialCursor: string | null;
}

export function InfiniteSiteCategoryList({
  category,
  initialSites,
  initialCursor,
}: InfiniteSiteCategoryListProps) {
  const [sites, setSites] = useState(initialSites);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await loadMoreExploreSitesAction(category, cursor);
      setSites((prev) => [...prev, ...res.sites]);
      setCursor(res.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SiteDiscoveryGrid sites={sites} />
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
