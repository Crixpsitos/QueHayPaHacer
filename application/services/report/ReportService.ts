import type { IReportRepository } from "@/domain/repository/report/IReportRepository";
import type { EventsService } from "@/application/services/events/EventsService";
import type { EventSessionService } from "@/application/services/events/EventSessionService";
import type { SitesService } from "@/application/services/sites/SitesService";
import { shouldHidePreventively } from "@/domain/entities/activities/moderation/reviewModeration";
import { parseReportInput } from "@/application/dto/report/ReportDto";

export type ReportResult = { success: true } | { success: false; error: string };

export class ReportService {
  constructor(
    private readonly repository: IReportRepository,
    private readonly eventsService: EventsService,
    private readonly eventSessionService: EventSessionService,
    private readonly sitesService: SitesService,
    /** Actividades y reseñas (opcional: sin esto solo se reportan eventos y sitios). `review` recibe `{actividad}_{clave}`. */
    private readonly more?: {
      activity: (id: string) => Promise<{ title: string; authorId: string | null } | null>;
      review: (compoundId: string) => Promise<{ title: string; authorId: string | null; reviewId: string } | null>;
      hideReview: (reviewId: string) => Promise<void>;
      clock?: () => Date;
    },
  ) {}

  async submit(uid: string, input: unknown): Promise<ReportResult> {
    const parsed = parseReportInput(input);
    if (!parsed.success) return parsed;
    const { targetType, targetId, sessionId, reason, details } = parsed.output;
    const noun = { event: "este evento", site: "este sitio", activity: "esta actividad", review: "esta reseña" }[targetType];

    const target = await this.snapshot(targetType, targetId, sessionId);
    if (!target) return { success: false, error: `No encontramos ${noun}.` };
    if (target.authorId === uid) return { success: false, error: "No puedes reportar tu propio contenido." };

    const created = await this.repository.create({
      targetType,
      targetId,
      sessionId,
      reason,
      details,
      uid,
      status: "open",
      targetTitle: target.title,
      targetAuthorId: target.authorId,
    });
    if (!created) return { success: false, error: `Ya reportaste ${noun}. Lo estamos revisando.` };
    if (targetType === "review" && this.more && target.reviewId) {
      const now = (this.more.clock ?? (() => new Date()))();
      const recent = await this.repository.recentReporters("review", targetId, new Date(now.getTime() - 86_400_000)).catch(() => []);
      if (shouldHidePreventively(recent, now)) await this.more.hideReview(target.reviewId).catch(() => undefined);
    }
    return { success: true };
  }

  private async snapshot(
    targetType: "event" | "site" | "activity" | "review",
    targetId: string,
    sessionId?: string,
  ): Promise<{ title: string; authorId: string | null; reviewId?: string } | null> {
    if (targetType === "site") return this.sitesService.getTitleAndAuthor(targetId);
    if (targetType === "activity") return (await this.more?.activity(targetId)) ?? null;
    if (targetType === "review") return (await this.more?.review(targetId)) ?? null;

    const event = await this.eventsService.getEventById(targetId);
    if (!event || event.status === "draft") return null;
    if (sessionId && !(await this.eventSessionService.getById(targetId, sessionId))) return null;
    return { title: event.title, authorId: event.author?.id ?? null };
  }
}
