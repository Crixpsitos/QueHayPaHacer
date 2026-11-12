"use server"

import { updateTag } from "next/cache"
import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { reviewId } from "@/domain/entities/activities/review/reviewIdentity"
import { FLAG_REASONS, type FlagReason } from "@/domain/entities/activities/moderation/reviewModeration"
import { REVIEW_BODY_MAX, REVIEW_TITLE_MAX, canReview, type ReviewInput } from "@/domain/entities/activities/review/ActivityReview"
import type { ActivityMedia } from "@/domain/entities/activities/value-objects/ActivityMedia"

type Result = { success: true } | { success: false; authRequired?: boolean; error: string }
const validId = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id)

/** Invalida las reseñas de lo reseñado y las del sitio al que cuenta (la ficha del sitio las junta). */
async function bust(subjectId: string) {
  updateTag(`activity-reviews-${subjectId}`)
  updateTag(`activity-${subjectId}`)
  const subject = await createServerContainer().reviewSubject(subjectId).catch(() => null)
  if (subject?.siteId) updateTag(`site-reviews-${subject.siteId}`)
}

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
    await bust(activityId)
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
    await bust(activityId)
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
  const [mine, a] = await Promise.all([c.activityReviewService.getMine(uid, activityId), c.reviewSubject(activityId)])
  const blocked = !a ? "Eso ya no existe." : canReview(a, uid)
  return { loggedIn: true, blocked, docId: reviewId(activityId, uid), mine: mine ? { rating: mine.rating, title: mine.title, body: mine.body, visitedAt: mine.visitedAt, media: mine.media, inVerification: mine.status === "flagged" } : null }
}

const validKey = (k: unknown): k is string => typeof k === "string" && /^[a-f0-9]{20}$/.test(k)

/** Quien organiza cuestiona una reseña (queda «En verificación», sigue visible). El motivo y la nota no se publican. */
export async function flagReviewAction(activityId: string, key: string, reason: string, note: string): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  if (!validId(activityId) || !validKey(key) || !FLAG_REASONS.includes(reason as FlagReason)) return { success: false, error: "Solicitud inválida." }
  try {
    await createServerContainer().reviewModerationService.flag(uid, activityId, key, { reason: reason as FlagReason, note: String(note ?? "").slice(0, 400) })
    await bust(activityId)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "No se pudo enviar." }
  }
}

/** Quien organiza responde una reseña (una respuesta, editable). */
export async function replyReviewAction(activityId: string, key: string, text: string): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  if (!validId(activityId) || !validKey(key)) return { success: false, error: "Solicitud inválida." }
  try {
    await createServerContainer().reviewModerationService.reply(uid, activityId, key, String(text ?? ""))
    await bust(activityId)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "No se pudo guardar la respuesta." }
  }
}

/** ¿Puede esta cuenta cuestionar / responder en esta actividad? (para mostrar los botones; la regla real se vuelve a aplicar al enviar). */
export async function getReviewRoleAction(activityId: string): Promise<{ isHost: boolean }> {
  const uid = await getSessionUid()
  if (!uid || !validId(activityId)) return { isHost: false }
  const c = createServerContainer()
  const a = await c.reviewSubject(activityId)
  if (!a) return { isHost: false }
  return { isHost: uid === a.ownerUid || uid === a.siteOwnerUid }
}

export interface RemovedReview { activityId: string; title: string; slug: string; base: string; appealed: boolean }

/** Mis reseñas retiradas (para apelar una vez). Sin sesión: nada. */
export async function getMyRemovedReviewsAction(): Promise<RemovedReview[]> {
  const uid = await getSessionUid()
  if (!uid) return []
  const c = createServerContainer()
  const mine = (await c.activityReviewRepo.listByAuthorSince(uid, new Date(0))).filter((r) => r.status === "removed")
  const out: RemovedReview[] = []
  for (const r of mine.slice(0, 20)) {
    const a = await c.reviewSubject(r.activityId)
    out.push({ activityId: r.activityId, title: a?.title ?? r.subjectTitle ?? "una actividad", slug: a?.slug ?? r.subjectSlug ?? "", base: a?.base ?? "/actividades", appealed: (await c.activityAppealRepoGet(r.id)) !== null })
  }
  return out
}

/** Apelar una reseña retirada (una sola vez, explicación de 30+ caracteres). */
export async function appealReviewAction(activityId: string, explanation: string): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  if (!validId(activityId)) return { success: false, error: "Solicitud inválida." }
  try {
    await createServerContainer().activityAppealService.submit(uid, reviewId(activityId, uid), String(explanation ?? ""))
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "No se pudo enviar la apelación." }
  }
}
