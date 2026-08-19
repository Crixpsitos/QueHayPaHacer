import Image from "next/image";
import Link from "next/link";
import { MapPin, Heart, Eye } from "lucide-react";
import { siteCategoryLabel } from "@/presentation/sites/lib/constants";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

interface HomeSiteCardProps {
  site: SiteDetail;
}

export function HomeSiteCard({ site }: HomeSiteCardProps) {
  const href = `/donde-ir/${site.slug || site.id}`;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Imagen */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {site.coverUrl ? (
          <Image
            src={site.coverUrl}
            alt={site.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Categoría */}
        <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          {siteCategoryLabel(site.category)}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-1.5 p-4">
        <h3 className="line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-primary">
          {site.name}
        </h3>
        {site.address && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{site.address}</span>
          </div>
        )}
        <div className="flex items-center gap-3 pt-0.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="size-3.5" aria-hidden />
            {(site.analytics.likes ?? 0).toLocaleString("es-CO")}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden />
            {(site.views ?? 0).toLocaleString("es-CO")}
          </div>
        </div>
      </div>
    </Link>
  );
}
