import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import * as v from "valibot";
import { createServerContainer } from "@/infraestructure/di/container";

const ModerationDecisionSchema = v.object({
  eventId: v.pipe(v.string(), v.nonEmpty()),
  decision: v.picklist(["approved", "rejected"] as const),
  reason: v.optional(v.string()),
  reviewer: v.pipe(v.string(), v.nonEmpty()),
});

function hasValidSecret(request: Request, expected: string) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const secret = process.env.EVENT_MODERATION_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Moderation webhook is not configured." }, { status: 503 });
  }
  if (!hasValidSecret(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = v.safeParse(ModerationDecisionSchema, await request.json());
  if (!parsed.success || (parsed.output.decision === "rejected" && !parsed.output.reason?.trim())) {
    return NextResponse.json({ error: "Invalid moderation decision." }, { status: 400 });
  }

  try {
    const { eventsService, userService, badgeService, profileService } = createServerContainer();
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

    if (parsed.output.decision === "approved" && result.wasPrePublication) {
      const author = await userService.getUserById(result.event.author.id);
      if (author?.participation === "consumer") {
        await userService.markAsCreator(author.uid);
        updateTag(`user-profile-${author.uid}`);
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

    updateTag(`event-${result.event.id}`);
    updateTag(`user-events-${result.event.author.id}`);
    updateTag("event-list");
    revalidateTag(`profile-events-${result.event.author.id}`, "max");
    revalidateTag(`profile-stats-${result.event.author.id}`, "max");
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