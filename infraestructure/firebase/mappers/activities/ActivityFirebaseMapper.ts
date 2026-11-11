import type { Activity } from "@/domain/entities/activities/Activity"
import { nextOccurrence, occursWeekdays } from "@/domain/entities/activities/value-objects/occurrences"
import type { FirebaseActivityDto } from "../../dto/activities/FirebaseActivityDto"

type DateLike = Date | { toDate(): Date }
const toDate = (v: DateLike): Date => (v instanceof Date ? v : v.toDate())
const toDateOrNull = (v: DateLike | null | undefined): Date | null => (v ? toDate(v) : null)

/** Firestore rechaza `undefined`: lo quita (recursivo) sin tocar fechas. */
function stripUndefined<T>(x: T): T {
  if (Array.isArray(x)) return x.map(stripUndefined) as T
  if (x && typeof x === "object" && !(x instanceof Date)) {
    return Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined).map(([k, v]) => [k, stripUndefined(v)])) as T
  }
  return x
}

const EMPTY_RATING = { count: 0, sum: 0, avg: 0, dist: [0, 0, 0, 0, 0] } as Activity["rating"]
const EMPTY_ANALYTICS = { views: 0, clicks: 0, visits: 0, reviews: 0 }

export class ActivityFirebaseMapper {
  toDomain(id: string, dto: FirebaseActivityDto): Activity {
    return {
      id,
      slug: dto.slug,
      title: dto.title,
      tagline: dto.tagline ?? "",
      description: dto.description,
      kind: dto.kind,
      siteId: dto.siteId ?? null,
      host: dto.host,
      ownerUid: dto.ownerUid,
      category: dto.category,
      companions: dto.companions ?? [],
      difficulty: dto.difficulty ?? null,
      durationMinutes: dto.durationMinutes ?? null,
      ageNote: dto.ageNote ?? "",
      meetingPoint: dto.meetingPoint,
      schedule: dto.schedule,
      priceOptions: dto.priceOptions ?? [],
      extras: dto.extras ?? [],
      sections: dto.sections ?? [],
      cta: dto.cta ?? null,
      media: dto.media ?? [],
      rating: dto.rating ?? EMPTY_RATING,
      analytics: dto.analytics ?? EMPTY_ANALYTICS,
      publicationStatus: dto.publicationStatus,
      moderationStatus: dto.moderationStatus,
      isActive: dto.isActive,
      reviewedAt: toDateOrNull(dto.reviewedAt),
      reviewedBy: dto.reviewedBy ?? null,
      rejectedAt: toDateOrNull(dto.rejectedAt),
      rejectionReason: dto.rejectionReason ?? null,
      createdAt: toDate(dto.createdAt),
      updatedAt: toDate(dto.updatedAt),
      publishedAt: toDateOrNull(dto.publishedAt),
    }
  }

  /** `now` fija la "próxima salida" derivada; el repositorio la refresca al escribir. */
  toFirebase(a: Activity, now: Date = new Date()): FirebaseActivityDto {
    const { id: _id, ...rest } = a
    void _id
    return stripUndefined({
      ...rest,
      listable: a.publicationStatus === "published" && a.moderationStatus === "approved" && a.isActive,
      occursWeekdays: occursWeekdays(a.schedule),
      nextOccurrenceAt: nextOccurrence(a.schedule, now)?.startsAt ?? null,
    }) as unknown as FirebaseActivityDto
  }
}
