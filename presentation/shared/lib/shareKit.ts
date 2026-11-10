/** Texto listo para pegar en WhatsApp u otra red (solo lo que existe: sin puntos dobles ni huecos). */
export function shareMessage(i: { title: string; when?: string; where?: string; url: string }): string {
  const sentence = (s?: string) => { const t = (s ?? "").trim(); return t ? (/[.!?]$/.test(t) ? t : `${t}.`) : "" }
  return [sentence(i.title), sentence(i.when), sentence(i.where), `Más información aquí: ${i.url}`].filter(Boolean).join(" ")
}

/** Parte `text` en líneas de hasta `maxChars` por palabras; la última lleva `…` si el texto no cabe en `maxLines`. */
export function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  // una palabra más larga que la línea se parte en trozos (si no, se saldría del afiche)
  const words = text.trim().split(/\s+/).filter(Boolean).flatMap((w) => (w.length > maxChars ? (w.match(new RegExp(`.{1,${maxChars}}`, "g")) ?? [w]) : [w]))
  const lines: string[] = []
  let cur = ""
  for (const w of words) {
    if (cur && (cur + " " + w).length > maxChars) { lines.push(cur); cur = w } else cur = cur ? cur + " " + w : w
  }
  if (cur) lines.push(cur)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  kept[maxLines - 1] = kept[maxLines - 1] + "…"
  return kept
}

/** "domingo 22 de noviembre, 8:00 p. m." en hora de Bogotá; "" si la fecha no es válida. */
export function eventWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const date = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }).format(d)
  const time = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Bogota" }).format(d)
  const clean = (x: string) => x.replace(/[\u202f\u00a0]/g, " ")
  // según la versión de ICU el período sale "p. m." o "p m": se normaliza a "a. m." / "p. m."
  const hour = clean(time).replace(/\s*([ap])\.?\s?m\.?$/i, (_m, x: string) => ` ${x.toLowerCase()}. m.`)
  return `${clean(date).replace(",", "")}, ${hour}`
}

/** Qué se lleva quien escanea el QR: el gancho del afiche (titular + 3 puntos cortos). */
export function posterHooks(kind: "event" | "site"): { headline: string; bullets: [string, string, string] } {
  return kind === "event"
    ? { headline: "Escanéalo y mira todo en un toque", bullets: ["Fecha, hora y lugar", "Fotos y precio", "Cómo llegar sin perderte"] }
    : { headline: "Escanéalo y conoce el lugar", bullets: ["Horarios y fotos", "Cómo llegar sin perderte", "Reserva o escríbeles"] }
}
