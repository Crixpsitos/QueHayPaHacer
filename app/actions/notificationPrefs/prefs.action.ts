"use server"

import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import type { NotificationPrefs, PrefsInput } from "@/domain/entities/notificationPrefs/prefs"

export type PrefsView = { email: NotificationPrefs["email"]; push: NotificationPrefs["push"]; consented: boolean }
const view = (p: NotificationPrefs): PrefsView => ({ email: p.email, push: p.push, consented: p.consent !== null && p.unsubscribedAt === null })

/** Mis preferencias de avisos. Sin sesión: null. */
export async function getMyPrefsAction(): Promise<PrefsView | null> {
  const uid = await getSessionUid()
  return uid ? view(await createServerContainer().notificationPrefsService.get(uid)) : null
}

/** Guardar mis preferencias. Encender correo de valor o push exige la casilla de autorización (queda con fecha y versión legal). */
export async function saveMyPrefsAction(input: PrefsInput, authorized: boolean): Promise<{ success: true; prefs: PrefsView } | { success: false; authRequired?: boolean; error: string }> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  // Solo los campos conocidos y booleanos: lo demás del cliente se ignora.
  const b = (v: unknown) => (typeof v === "boolean" ? v : undefined)
  const clean: PrefsInput = {
    email: { transactional: b(input?.email?.transactional), forYou: b(input?.email?.forYou), weekly: b(input?.email?.weekly) },
    push: { enabled: b(input?.push?.enabled) },
  }
  for (const k of Object.keys(clean.email!) as (keyof NonNullable<PrefsInput["email"]>)[]) if (clean.email![k] === undefined) delete clean.email![k]
  if (clean.push!.enabled === undefined) delete clean.push!.enabled
  try {
    return { success: true, prefs: view(await createServerContainer().notificationPrefsService.save(uid, clean, authorized === true)) }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "No se pudo guardar." }
  }
}
