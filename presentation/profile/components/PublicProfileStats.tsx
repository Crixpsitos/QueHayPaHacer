"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { Activity, Award, MapPin } from "lucide-react";

type Stats = {
  eventsCount: number;
  sitesCount: number;
  badgesCount: number;
};

interface PublicProfileStatsProps {
  statsPromise: Promise<Stats>;
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 160, damping: 18 } },
};

export function PublicProfileStats({ statsPromise }: PublicProfileStatsProps) {
  const stats = use(statsPromise);

  return (
    <motion.div
      className="grid grid-cols-3 gap-2 sm:gap-3"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <StatChip icon={Activity} value={stats.eventsCount} label="Eventos" gradient="from-sky-500/15 to-sky-500/5" iconClassName="text-sky-600 dark:text-sky-400" />
      <StatChip icon={MapPin} value={stats.sitesCount} label="Sitios" gradient="from-amber-500/15 to-amber-500/5" iconClassName="text-amber-600 dark:text-amber-400" />
      <StatChip icon={Award} value={stats.badgesCount} label="Insignias" gradient="from-brand-violet/15 to-brand-violet/5" iconClassName="text-brand-violet" />
    </motion.div>
  );
}

function StatChip({
  icon: Icon,
  value,
  label,
  gradient,
  iconClassName,
}: {
  icon: typeof Activity;
  value: number;
  label: string;
  gradient: string;
  iconClassName: string;
}) {
  return (
    <motion.div
      variants={item}
      className={`flex flex-col items-center gap-1 rounded-xl bg-linear-to-br ${gradient} py-3 sm:flex-row sm:justify-center sm:gap-2.5`}
    >
      <Icon className={`size-4 ${iconClassName}`} />
      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </motion.div>
  );
}
