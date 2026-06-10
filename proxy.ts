import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  authMiddleware,
  redirectToHome,
  redirectToLogin,
} from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";

const PRIVATE_PATHS = ["/profile"];
const PUBLIC_PATHS = ["contact", "/register", "/login", "/reset-password"];

function extractClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  return request.headers.get("x-real-ip");
}

export async function proxy(request: NextRequest) {
  const clientIp = extractClientIp(request);

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
        return redirectToHome(request);
      }

      if (clientIp) headers.set("x-client-ip", clientIp);

      return NextResponse.next({
        request: {
          headers,
        },
      });
    },
    handleInvalidToken: async () => {
      return redirectToLogin(request, {
        path: "/login",
        privatePaths: PRIVATE_PATHS,
      });
    },
    handleError: async (error) => {
      console.error("Unhandled authentication error", { error });

      return redirectToLogin(request, {
        path: "/login",
        privatePaths: PRIVATE_PATHS,
      });
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
