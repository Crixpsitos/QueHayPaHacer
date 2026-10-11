"use client";

import { use } from "react";
import { motion } from "motion/react";
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
      <StatChip icon={Activity} value={stats.eventsCount} label="Eventos" />
      <StatChip icon={MapPin} value={stats.sitesCount} label="Sitios" />
      <StatChip icon={Award} value={stats.badgesCount} label="Insignias" />
    </motion.div>
  );
}

function StatChip({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Activity;
  value: number;
  label: string;
}) {
  return (
    <motion.div
      variants={item}
      className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card py-3 sm:flex-row sm:justify-center sm:gap-2.5"
    >
      <Icon className="size-4 text-primary" aria-hidden />
      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </motion.div>
  );
}
