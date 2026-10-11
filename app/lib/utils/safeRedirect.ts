/** Solo rutas relativas del mismo origen; cualquier otra cosa → "/". Evita open redirects vía ?redirect_to. */
export function safeRedirect(to?: string | null): string {
  if (!to || !to.startsWith("/") || to.startsWith("//") || to.startsWith("/\\")) return "/";
  try {
    const url = new URL(to, "http://x");
    return url.origin === "http://x" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}
