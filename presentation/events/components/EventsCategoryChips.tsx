"use client";

import Link from "next/link";
import { CATEGORY_ICON_MAP } from "@/presentation/categories/lib/categoryIconMap";
import type { CollectionDef } from "../lib/eventCollections";

type ChipCollection = Pick<CollectionDef, "slug" | "shortLabel" | "categoryIcon">;

interface EventsCategoryChipsProps {
  collections: ChipCollection[];
  className?: string;
}

export function EventsCategoryChips({ collections, className }: EventsCategoryChipsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      {collections.map((c) => {
        const Icon = c.categoryIcon ? CATEGORY_ICON_MAP[c.categoryIcon] : undefined;
        return (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="group flex items-center gap-2.5 whitespace-nowrap rounded-full border border-[#E4E4E7] bg-white py-2 pl-2 pr-4 [&:not(:has(svg))]:pl-4 text-sm font-semibold text-[#09090B] shadow-subtle transition-all duration-200 hover:border-[#E63946] hover:shadow-[0_4px_16px_rgba(230,57,70,0.15)] active:scale-[0.97]"
          >
            {Icon && (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FDF2F4] transition-colors duration-200 group-hover:bg-[#E63946]">
                <Icon className="size-3.5 text-[#E63946] transition-colors duration-200 group-hover:text-white" />
              </span>
            )}
            {c.shortLabel}
          </Link>
        );
      })}
    </div>
  );
}

