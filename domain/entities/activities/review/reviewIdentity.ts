import { createHash } from "node:crypto"

/** Clave pública estable por reseña (20 hex): no se puede invertir hasta el uid. SOLO servidor (usa node:crypto). */
export const reviewKey = (activityId: string, uid: string) => createHash("sha256").update(`${activityId}:${uid}`).digest("hex").slice(0, 20)

/**
 * Id del documento `activityReviews/{activityId}_{clave}`: NUNCA lleva el uid, porque el id aparece en la ruta pública de
 * las fotos y el video (`public/activityReviews/{id}/…`) y el optimizador parchea el documento por esa ruta.
 */
export const reviewId = (activityId: string, uid: string) => `${activityId}_${reviewKey(activityId, uid)}`
