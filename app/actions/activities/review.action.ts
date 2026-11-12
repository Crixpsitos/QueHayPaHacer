"use server"

import { updateTag } from "next/cache"
import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { REVIEW_BODY_MAX, REVIEW_TITLE_MAX, type ReviewInput } from "@/domain/entities/activities/review/ActivityReview"
import type { ActivityMedia } from "@/domain/entities/activities/value-objects/ActivityMedia"

type Result = { success: true } | { success: false; authRequired?: boolean; error: string }
const validId = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id)

/** Lo que llega del navegador: solo contenido. La identidad sale de la cookie; el nombre, el estado y la versión legal los pone el servidor. */
export interface ReviewPayload { rating: number; title: string; body: string; visitedAt: string; media?: ActivityMedia[]; coverIndex?: number; authorized: boolean }

/** Crear o editar MI reseña. Una por persona y actividad. */
export async function submitReviewAction(activityId: string, p: ReviewPayload): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión con Google para reseñar." }
  if (!validId(activityId)) return { success: false, error: "Actividad inválida." }
  if (!p || p.authorized !== true) return { success: false, error: "Debes autorizar la publicación de tu nombre y tu reseña." }
  const media = Array.isArray(p.media) ? p.media.slice(0, 4) : []
  const input: ReviewInput = { rating: Number(p.rating), title: String(p.title ?? "").slice(0, REVIEW_TITLE_MAX + 1), body: String(p.body ?? "").slice(0, REVIEW_BODY_MAX + 1), visitedAt: String(p.visitedAt ?? ""), photos: 0, video: 0 }
  try {
    await createServerContainer().activityReviewService.submit(uid, activityId, input, { media, coverIndex: Number.isInteger(p.coverIndex) ? (p.coverIndex as number) : 0 })
    updateTag(`activity-reviews-${activityId}`)
    updateTag(`activity-${activityId}`)
    return { success: true }
  } catch (e) {
    // Los mensajes del servicio están escritos para la persona (sin datos internos).
    return { success: false, error: e instanceof Error ? e.message : "No se pudo guardar tu reseña." }
  }
}

/** Borrar MI reseña (no mientras esté en verificación). */
export async function deleteReviewAction(activityId: string): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  if (!validId(activityId)) return { success: false, error: "Actividad inválida." }
  try {
    await createServerContainer().activityReviewService.remove(uid, activityId)
    updateTag(`activity-reviews-${activityId}`)
    updateTag(`activity-${activityId}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "No se pudo borrar tu reseña." }
  }
}

export interface MyReview { rating: number; title: string; body: string; visitedAt: string; media: ActivityMedia[]; inVerification: boolean }

/** Mi reseña de esta actividad (para editarla) y si puedo escribirla. Sin sesión: nada. */
export async function getMyReviewAction(activityId: string): Promise<{ loggedIn: boolean; blocked: string | null; mine: MyReview | null; docId: string | null }> {
  const uid = await getSessionUid()
  if (!uid || !validId(activityId)) return { loggedIn: false, blocked: null, mine: null, docId: null }
  const c = createServerContainer()
  const [mine, a] = await Promise.all([c.activityReviewService.getMine(uid, activityId), c.activityService.getPublicById(activityId)])
  const blocked = !a ? "Esa actividad no existe." : a.ownerUid === uid ? "No puedes reseñar una actividad que publicaste." : null
  return { loggedIn: true, blocked, docId: `${activityId}_${uid}`, mine: mine ? { rating: mine.rating, title: mine.title, body: mine.body, visitedAt: mine.visitedAt, media: mine.media, inVerification: mine.status === "flagged" } : null }
}
