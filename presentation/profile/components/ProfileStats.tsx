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
    <div className="grid grid-cols-3 divide-x divide-border">
      <StatItem value={stats.eventsCount} label="Eventos" />
      <StatItem value={stats.sitesCount} label="Sitios" />
      <StatItem value={stats.badgesCount} label="Insignias" />
    </div>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="group flex flex-col items-center gap-1 py-5 transition-colors hover:bg-muted/30">
      <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
        {label}
      </span>
    </div>
  );
}
