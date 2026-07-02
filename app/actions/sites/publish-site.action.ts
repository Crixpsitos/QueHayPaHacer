"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { GeoPoint } from "firebase-admin/firestore"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import { toSlug } from "@/app/lib/utils/slug"
import { buildSiteMedia } from "./buildSiteMedia"
import type { SiteFormViewModel } from "@/presentation/sites/view-models/SiteFormViewModel"

type Result = { success: true; siteId: string } | { success: false; error: string }

export async function publishSiteAction(form: SiteFormViewModel, siteId?: string): Promise<Result> {
  const tokens = await getTokens(await cookies(), authConfig)
  if (!tokens?.decodedToken?.uid) return { success: false, error: "No autenticado" }

  if (!form.name?.trim()) return { success: false, error: "Nombre requerido" }
  if (!form.coordinates)   return { success: false, error: "Ubicación requerida" }
  if (!form.category)      return { success: false, error: "Categoría requerida" }

  const uid = tokens.decodedToken.uid
  const { sitesService } = createServerContainer()

  const input = {
    name: form.name,
    slug: `${toSlug(form.name)}-${Date.now().toString(36)}`,
    category: form.category,
    description: form.description,
    location: {
      geo: new GeoPoint(form.coordinates.latitude, form.coordinates.longitude),
      address: form.address,
      city: form.city,
      citySlug: form.citySlug,
      region: form.region,
      regionSlug: form.regionSlug,
      country: form.country,
      countrySlug: form.countrySlug,
    },
    media: buildSiteMedia(form.media),
    schedule: form.schedule,
    author: {
      id: uid,
      displayName: tokens.decodedToken.name ?? "",
      photoURL: tokens.decodedToken.picture ?? "",
    },
    publicationStatus: "published" as const,
    moderationStatus: "pending" as const,
    isActive: false,
    analytics: { clicks: 0, views: 0, likes: 0, shares: 0, eventCount: 0, score: 0 },
    publishedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    rejectedAt: null,
    rejectionReason: null,
  }

  try {
    // siteId present → a draft already exists (created during upload). Convert it in place, don't duplicate.
    if (siteId) {
      await sitesService.publishExisting(siteId, input)
      return { success: true, siteId }
    }
    const newId = await sitesService.publish(input)
    return { success: true, siteId: newId }
  } catch (e) {
    console.error("[publishSite]", e)
    return { success: false, error: "No se pudo publicar el sitio" }
  }
}
