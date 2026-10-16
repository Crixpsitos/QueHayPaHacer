"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import { SiteSchema, validateSiteForm } from "@/application/dto/sites/SiteDto"
import { buildSiteInput } from "./buildSiteInput"
import { revalidateSite } from "./_revalidate"
import { DECLARATION_ERROR, hasDeclared } from "@/app/lib/legal/declaration"
import { updateTag } from "next/cache"
import type { SiteFormViewModel } from "@/presentation/sites/view-models/SiteFormViewModel"

type Result = { success: true; siteId: string } | { success: false; error: string }

/**
 * `declaration` (declaración del autor) es obligatoria al publicar y también al
 * editar/reenviar un sitio ya publicado (updateSiteAction): reafirma la
 * responsabilidad sobre el contenido. Los borradores no la requieren.
 */
export async function publishSiteAction(form: SiteFormViewModel, siteId: string | undefined, declaration: boolean): Promise<Result> {
  if (!hasDeclared(declaration)) return { success: false, error: DECLARATION_ERROR }
  const tokens = await getTokens(await cookies(), authConfig)
  if (!tokens?.decodedToken?.uid) return { success: false, error: "No autenticado" }

  const invalid = validateSiteForm(SiteSchema, form)
  if (invalid) return { success: false, error: invalid }

  const uid = tokens.decodedToken.uid
  const { sitesService, userService, contentDeclarationService } = createServerContainer()
  const input = buildSiteInput(uid, tokens.decodedToken, form, "published")

  const evidence = { variant: input.publishedAs as "owner" | "proposer" | "qhpa", siteKind: input.kind }

  try {
    const markContribution = async () => {
      try {
        await userService.markAsCreator(uid)
        updateTag(`user-profile-${uid}`)
      } catch (participationError) {
        console.error("[USER PARTICIPATION] No se pudo marcar al autor como creador:", participationError)
      }
    }

    // siteId present → a draft already exists (created during upload). Convert it in place, don't duplicate.
    if (siteId) {
      // Evidencia ANTES de publicar (si falla, no se publica) y solo si el sitio es del autor:
      // si no, un tercero podría pisar la evidencia de otro.
      if (!(await sitesService.isOwner(uid, siteId))) return { success: false, error: "No se pudo publicar el sitio" }
      await contentDeclarationService.record(uid, "site", siteId, evidence)
      await sitesService.publishExisting(uid, siteId, input)
      await markContribution()
      revalidateSite(uid, siteId)
      return { success: true, siteId }
    }
    // Sin id previo el sitio se crea al publicar: evidencia después; si falla, se borra el sitio recién creado.
    const newId = await sitesService.publish(input)
    try {
      await contentDeclarationService.record(uid, "site", newId, evidence)
    } catch (e) {
      await sitesService.deleteSite(uid, newId).catch(() => {})
      throw e
    }
    await markContribution()
    revalidateSite(uid, newId)
    return { success: true, siteId: newId }
  } catch (e) {
    console.error("[publishSite]", e)
    return { success: false, error: "No se pudo publicar el sitio" }
  }
}
