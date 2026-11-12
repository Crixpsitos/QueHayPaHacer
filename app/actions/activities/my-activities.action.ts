"use server"

import { cacheLife, cacheTag } from "next/cache"
import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin"
import { sumStats } from "@/domain/entities/analytics/fichaStats"
import { toMySummary, type MyActivitySummary } from "@/presentation/activities/lib/activityStatus"

/** Función con caché por usuario (el uid entra como argumento: una función "use cache" no puede leer cookies). */
async function fetchMine(uid: string): Promise<MyActivitySummary[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag(`activities-${uid}`)
  return (await createServerContainer().activityService.listMine(uid)).map(toMySummary)
}

/** Las actividades de la sesión, en cualquier estado. null si no hay sesión. Se invalida al crear, editar o pausar. */
export async function getMyActivitiesAction(): Promise<MyActivitySummary[] | null> {
  const uid = await getSessionUid()
  return uid ? fetchMine(uid) : null
}

const CHANNEL_NAMES: Record<string, string> = { ig: "Instagram (publicación)", ig_h: "Instagram (historia)", wa: "WhatsApp", fb: "Facebook", x: "X", tt: "TikTok", qr: "Código QR" }

/** Origen de las visitas de UNA actividad en los últimos 30 días. Solo quien la gestiona (dueño, dueño del sitio o QHPA). */
export async function getActivityChannelStatsAction(activityId: string): Promise<{ rows: { label: string; views: number; clicks: number }[]; total: number } | null> {
  const uid = await getSessionUid()
  if (!uid || !/^[A-Za-z0-9_-]{1,128}$/.test(activityId)) return null
  const c = createServerContainer()
  const a = await c.activityService.getForManager(activityId, { uid, isAdmin: isQhpaAdmin(uid) })
  if (!a) return null
  const since = new Date(Date.now() - 5 * 3_600_000 - 30 * 86_400_000).toISOString().slice(0, 10)
  const t = sumStats(await c.dailyStatsRepository.readDays("activities", activityId, since))
  const rows = Object.keys(CHANNEL_NAMES).map((ch) => ({ label: CHANNEL_NAMES[ch], views: t.viewsBy[`ch_${ch}`] ?? 0, clicks: t.linkClicks[ch] ?? 0 })).filter((r) => r.views + r.clicks > 0)
  return { rows, total: t.views }
}
