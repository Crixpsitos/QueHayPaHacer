"use client";

import Link from "next/link";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import type { CategoryViewModel } from "../view-models/CategoryViewModel";
import {
  LucideIcon,
  Music,
  Utensils,
  Palette,
  Dumbbell,
  Clapperboard,
  BookOpen,
  Gamepad2,
  TreePine,
  Heart,
  GraduationCap,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  music: Music,
  food: Utensils,
  art: Palette,
  sports: Dumbbell,
  film: Clapperboard,
  books: BookOpen,
  gaming: Gamepad2,
  nature: TreePine,
  health: Heart,
  education: GraduationCap,
};

const colorMap: Record<string, { bg: string; icon: string }> = {
  music: { bg: "bg-violet-100 dark:bg-violet-900/40", icon: "text-violet-600 dark:text-violet-400" },
  food: { bg: "bg-orange-100 dark:bg-orange-900/40", icon: "text-orange-600 dark:text-orange-400" },
  art: { bg: "bg-pink-100 dark:bg-pink-900/40", icon: "text-pink-600 dark:text-pink-400" },
  sports: { bg: "bg-green-100 dark:bg-green-900/40", icon: "text-green-600 dark:text-green-400" },
  film: { bg: "bg-yellow-100 dark:bg-yellow-900/40", icon: "text-yellow-600 dark:text-yellow-400" },
  books: { bg: "bg-blue-100 dark:bg-blue-900/40", icon: "text-blue-600 dark:text-blue-400" },
  gaming: { bg: "bg-cyan-100 dark:bg-cyan-900/40", icon: "text-cyan-600 dark:text-cyan-400" },
  nature: { bg: "bg-emerald-100 dark:bg-emerald-900/40", icon: "text-emerald-600 dark:text-emerald-400" },
  health: { bg: "bg-rose-100 dark:bg-rose-900/40", icon: "text-rose-600 dark:text-rose-400" },
  education: { bg: "bg-indigo-100 dark:bg-indigo-900/40", icon: "text-indigo-600 dark:text-indigo-400" },
};

const fallbackColor = { bg: "bg-zinc-100 dark:bg-zinc-800", icon: "text-zinc-600 dark:text-zinc-400" };

interface CategoryItemProps {
  category: CategoryViewModel;
}

export const CategoryItem = ({ category }: CategoryItemProps) => {
  const Icon = iconMap[category.icon] ?? Music;
  const color = colorMap[category.icon] ?? fallbackColor;

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

