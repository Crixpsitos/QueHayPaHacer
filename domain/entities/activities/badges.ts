/** Insignias de actividades (se otorgan con `BadgeService.awardBadgeToUser`, que ya es idempotente). Sin recompensas con dinero. */
export const ACTIVITY_BADGE_IDS = { firstStory: "first-story", explorer: "explorer-ibague" } as const
/** «Explorador de Ibagué»: 5 actividades distintas marcadas con «Yo fui». */
export const EXPLORER_MIN_VISITS = 5

/** Qué insignias corresponden con estos números (el servicio otorga solo las que falten). */
export function activityBadgesFor(c: { reviews: number; visits: number }): string[] {
  const out: string[] = []
  if (c.reviews >= 1) out.push(ACTIVITY_BADGE_IDS.firstStory)
  if (c.visits >= EXPLORER_MIN_VISITS) out.push(ACTIVITY_BADGE_IDS.explorer)
  return out
}
