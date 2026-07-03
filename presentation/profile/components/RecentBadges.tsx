"use client"

import type { UserBadge } from "@/domain/repository/profile/IProfileRepository"
import { Sparkles, Trophy, Milestone } from "lucide-react"

interface RecentBadgesProps {
  badges: UserBadge[]
  maxDisplay?: number
  showTitle?: boolean
}

export function RecentBadges({
  badges,
  maxDisplay = 3,
  showTitle = true,
}: RecentBadgesProps) {
  if (!badges || badges.length === 0) {
    return null
  }

  // Sort by earned date, most recent first
  const sortedBadges = [...badges].sort((a, b) => {
    const aDate = new Date(a.earnedAt).getTime()
    const bDate = new Date(b.earnedAt).getTime()
    return bDate - aDate
  })

  const displayBadges = sortedBadges.slice(0, maxDisplay)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "system":
        return <Sparkles className="w-4 h-4 text-blue-500" />
      case "achievement":
        return <Trophy className="w-4 h-4 text-amber-500" />
      case "milestone":
        return <Milestone className="w-4 h-4 text-purple-500" />
      default:
        return null
    }
  }

  return (
    <div className="w-full space-y-3">
      {showTitle && (
        <div>
          <h3 className="text-sm font-semibold text-foreground">Insignias Recientes</h3>
          <p className="text-xs text-muted-foreground">Últimos logros</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {displayBadges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-2 rounded-lg bg-background/50 border border-border/50 px-3 py-2 transition-all duration-200 hover:bg-background hover:border-border group"
            title={badge.description}
          >
            <span className="text-lg">{badge.icon || "⭐"}</span>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground leading-tight">
                {badge.name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {getCategoryIcon(badge.category)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
