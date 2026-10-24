import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import * as v from "valibot";
import { createServerContainer } from "@/infraestructure/di/container";
import { hasValidBearer } from "@/app/api/_lib/bearerAuth";
import { linkedSiteIds, notifySiteAuthorsOfEvent, refreshSiteEventCounts, revalidateSitesFromRoute } from "@/app/lib/sites/siteEvents";

const ModerationDecisionSchema = v.object({
  eventId: v.pipe(v.string(), v.nonEmpty()),
  decision: v.picklist(["approved", "rejected"] as const),
  reason: v.optional(v.string()),
  reviewer: v.pipe(v.string(), v.nonEmpty()),
});

export async function POST(request: Request) {
  const secret = process.env.EVENT_MODERATION_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Moderation webhook is not configured." }, { status: 503 });
  }
  if (!hasValidBearer(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = v.safeParse(ModerationDecisionSchema, await request.json());
  if (!parsed.success || (parsed.output.decision === "rejected" && !parsed.output.reason?.trim())) {
    return NextResponse.json({ error: "Invalid moderation decision." }, { status: 400 });
  }

  try {
    const { eventsService, userService, badgeService, profileService, notificationService } = createServerContainer();
    const before = await eventsService.getEventById(parsed.output.eventId);
    if (!before) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const result = await eventsService.applyModerationDecision(
      parsed.output.eventId,
      parsed.output.decision,
      parsed.output.reviewer,
      parsed.output.reason,
    );

    // Aviso al autor: la decisión ya quedó guardada; si falla el aviso no se revierte.
    const { event: moderated } = result;
    await notificationService.notify(
      moderated.author.id,
      parsed.output.decision === "approved"
        ? {
            type: "event_moderation",
            title: `Aprobaron tu evento "${moderated.title}"`,
            body: "Ya está publicado.",
            href: `/eventos/${moderated.id}`,
          }
        : {
            type: "event_moderation",
            title: `No aprobaron tu evento "${moderated.title}"`,
            body: moderated.rejectionReason ?? undefined,
            href: `/eventos/${moderated.id}/edit`,
          },
    );

    // Agenda del sitio: aprobar publica el evento y rechazar lo baja → recuenta los sitios vinculados. Si recién se
    // publicó (moderación previa), el autor del sitio se entera. Efectos secundarios: no rompen la decisión.
    revalidateSitesFromRoute(await refreshSiteEventCounts(await linkedSiteIds(result.event)));
    if (parsed.output.decision === "approved" && result.wasPrePublication) {
      await notifySiteAuthorsOfEvent(result.event);
    }

    if (parsed.output.decision === "approved" && result.wasPrePublication) {
      const author = await userService.getUserById(result.event.author.id);
      if (author?.participation === "consumer") {
        await userService.markAsCreator(author.uid);
        revalidateTag(`user-profile-${author.uid}`, { expire: 0 });
      }

      const events = await profileService.getUserEvents(result.event.author.id);
      const approvedEvents = events.filter(
        (event) => event.status === "published" && event.moderationStatus === "approved",
      );
      if (approvedEvents.length === 1) {
        await badgeService.awardBadgeToUser(
          result.event.author.id,
          "first-event",
          "Primer evento aprobado",
        );
        revalidateTag(`profile-badges-${result.event.author.id}`, "max");
      }
    }

    // Route Handler: updateTag solo existe en Server Actions; expire 0 = expiración inmediata.
    for (const tag of [
      `event-${result.event.id}`,
      `profile-events-${result.event.author.id}`,
      `profile-stats-${result.event.author.id}`,
      "event-list",
    ]) {
      revalidateTag(tag, { expire: 0 });
    }
    revalidateTag("explore", "max");
    revalidatePath("/", "page");
    revalidatePath("/eventos", "layout");

    return NextResponse.json({
      success: true,
      eventId: result.event.id,
      status: result.event.status,
      moderationStatus: result.event.moderationStatus,
    });
  } catch (error) {
    console.error("[EVENT MODERATION]", error);
    return NextResponse.json({ error: "Could not apply moderation decision." }, { status: 500 });
  }
}