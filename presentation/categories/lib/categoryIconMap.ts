import {
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
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
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

export const CATEGORY_COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  music:     { bg: "bg-violet-100 dark:bg-violet-900/40",  icon: "text-violet-600 dark:text-violet-400" },
  food:      { bg: "bg-orange-100 dark:bg-orange-900/40",  icon: "text-orange-600 dark:text-orange-400" },
  art:       { bg: "bg-pink-100   dark:bg-pink-900/40",    icon: "text-pink-600   dark:text-pink-400"   },
  sports:    { bg: "bg-green-100  dark:bg-green-900/40",   icon: "text-green-600  dark:text-green-400"  },
  film:      { bg: "bg-yellow-100 dark:bg-yellow-900/40",  icon: "text-yellow-600 dark:text-yellow-400" },
  books:     { bg: "bg-blue-100   dark:bg-blue-900/40",    icon: "text-blue-600   dark:text-blue-400"   },
  gaming:    { bg: "bg-cyan-100   dark:bg-cyan-900/40",    icon: "text-cyan-600   dark:text-cyan-400"   },
  nature:    { bg: "bg-emerald-100 dark:bg-emerald-900/40",icon: "text-emerald-600 dark:text-emerald-400"},
  health:    { bg: "bg-rose-100   dark:bg-rose-900/40",    icon: "text-rose-600   dark:text-rose-400"   },
  education: { bg: "bg-indigo-100 dark:bg-indigo-900/40",  icon: "text-indigo-600 dark:text-indigo-400" },
};

export const CATEGORY_FALLBACK_COLOR = {
  bg: "bg-zinc-100 dark:bg-zinc-800",
  icon: "text-zinc-600 dark:text-zinc-400",
};
