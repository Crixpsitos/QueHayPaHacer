/** Rutas `/r/…` que usan los botones de salida (la redirección y el conteo viven en el servidor, ver outRedirect). */
export const eventOutHref = (eventId: string, to: "register") => `/r/e/${encodeURIComponent(eventId)}?to=${to}`

export const siteOutHref = (siteId: string, to: "website" | "booking" | "social", network?: string) =>
  `/r/s/${encodeURIComponent(siteId)}?to=${to}${network ? `&n=${encodeURIComponent(network)}` : ""}`
