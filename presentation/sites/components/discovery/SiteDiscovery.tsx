import Link from "next/link";
import Image from "next/image";
import { MapPin, CalendarDays } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/presentation/sites/lib/constants";
import type { SiteDetail } from "../../view-models/SiteFormViewModel";

const TYPE_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label]));

/** Card pública de un sitio (sin interactividad → server o client). Link al detalle. */
export function SiteDiscoveryCard({ site }: { site: SiteDetail }) {
  return (
    <Link
      href={`/sites/${site.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {site.coverUrl && (
          <Image
            src={site.coverUrl}
            alt={site.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium backdrop-blur-sm">
          {TYPE_LABELS[site.category] ?? site.category}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="font-semibold leading-tight group-hover:underline">{site.name}</h3>
        {site.address && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground [overflow-wrap:anywhere]">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {site.address}
          </p>
        )}
        {site.analytics?.eventCount > 0 && (
          <p className="mt-1 flex items-center gap-1 text-xs text-primary">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {site.analytics.eventCount} {site.analytics.eventCount === 1 ? "evento" : "eventos"}
          </p>
        )}
      </div>
    </Link>
  );
}

const EMPTY = (
  <div className="py-16 text-center">
    <h3 className="text-xl font-semibold text-foreground">Todavía no hay lugares aquí</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      Estamos sumando sitios constantemente. Vuelve pronto para descubrir dónde ir.
    </p>
  </div>
);

/** Grid de sitios (server). */
export function SiteDiscoveryGrid({ sites }: { sites: SiteDetail[] }) {
  if (sites.length === 0) return EMPTY;
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sites.map((s) => (
        <SiteDiscoveryCard key={s.id} site={s} />
      ))}
    </div>
  );
}
