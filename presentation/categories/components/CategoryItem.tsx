"use client";

import Link from "next/link";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import type { CategoryViewModel } from "../view-models/CategoryViewModel";
import { CATEGORY_ICON_MAP, CATEGORY_COLOR_MAP, CATEGORY_FALLBACK_COLOR } from "../lib/categoryIconMap";

interface CategoryItemProps {
  category: CategoryViewModel;
}

export const CategoryItem = ({ category }: CategoryItemProps) => {
  const Icon = CATEGORY_ICON_MAP[category.icon] ?? CATEGORY_ICON_MAP.music;
  const color = CATEGORY_COLOR_MAP[category.icon] ?? CATEGORY_FALLBACK_COLOR;

  return (
    <HoverCard openDelay={10} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Link href={category.href} className="flex flex-col items-center gap-3 group w-20 sm:w-24 md:w-28">
          <div
            className={`size-16 sm:size-20 md:size-24 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${color.bg}`}
          >
            <Icon className={`size-8 sm:size-10 md:size-12 ${color.icon}`} />
          </div>
          <h3 className="text-sm sm:text-base font-medium text-center leading-tight group-hover:underline">
            {category.title}
          </h3>
        </Link>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" className="w-56">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{category.description}</p>
      </HoverCardContent>
    </HoverCard>
  );
};

