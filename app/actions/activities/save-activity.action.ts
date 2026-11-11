"use server"

import { getSessionUid } from "@/app/actions/_session"
import { getAccountCreatedAt } from "@/app/actions/_accountCreatedAt"
import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin"
import { createServerContainer } from "@/infraestructure/di/container"
import { parseActivityInput } from "@/application/dto/activities/ActivityDto"
import { parseMediaInput } from "@/domain/entities/activities/value-objects/ActivityMedia"
import { revalidateActivity } from "./_revalidate"

type Result =
  | { success: true; id: string; slug: string; publicationStatus: "draft" | "published"; moderationStatus: "pending" | "approved" | "rejected" }
  | { success: false; error: string }

/**
 * Crea o edita una actividad (borrador o publicación). Identidad SOLO de la sesión; `raw`, `media` y `declaration`
 * vienen del cliente y se validan/limpian aquí y en el servicio (propiedad del sitio, límites, medios, moderación).
 */
export async function saveActivityAction(raw: unknown, media: unknown, opts: { id?: string; publish: boolean; declaration: boolean }): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, error: "Inicia sesión para continuar." }
  if (!opts || typeof opts !== "object") return { success: false, error: "Solicitud inválida." }

  const parsed = parseActivityInput(raw)
  if (!parsed.ok) return { success: false, error: parsed.error }
  const id = typeof opts.id === "string" && opts.id && opts.id.length <= 128 ? opts.id : undefined

  try {
    const r = await createServerContainer().activityPublishService.save(
      { uid, isAdmin: isQhpaAdmin(uid), accountCreatedAt: await getAccountCreatedAt(uid) },
      { id, input: parsed.value, media: parseMediaInput(media), publish: opts.publish === true, declaration: opts.declaration === true },
    )
    if (!r.ok) return { success: false, error: r.error }
    revalidateActivity(uid, r.id, parsed.value.siteId)
    return { success: true, id: r.id, slug: r.slug, publicationStatus: r.publicationStatus, moderationStatus: r.moderationStatus }
  } catch (e) {
    console.error("[saveActivity]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo guardar la actividad. Intenta nuevamente." }
  }
}
