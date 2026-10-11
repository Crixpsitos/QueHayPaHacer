"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import { SiteSchema, validateSiteForm } from "@/application/dto/sites/SiteDto"
import { buildSiteInput } from "./buildSiteInput"
import { revalidateSite } from "./_revalidate"
import { updateTag } from "next/cache"
import type { SiteFormViewModel } from "@/presentation/sites/view-models/SiteFormViewModel"

type Result = { success: true; siteId: string } | { success: false; error: string }

export async function publishSiteAction(form: SiteFormViewModel, siteId?: string): Promise<Result> {
  const tokens = await getTokens(await cookies(), authConfig)
  if (!tokens?.decodedToken?.uid) return { success: false, error: "No autenticado" }

  const invalid = validateSiteForm(SiteSchema, form)
  if (invalid) return { success: false, error: invalid }

  const uid = tokens.decodedToken.uid
  const { sitesService, userService } = createServerContainer()
  const input = buildSiteInput(uid, tokens.decodedToken, form, "published")

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
      await sitesService.publishExisting(uid, siteId, input)
      await markContribution()
      revalidateSite(uid, siteId)
      return { success: true, siteId }
    }
    const newId = await sitesService.publish(input)
    await markContribution()
    revalidateSite(uid, newId)
    return { success: true, siteId: newId }
  } catch (e) {
    console.error("[publishSite]", e)
    return { success: false, error: "No se pudo publicar el sitio" }
  }
}
