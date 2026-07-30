"use client";

import { useEffect, useState, useCallback } from "react";
import { MapPin, ChevronDown, ChevronUp, Store } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { getUserSitesForPickerAction } from "@/app/actions/sites/get-user-sites-for-picker.action";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

interface SiteSelection {
  siteId: string;
  venue: string;
  address: string;
  coordinates: { lat: number; lng: number };
}

interface SitePickerWidgetProps {
  /** Callback cuando el usuario selecciona un sitio */
  onSelect: (site: SiteSelection) => void;
  /** siteId actualmente seleccionado (para marcar activo) */
  selectedSiteId?: string | null;
}

export function SitePickerWidget({ onSelect, selectedSiteId }: SitePickerWidgetProps) {
  const [sites, setSites] = useState<SiteDetail[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchSites = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const result = await getUserSitesForPickerAction();
      setSites(result);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [fetched]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  if (!loading && fetched && sites.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-sm font-medium text-primary"
      >
        <Store className="size-4 shrink-0" />
        <span className="flex-1 text-left">
          {loading ? "Buscando tus sitios..." : "Usar mis sitios creados"}
          {!loading && sites.length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
              {sites.length}
            </span>
          )}
        </span>
        {!loading && (open ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />)}
      </button>

      {open && !loading && sites.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {sites.map((site) => {
            const isSelected = site.id === selectedSiteId;
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => {
                  if (site.coordinates) {
                    onSelect({
                      siteId: site.id,
                      venue: site.name,
                      address: site.address,
                      coordinates: {
                        lat: site.coordinates.latitude,
                        lng: site.coordinates.longitude,
                      },
                    });
                  }
                  setOpen(false);
                }}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-primary/10",
                )}
              >
                {site.coverUrl ? (
                  <img
                    src={site.coverUrl}
                    alt={site.name}
                    className="mt-0.5 size-8 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <MapPin className="size-3.5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className={cn("font-medium leading-tight truncate", isSelected ? "text-primary-foreground" : "text-foreground")}>
                    {site.name}
                  </p>
                  <p className={cn("text-xs truncate mt-0.5", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {site.address}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
