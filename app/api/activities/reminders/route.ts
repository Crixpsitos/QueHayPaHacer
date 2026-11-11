import { NextResponse } from "next/server";
import { hasValidBearer } from "@/app/api/_lib/bearerAuth";
import { createServerContainer } from "@/infraestructure/di/container";

/**
 * Barrido diario de avisos «mañana sale…» (campanita). Lo llama la Cloud Function programada `sendActivityReminders`
 * con el mismo secreto de los webhooks (Bearer `SITE_REVALIDATE_WEBHOOK_SECRET`). Idempotente: un segundo llamado
 * el mismo día no repite avisos (ids fijos por persona y día).
 */
export async function POST(request: Request) {
  const secret = process.env.SITE_REVALIDATE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  if (!hasValidBearer(request, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await createServerContainer().activityReminderService.sweep();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[activity-reminders]", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "Sweep failed." }, { status: 500 });
  }
}
