"use server"

import { getSessionUid } from "@/app/actions/_session"
import { getUserSitesForPickerAction } from "@/app/actions/sites/get-user-sites-for-picker.action"
import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin"
import { createServerContainer } from "@/infraestructure/di/container"
import { formFromActivity, type ActivityForm } from "@/presentation/activities/lib/activityForm"
import type { ActivityMedia } from "@/domain/entities/activities/value-objects/ActivityMedia"

export interface WizardContext {
  /** Sitios propios (publicados como dueño y aprobados) a los que se puede vincular una actividad. */
  sites: { id: string; name: string; coverUrl: string; address: string; category: string }[]
  /** ¿Ya dejó sus datos de identificación (Ley 1480 art. 53)? Si no, el paso 9 se los pide. */
  identity: { ok: true } | { ok: false; message: string }
  isAdmin: boolean
}

export interface EditableActivity {
  id: string
  slug: string
  form: ActivityForm
  media: ActivityMedia[]
  publicationStatus: "draft" | "published"
  moderationStatus: "pending" | "approved" | "rejected"
  rejectionReason: string | null
}

/** Lo que el asistente necesita saber de la cuenta. null si no hay sesión (la ruta ya redirige al login). */
export async function getActivityWizardContextAction(): Promise<WizardContext | null> {
  const uid = await getSessionUid()
  if (!uid) return null
  const isAdmin = isQhpaAdmin(uid)
  const [sites, gate] = await Promise.all([getUserSitesForPickerAction(), createServerContainer().hostIdentityService.gate(uid)])
  return {
    sites: sites.map((s) => ({ id: s.id, name: s.name, coverUrl: s.coverUrl ?? "", address: s.address ?? "", category: s.category ?? "" })),
    identity: isAdmin || gate.ok ? { ok: true } : { ok: false, message: gate.message },
    isAdmin,
  }
}

/** Carga una actividad para editarla: solo su dueño o QHPA; null para cualquier otro caso (la página responde 404). */
export async function getActivityForEditAction(id: string): Promise<EditableActivity | null> {
  const uid = await getSessionUid()
  if (!uid || typeof id !== "string" || !id || id.length > 128) return null
  const a = await createServerContainer().activityService.getForManager(id, { uid, isAdmin: isQhpaAdmin(uid) })
  if (!a) return null
  return { id: a.id, slug: a.slug, form: formFromActivity(a), media: a.media, publicationStatus: a.publicationStatus, moderationStatus: a.moderationStatus, rejectionReason: a.rejectionReason }
}
