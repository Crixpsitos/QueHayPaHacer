"use client";

import { Suspense, use } from "react";
import { Award } from "lucide-react";
import type { UserBadge } from "@/domain/repository/profile/IProfileRepository";

interface RecentBadgesPanelProps {
  badgesPromise: Promise<UserBadge[]> | null;
  emptyMessage?: string;
}

export function RecentBadgesPanel({
  badgesPromise,
  emptyMessage = "Aún no tienes insignias.",
}: RecentBadgesPanelProps) {
  if (!badgesPromise) {
    return <RecentBadgesSkeleton />;
  }

  return (
    <Suspense fallback={<RecentBadgesSkeleton />}>
      <ResolvedRecentBadges badgesPromise={badgesPromise} emptyMessage={emptyMessage} />
    </Suspense>
  );
}

function ResolvedRecentBadges({
  badgesPromise,
  emptyMessage,
}: {
  badgesPromise: Promise<UserBadge[]>;
  emptyMessage: string;
}) {
  const badges = use(badgesPromise).slice(0, 3);

  if (!badges.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2.5">
      {badges.map((badge) => (
        <div key={badge.id} className="rounded-xl border border-border/70 bg-background/90 px-3 py-2.5 shadow-sm">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-orange/20 text-brand-orange">
              <Award className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">{badge.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{badge.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentBadgesSkeleton() {
  return (
    <div className="space-y-2.5">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border/70 bg-background/90 px-3 py-2.5 shadow-sm">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 h-7 w-7 animate-pulse rounded-full bg-muted" />
            <div className="w-full">
              <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
