"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { GeoPoint } from "firebase-admin/firestore"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import { buildLocationDetails } from "@/app/lib/utils/geoLocation"
import { buildSiteMedia } from "./buildSiteMedia"
import type { SiteFormViewModel } from "@/presentation/sites/view-models/SiteFormViewModel"

type Result = { success: true } | { success: false; error: string }

export async function updateSiteAction(siteId: string, form: SiteFormViewModel): Promise<Result> {
  const tokens = await getTokens(await cookies(), authConfig)
  if (!tokens?.decodedToken?.uid) return { success: false, error: "No autenticado" }

  if (!form.name?.trim()) return { success: false, error: "Nombre requerido" }
  if (!form.coordinates)  return { success: false, error: "Ubicación requerida" }

  const { sitesService } = createServerContainer()

  const { country, department, city } = buildLocationDetails({
    countryName: form.country,
    countrySlug: form.countrySlug,
    departmentName: form.region,
    departmentSlug: form.regionSlug,
    cityName: form.city,
    citySlug: form.citySlug,
  })

  try {
    await sitesService.updateSite(siteId, {
      name: form.name,
      category: form.category,
      description: form.description,
      location: {
        geo: new GeoPoint(form.coordinates.latitude, form.coordinates.longitude),
        address: form.address,
        city,
        department,
        country,
        venue: form.name,
        moreInfo: "",
      },
      media: buildSiteMedia(form.media),
      schedule: form.schedule,
    })
    return { success: true }
  } catch (e) {
    console.error("[updateSite]", e)
    return { success: false, error: "No se pudo actualizar el sitio" }
  }
}
