"use client";

import Link from "next/link";
import {
  Utensils, Coffee, Wine, Music, ShoppingBag, TreePine,
  Landmark, Palette, Mountain, BedDouble, Building2,
  Dumbbell, Sparkles, Drama, MapPin, type LucideIcon,
} from "lucide-react";
import { siteCollectionHref } from "@/presentation/sites/lib/siteCollections";
import type { SiteCollectionDef } from "@/presentation/sites/lib/siteCollections";

const SITE_ICON_MAP: Record<string, LucideIcon> = {
  restaurant: Utensils,
  cafe: Coffee,
  bar: Wine,
  discotheque: Music,
  mall: ShoppingBag,
  park: TreePine,
  museum: Landmark,
  cultural: Palette,
  viewpoint: Mountain,
  hostel: BedDouble,
  hotel: Building2,
  gym: Dumbbell,
  spa: Sparkles,
  theater: Drama,
  other: MapPin,
};

interface SiteCategoryChipsProps {
  collections: SiteCollectionDef[];
}

export function SiteCategoryChips({ collections }: SiteCategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {collections.map((c) => {
        const Icon = c.category ? (SITE_ICON_MAP[c.category] ?? MapPin) : MapPin;
        return (
          <Link
            key={c.slug}
            href={siteCollectionHref(c.slug)}
            className="group flex items-center gap-2.5 whitespace-nowrap rounded-full border border-[#E4E4E7] bg-white py-2 pl-2 pr-4 text-sm font-semibold text-[#09090B] shadow-subtle transition-all duration-200 hover:border-[#E63946] hover:shadow-[0_4px_16px_rgba(230,57,70,0.15)] active:scale-[0.97]"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FDF2F4] transition-colors duration-200 group-hover:bg-[#E63946]">
              <Icon className="size-3.5 text-[#E63946] transition-colors duration-200 group-hover:text-white" />
            </span>
            {c.shortLabel}
          </Link>
        );
      })}
    </div>
  );
}
