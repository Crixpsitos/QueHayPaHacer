"use client";

import { use } from "react";

type Stats = {
  eventsCount: number;
  sitesCount: number;
  badgesCount: number;
};

interface ProfileStatsProps {
  statsPromise: Promise<Stats>;
}

export function ProfileStats({ statsPromise }: ProfileStatsProps) {
  const stats = use(statsPromise);

  return (
    <div className="flex items-center gap-6 sm:gap-8">
      <Stat value={stats.eventsCount} label="eventos" centered />
      <Stat value={stats.sitesCount} label="sitios" centered />
      <Stat value={stats.badgesCount} label="insignias" centered />
    </div>
  );
}

function Stat({
  value,
  label,
  centered = false,
}: {
  value: number;
  label: string;
  centered?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline gap-1.5 ${centered ? "flex-col items-center gap-0.5" : ""}`}
    >
      <span className="text-base font-bold text-brand-violet">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
