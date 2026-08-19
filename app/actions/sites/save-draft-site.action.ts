"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { GeoPoint } from "firebase-admin/firestore"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import { toSlug } from "@/app/lib/utils/slug"
import { buildLocationDetails } from "@/app/lib/utils/geoLocation"
import { buildSiteMedia } from "./buildSiteMedia"
import { revalidateSite } from "./_revalidate"
import type { SiteFormViewModel } from "@/presentation/sites/view-models/SiteFormViewModel"

type Result = { success: true; siteId: string } | { success: false; error: string }

export async function saveDraftSiteAction(form: SiteFormViewModel, siteId?: string): Promise<Result> {
  const tokens = await getTokens(await cookies(), authConfig)
  if (!tokens?.decodedToken?.uid) return { success: false, error: "No autenticado" }

  const uid = tokens.decodedToken.uid
  const { sitesService } = createServerContainer()
  const input = buildSiteInput(uid, tokens.decodedToken, form)

  try {
    // siteId present → update the SAME doc (autosave during upload / re-save). Otherwise create one.
    if (siteId) {
      await sitesService.updateDraft(siteId, input)
      revalidateSite(uid, siteId)
      return { success: true, siteId }
    }
    const newId = await sitesService.saveDraft(input)
    revalidateSite(uid, newId)
    return { success: true, siteId: newId }
  } catch (e) {
    console.error("[saveDraftSite]", e)
    return { success: false, error: "No se pudo guardar el borrador" }
  }
}

function buildSiteInput(
  uid: string,
  token: { name?: string; picture?: string },
  form: SiteFormViewModel,
) {
  const { country, department, city } = buildLocationDetails({
    countryName: form.country,
    countrySlug: form.countrySlug,
    departmentName: form.region,
    departmentSlug: form.regionSlug,
    cityName: form.city,
    citySlug: form.citySlug,
  })

  return {
    name: form.name,
    slug: `${toSlug(form.name)}-${Date.now().toString(36)}`,
    category: form.category,
    description: form.description,
    location: {
      geo: new GeoPoint(form.coordinates?.latitude ?? 0, form.coordinates?.longitude ?? 0),
      address: form.address,
      city,
      department,
      country,
      venue: form.name,
      moreInfo: "",
    },
    media: buildSiteMedia(form.media),
    schedule: form.schedule,
    socialMedia: form.socialMedia ?? {},
    temporarilyClosed: form.temporarilyClosed ?? { isClosed: false, reason: "" },
    bookingUrl: form.bookingUrl ?? "",
    author: { id: uid, displayName: token.name ?? "", photoURL: token.picture ?? "" },
    publicationStatus: "draft" as const,
    moderationStatus: "pending" as const,
    isActive: false,
    analytics: { clicks: 0, likes: 0, shares: 0, eventCount: 0, score: 0 },
    publishedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    rejectedAt: null,
    rejectionReason: null,
  }
}
