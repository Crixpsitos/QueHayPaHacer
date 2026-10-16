import { NextResponse } from "next/server";
import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";

// TEMPORAL (diagnóstico de og:image en WhatsApp): muestra qué User-Agent llega a la app desplegada y si Next
// lo trataría como rastreador. Se borra en cuanto se confirme la causa.
export function GET(request: Request) {
  const ua = request.headers.get("user-agent");
  return NextResponse.json(
    { ua, isHtmlLimitedBot: !!ua && HTML_LIMITED_BOT_UA_RE.test(ua), hasForwardedFor: !!request.headers.get("x-forwarded-for") },
    { headers: { "Cache-Control": "no-store" } },
  );
}
