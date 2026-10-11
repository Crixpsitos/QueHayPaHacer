import { GeoPoint } from "firebase-admin/firestore"
import { toSlug } from "@/app/lib/utils/slug"
import { buildLocationDetails } from "@/app/lib/utils/geoLocation"
import { buildSiteMedia } from "./buildSiteMedia"
import type { SiteInput } from "@/application/services/sites/SitesService"
import type { SiteFormViewModel } from "@/presentation/sites/view-models/SiteFormViewModel"

/**
 * Único constructor del documento de sitio a partir del formulario (draft, publish, update).
 * El service decide qué campos persiste en cada caso (ver `contentFields`).
 */
export function buildSiteInput(
  uid: string,
  token: { name?: string; picture?: string },
  form: SiteFormViewModel,
  publicationStatus: "draft" | "published",
): SiteInput {
  const { country, department, city } = buildLocationDetails({
    countryName: form.country,
    countrySlug: form.countrySlug,
    departmentName: form.region,
    departmentSlug: form.regionSlug,
    cityName: form.city,
    citySlug: form.citySlug,
  })

  return {
    name: form.name.trim(),
    slug: `${toSlug(form.name)}-${Date.now().toString(36)}`,
    category: form.category,
    description: form.description,
    location: {
      geo: new GeoPoint(form.coordinates?.latitude ?? 0, form.coordinates?.longitude ?? 0),
      address: form.address,
      city,
      department,
      country,
      venue: form.name.trim(),
      moreInfo: "",
    },
    media: buildSiteMedia(form.media),
    schedule: form.schedule,
    socialMedia: form.socialMedia ?? {},
    temporarilyClosed: form.temporarilyClosed ?? { isClosed: false, reason: "" },
    bookingUrl: form.bookingUrl ?? "",
    author: { id: uid, displayName: token.name ?? "", photoURL: token.picture ?? "" },
    publicationStatus,
    moderationStatus: "pending",
    isActive: false,
    analytics: { clicks: 0, likes: 0, shares: 0, eventCount: 0, score: 0 },
    publishedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    rejectedAt: null,
    rejectionReason: null,
  }
}
