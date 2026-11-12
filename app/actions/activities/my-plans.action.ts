"use server"

import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { toCardView } from "@/presentation/activities/lib/publicView"
import type { MyPlansView } from "@/presentation/activities/lib/plansView"

/** Lo de «Mis planes» de la sesión (el uid sale de la cookie, nunca del cliente). null = sin sesión. */
export async function getMyPlansAction(): Promise<MyPlansView | null> {
  const uid = await getSessionUid()
  if (!uid) return null
  const c = createServerContainer()
  const [p, extra] = await Promise.all([c.activityPlansService.mine(uid), c.planExtrasService.mine(uid).catch(() => ({ cards: [], slots: {} }))])
  return {
    upcoming: p.upcoming.map((u) => ({ card: toCardView(u.activity), key: u.key, status: u.status })),
    saved: p.saved.map(toCardView),
    removedSaved: p.removedSaved,
    done: p.done.map(toCardView),
    slots: p.slots,
    extra,
  }
}
