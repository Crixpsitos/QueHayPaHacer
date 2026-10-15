"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import type { SiteClaimResult } from "@/application/services/siteClaim/SiteClaimService"

export interface RequestSiteClaimInput {
  siteId: string
  relation: string
  contactPhone?: string
  evidence: string
  declaration: boolean
}

export async function requestSiteClaimAction(input: RequestSiteClaimInput): Promise<SiteClaimResult> {
  const tokens = await getTokens(await cookies(), authConfig)
  const t = tokens?.decodedToken
  if (!t?.uid) return { success: false, error: "Inicia sesión para reclamar este lugar." }
  if (!t.email) return { success: false, error: "Tu cuenta necesita un correo para reclamar." }

  try {
    const { siteId, relation, contactPhone, evidence, declaration } = input
    return await createServerContainer().siteClaimService.submit(
      { uid: t.uid, name: t.name || t.email, email: t.email },
      { siteId, relation, contactPhone, evidence, declaration },
    )
  } catch (e) {
    console.error("[requestSiteClaim]", e)
    return { success: false, error: "No se pudo enviar el reclamo. Intenta nuevamente." }
  }
}

/** Lectura ligera sin caché: ¿ya hay un reclamo pendiente de la sesión para este sitio? */
export async function hasPendingSiteClaimAction(siteId: string): Promise<boolean> {
  const tokens = await getTokens(await cookies(), authConfig)
  const uid = tokens?.decodedToken?.uid
  if (!uid) return false
  try {
    return await createServerContainer().siteClaimService.hasPending(uid, siteId)
  } catch (e) {
    console.error("[hasPendingSiteClaim]", e)
    return false
  }
}
