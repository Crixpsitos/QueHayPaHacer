"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import { SiteSchema, validateSiteForm } from "@/application/dto/sites/SiteDto"
import { buildSiteInput } from "./buildSiteInput"
import { revalidateSite } from "./_revalidate"
import type { SiteFormViewModel } from "@/presentation/sites/view-models/SiteFormViewModel"

type Result = { success: true } | { success: false; error: string }

export async function updateSiteAction(siteId: string, form: SiteFormViewModel): Promise<Result> {
  const tokens = await getTokens(await cookies(), authConfig)
  if (!tokens?.decodedToken?.uid) return { success: false, error: "No autenticado" }

  const invalid = validateSiteForm(SiteSchema, form)
  if (invalid) return { success: false, error: invalid }

  const uid = tokens.decodedToken.uid
  const { sitesService } = createServerContainer()

  try {
    await sitesService.updateSite(uid, siteId, buildSiteInput(uid, tokens.decodedToken, form, "published"))
    revalidateSite(uid, siteId)
    return { success: true }
  } catch (e) {
    console.error("[updateSite]", e)
    return { success: false, error: "No se pudo actualizar el sitio" }
  }
}
