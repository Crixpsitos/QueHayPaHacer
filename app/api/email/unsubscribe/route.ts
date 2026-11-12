import { NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/domain/entities/email/unsubscribeToken";
import { createServerContainer } from "@/infraestructure/di/container";
import { clientIp, createIpLimiter } from "@/app/api/_lib/ipRateLimit";

const limit = createIpLimiter(30);

/**
 * Baja con un clic (RFC 8058): el cliente de correo (Gmail, Outlook) hace POST a este enlace sin abrir la página.
 * Solo POST: un GET (vista previa de un antivirus o del correo) NO da de baja a nadie por accidente.
 */
export async function POST(request: Request) {
  if (!limit(clientIp(request))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const url = new URL(request.url);
  const uid = url.searchParams.get("u") ?? "";
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || !verifyUnsubscribeToken(uid, url.searchParams.get("t"), process.env.EMAIL_UNSUBSCRIBE_SECRET)) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  await createServerContainer().notificationPrefsService.unsubscribe(uid);
  return NextResponse.json({ ok: true });
}
