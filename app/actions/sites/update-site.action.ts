"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import { SiteSchema, validateSiteForm } from "@/application/dto/sites/SiteDto"
import { DECLARATION_ERROR, hasDeclared } from "@/app/lib/legal/declaration"
import { buildSiteInput } from "./buildSiteInput"
import { revalidateSite } from "./_revalidate"
import type { SiteFormViewModel } from "@/presentation/sites/view-models/SiteFormViewModel"

type Result = { success: true } | { success: false; error: string }

// Edita/reenvía un sitio ya publicado: exige la declaración como publishSiteAction (ver nota allí).
export async function updateSiteAction(siteId: string, form: SiteFormViewModel, declaration: boolean): Promise<Result> {
  if (!hasDeclared(declaration)) return { success: false, error: DECLARATION_ERROR }
  const tokens = await getTokens(await cookies(), authConfig)
  if (!tokens?.decodedToken?.uid) return { success: false, error: "No autenticado" }

  const invalid = validateSiteForm(SiteSchema, form)
  if (invalid) return { success: false, error: invalid }

  const uid = tokens.decodedToken.uid
  const { sitesService, contentDeclarationService } = createServerContainer()

  try {
    // Evidencia antes de aplicar; solo si el sitio es del autor (ver publishSiteAction).
    if (!(await sitesService.isOwner(uid, siteId))) return { success: false, error: "No se pudo actualizar el sitio" }
    const input = buildSiteInput(uid, tokens.decodedToken, form, "published")
    await contentDeclarationService.record(uid, "site", siteId, {
      variant: input.publishedAs as "owner" | "proposer" | "qhpa",
      siteKind: input.kind,
    })
    await sitesService.updateSite(uid, siteId, input)
    revalidateSite(uid, siteId)
    return { success: true }
  } catch (e) {
    console.error("[updateSite]", e)
    return { success: false, error: "No se pudo actualizar el sitio" }
  }
}
