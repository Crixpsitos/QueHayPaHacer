import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authMiddleware } from "next-firebase-auth-edge";
import { removeCookies } from "next-firebase-auth-edge/next/cookies";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";

const PRIVATE_PATHS = ["/mis-eventos", "/mis-inscripciones", "/sites", "/eventos/create"];
// Editor y gestor de sesiones. /eventos/:id/sessions/:sessionId es público (detalle).
const PRIVATE_EVENT_PATH = /^\/eventos\/[^/]+\/(edit(\/.*)?|sessions\/?)$/;
const PUBLIC_PATHS = ["contact", "/register", "/login", "/reset-password"];

function isPrivatePath(pathname: string) {
  return pathname === "/profile" ||
    PRIVATE_EVENT_PATH.test(pathname) ||
    PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function loginRedirect(request: NextRequest) {
  const redirectTo = encodeURIComponent(`${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(new URL(`/login?redirect_to=${redirectTo}`, request.url));
}

export async function proxy(request: NextRequest) {
  return authMiddleware(request, {
    loginPath: "/api/login",
    logoutPath: "/api/logout",
    refreshTokenPath: "/api/refresh-token",
    debug: authConfig.debug,
    enableMultipleCookies: authConfig.enableMultipleCookies,
    enableCustomToken: authConfig.enableCustomToken,
    apiKey: authConfig.apiKey!,
    cookieName: authConfig.cookieName,
    cookieSerializeOptions: authConfig.cookieSerializeOptions,
    cookieSignatureKeys: authConfig.cookieSignatureKeys,
    serviceAccount: {
      projectId: authConfig.serviceAccount.projectId,
      privateKey: authConfig.serviceAccount.privateKey,
      clientEmail: authConfig.serviceAccount.clientEmail,
    },
    enableTokenRefreshOnExpiredKidHeader:
      authConfig.enableTokenRefreshOnExpiredKidHeader,
    tenantId: authConfig.tenantId,
    dynamicCustomClaimsKeys: authConfig.dynamicCustomClaimsKeys,
    handleValidToken: async (_tokens, headers) => {
      if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next({
        request: {
          headers,
        },
      });
    },
    handleInvalidToken: async () => {
      if (!isPrivatePath(request.nextUrl.pathname)) return NextResponse.next();
      return loginRedirect(request);
    },
    handleError: async (error) => {
      console.error("Unhandled authentication error", { error });
      // Sesión irrecuperable (p.ej. refresh token revocado al cambiar la contraseña):
      // se borran las cookies. Antes redirigía siempre a /login con la cookie rota,
      // /login volvía a fallar y quedaba en bucle (ERR_TOO_MANY_REDIRECTS).
      const response = isPrivatePath(request.nextUrl.pathname)
        ? loginRedirect(request)
        : NextResponse.next();
      removeCookies(request.headers, response, {
        cookieName: authConfig.cookieName,
        cookieSerializeOptions: authConfig.cookieSerializeOptions,
      });
      return response;
    },
    getMetadata: authConfig.getMetadata,
  });
}

export const config = {
  matcher: [
    "/",
    "/((?!_next|favicon.ico|__/auth|__/firebase|api|.*\\.).*)",
    // Middleware api routes
    "/api/login",
    "/api/logout",
    "/api/refresh-token",
    // App api routes
    "/api/custom-claims",
    "/api/user-counters",
  ],
};
