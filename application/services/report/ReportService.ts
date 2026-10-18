import type { IReportRepository } from "@/domain/repository/report/IReportRepository";
import type { EventsService } from "@/application/services/events/EventsService";
import type { EventSessionService } from "@/application/services/events/EventSessionService";
import type { SitesService } from "@/application/services/sites/SitesService";
import { parseReportInput } from "@/application/dto/report/ReportDto";

export type ReportResult = { success: true } | { success: false; error: string };

export class ReportService {
  constructor(
    private readonly repository: IReportRepository,
    private readonly eventsService: EventsService,
    private readonly eventSessionService: EventSessionService,
    private readonly sitesService: SitesService,
  ) {}

  async submit(uid: string, input: unknown): Promise<ReportResult> {
    const parsed = parseReportInput(input);
    if (!parsed.success) return parsed;
    const { targetType, targetId, sessionId, reason, details } = parsed.output;
    const noun = targetType === "event" ? "este evento" : "este sitio";

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
    return { success: true };
  }

  private async snapshot(
    targetType: "event" | "site",
    targetId: string,
    sessionId?: string,
  ): Promise<{ title: string; authorId: string | null } | null> {
    if (targetType === "site") return this.sitesService.getTitleAndAuthor(targetId);

    const event = await this.eventsService.getEventById(targetId);
    if (!event || event.status === "draft") return null;
    if (sessionId && !(await this.eventSessionService.getById(targetId, sessionId))) return null;
    return { title: event.title, authorId: event.author?.id ?? null };
  }
}
