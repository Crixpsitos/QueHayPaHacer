import { GeoPoint } from "firebase-admin/firestore"
import { toSlug } from "@/app/lib/utils/slug"
import { buildLocationDetails } from "@/app/lib/utils/geoLocation"
import { buildSiteMedia } from "./buildSiteMedia"
import { declarationVariant } from "@/app/lib/legal/declaration"
import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin"
import { normalizeOpeningPolicy } from "@/domain/entities/sites/value-objects/SiteOpeningPolicy"
import { normalizeRecommendations } from "@/domain/entities/sites/value-objects/SiteRecommendations"
import { initialVerification, type SitePublishedAs } from "@/domain/entities/sites/value-objects/SiteListing"
import type { SiteInput } from "@/application/services/sites/SitesService"
import { getSiteCompleteness } from "@/domain/entities/sites/siteCompleteness"
import { siteScore } from "@/domain/entities/sites/siteRanking"
import { completenessFromForm } from "@/presentation/sites/lib/completeness"
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
  // El cliente solo elige owner/proposer. Una cuenta de QHPA que no se declara dueña publica como QHPA.
  const publishedAs: SitePublishedAs = declarationVariant(form.publishedAs, isQhpaAdmin(uid))
  const { country, department, city } = buildLocationDetails({
    countryName: form.country,
    countrySlug: form.countrySlug,
    departmentName: form.region,
    departmentSlug: form.regionSlug,
    cityName: form.city,
    citySlug: form.citySlug,
  })

  const listingComplete = getSiteCompleteness(completenessFromForm(form)).complete
  const noInteractions = { clicks: 0, likes: 0, shares: 0, eventCount: 0 }

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
    openingPolicy: normalizeOpeningPolicy(form.openingPolicy),
    // note "" (no omitida) para que el set(merge) de la edición pueda borrar una nota anterior
    recommendations: { note: "", ...normalizeRecommendations(form.recommendations) },
    bookingUrl: form.bookingUrl ?? "",
    kind: form.kind ?? "business",
    publishedAs,
    verification: initialVerification(publishedAs),
    author: { id: uid, displayName: token.name ?? "", photoURL: token.picture ?? "" },
    publicationStatus,
    moderationStatus: "pending",
    isActive: false,
    listingComplete,
    analytics: { ...noInteractions, score: siteScore(noInteractions, listingComplete) },
    publishedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    rejectedAt: null,
    rejectionReason: null,
  }
}
