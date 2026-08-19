import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authMiddleware } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";

const PRIVATE_PATHS = ["/profile", "/sites"];
const PUBLIC_PATHS = ["contact", "/register", "/login", "/reset-password"];

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
      const isPrivate = PRIVATE_PATHS.some((p) =>
        request.nextUrl.pathname.startsWith(p),
      );
      if (!isPrivate) return NextResponse.next();

      const redirectTo = encodeURIComponent(request.nextUrl.pathname);
      return NextResponse.redirect(
        new URL(`/login?redirect_to=${redirectTo}`, request.url),
      );
    },
    handleError: async (error) => {
      console.error("Unhandled authentication error", { error });
      return NextResponse.redirect(new URL("/login", request.url));
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
