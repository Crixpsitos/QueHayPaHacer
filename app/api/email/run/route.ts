import { NextResponse } from "next/server";
import { hasValidBearer } from "@/app/api/_lib/bearerAuth";
import { createServerContainer } from "@/infraestructure/di/container";

/**
 * Corrida diaria del correo: arma los envíos programados y vacía la cola respetando el tope diario. La llama la Cloud
 * Function programada con el mismo secreto de los webhooks (Bearer `SITE_REVALIDATE_WEBHOOK_SECRET`). Sin Resend configurado
 * no envía nada y lo dice.
 */
export async function POST(request: Request) {
  const secret = process.env.SITE_REVALIDATE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  if (!hasValidBearer(request, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = createServerContainer();
  if (!c.emailService.enabled) return NextResponse.json({ skipped: "El correo no está configurado (RESEND_API_KEY y EMAIL_FROM)." });
  try {
    return NextResponse.json({ drained: await c.emailQueueService.drain() });
  } catch (error) {
    console.error("[email-run]", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "Run failed." }, { status: 500 });
  }
}
