"use client";

import Link from "next/link";
import type { CategoryViewModel } from "../view-models/CategoryViewModel";
import { CATEGORY_ICON_MAP } from "../lib/categoryIconMap";

interface CategoryItemProps {
  category: CategoryViewModel;
}

export const CategoryItem = ({ category }: CategoryItemProps) => {
  const Icon = CATEGORY_ICON_MAP[category.icon] ?? CATEGORY_ICON_MAP.music;

  return (
    <Link
      href={category.href}
      title={category.description}
      className="group flex flex-col items-center gap-2.5 rounded-2xl border border-[#F4F4F5] bg-white p-4 text-center shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-card hover:border-[#FDF2F4]"
    >
      {/* Icono design system: primary-light bg + primary-vibrant icon */}
      <div className="flex size-14 sm:size-16 items-center justify-center rounded-full bg-[#FDF2F4] transition-transform group-hover:scale-110">
        <Icon className="size-7 sm:size-8 text-[#E63946]" />
      </div>
      <span className="text-sm font-semibold text-[#09090B] leading-tight">
        {category.title}
      </span>
      {category.description && (
        <p className="hidden sm:block text-[11px] text-[#71717A] line-clamp-2 leading-snug">
          {category.description}
        </p>
      )}
    </Link>
  );
};

