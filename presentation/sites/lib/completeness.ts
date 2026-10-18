import type { CompletenessInput } from "@/domain/entities/sites/siteCompleteness"
import type { SiteDetail, SiteFormViewModel } from "../view-models/SiteFormViewModel"

export function completenessFromForm(f: SiteFormViewModel): CompletenessInput {
  return {
    hasCover: f.media.some((m) => m.type === "image" && m.isCover && m.status !== "error"),
    description: f.description,
    schedule: f.schedule,
    address: f.address,
    openingPolicy: f.openingPolicy,
    socialMedia: f.socialMedia,
    bookingUrl: f.bookingUrl,
    recommendations: f.recommendations,
  }
}

export function completenessFromDetail(s: SiteDetail): CompletenessInput {
  return {
    hasCover: !!s.coverUrl,
    description: s.description ?? "",
    schedule: s.schedule ?? {},
    address: s.address ?? "",
    openingPolicy: s.openingPolicy,
    socialMedia: s.socialMedia,
    bookingUrl: s.bookingUrl,
    recommendations: s.recommendations,
  }
}
