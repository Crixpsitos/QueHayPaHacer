import { NextResponse } from "next/server";
import { createServerContainer } from "@/infraestructure/di/container";
import { verifyResendWebhook } from "@/infraestructure/email/ResendWebhookVerifier";

/**
 * Avisos de Resend (rebotes, quejas de spam, entregas). La firma se verifica con `RESEND_WEBHOOK_SECRET`; sin firma válida no se
 * procesa nada. El cuerpo se lee crudo (la firma se calcula sobre el texto exacto). Configúralo en Resend → Webhooks.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 100_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  const event = verifyResendWebhook(raw, request.headers, process.env.RESEND_WEBHOOK_SECRET);
  if (!event) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  try {
    const result = await createServerContainer().emailEventsService.handle(event);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("[email-webhook]", e instanceof Error ? e.message : "error");
    return NextResponse.json({ error: "Failed" }, { status: 500 }); // Resend reintenta
  }
}
