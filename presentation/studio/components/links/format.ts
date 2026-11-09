export const fmt = (n: number) => n.toLocaleString("es-CO")
/** `2026-11-05` → `5 nov` (el día calendario no cambia con la zona horaria del navegador). */
export const shortDay = (day: string) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`)).replace(".", "")
