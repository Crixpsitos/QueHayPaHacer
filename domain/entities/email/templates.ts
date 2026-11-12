/** Plantillas de correo (texto + HTML), en español de Colombia con tú. Todo lo que viene de personas se escapa. */
export interface EmailCtx { siteUrl: string; unsubscribeUrl: string }
export interface BuiltEmail { subject: string; text: string; html: string }

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** El enlace lleva el canal «em» (y utm) para que la medición sepa que la visita vino de un correo. */
export function withEmailAttribution(url: string, medium: string): string {
  const [base, hash] = url.split("#")
  const q = `ch=em&utm_source=email&utm_medium=${medium}&utm_campaign=auto`
  return `${base}${base.includes("?") ? "&" : "?"}${q}${hash ? `#${hash}` : ""}`
}

const wrap = (title: string, bodyHtml: string, footerHtml: string) =>
  `<!doctype html><html lang="es-CO"><body style="margin:0;background:#FAFAFC;font-family:Arial,Helvetica,sans-serif;color:#27272A"><div style="max-width:520px;margin:0 auto;padding:24px"><p style="margin:0 0 16px;font-weight:700;color:#9B0A26">Qué Hay Pa Hacer</p><h1 style="margin:0 0 12px;font-size:22px;line-height:1.25">${esc(title)}</h1>${bodyHtml}<hr style="border:0;border-top:1px solid #E4E4E7;margin:24px 0"><p style="margin:0;font-size:12px;line-height:1.5;color:#71717A">${footerHtml}</p></div></body></html>`
const button = (href: string, label: string) => `<p style="margin:20px 0"><a href="${esc(href)}" style="background:#9B0A26;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;display:inline-block">${esc(label)}</a></p>`

const REASON: Record<string, string> = {
  activity_join_confirmed: "Recibes este correo porque reservaste un cupo en una actividad de Qué Hay Pa Hacer.",
  activity_reminder: "Recibes este correo porque reservaste un cupo o guardaste esta actividad en Qué Hay Pa Hacer.",
  activity_last_spot: "Recibes este correo porque guardaste esta actividad en Qué Hay Pa Hacer.",
}

/** Confirmación de reserva, «mañana sale…» y último cupo: SOLO para quien reservó o guardó; con baja visible. null si el tipo no va por correo. */
export function transactionalEmailFor(n: { type: string; title: string; body?: string; href?: string }, c: EmailCtx): BuiltEmail | null {
  const reason = REASON[n.type]
  if (!reason) return null
  const link = n.href ? withEmailAttribution(`${c.siteUrl}${n.href}`, "transactional") : c.siteUrl
  const body = n.body ?? ""
  const text = `${n.title}\n\n${body ? `${body}\n\n` : ""}Míralo aquí: ${link}\n\n—\n${reason}\nDejar de recibir correos: ${c.unsubscribeUrl}\n`
  const html = wrap(n.title, `${body ? `<p style="margin:0 0 8px;font-size:16px;line-height:1.5">${esc(body)}</p>` : ""}${button(link, "Ver la actividad")}`, `${esc(reason)}<br><a href="${esc(c.unsubscribeUrl)}" style="color:#9B0A26">Dejar de recibir correos</a>`)
  return { subject: n.title.replace(/["“”]/g, ""), text, html }
}

export interface ValueItem { title: string; when: string; path: string }
const VALUE: Record<"forYou" | "weekly", { subject: string; heading: string; reason: string; empty: string }> = {
  forYou: { subject: "Para ti: planes que te pueden gustar en Ibagué", heading: "Planes que te pueden gustar", reason: "Recibes este correo porque activaste «Para ti» en Mis avisos. Elegimos según lo que guardas y marcas con «Yo fui».", empty: "Hoy no hay nada nuevo para ti." },
  weekly: { subject: "Qué hacer esta semana en Ibagué", heading: "Qué hacer esta semana en Ibagué", reason: "Recibes este correo porque autorizaste el resumen semanal en Mis avisos.", empty: "Esta semana todavía no hay planes publicados." },
}

/** «Para ti» (máx. 1 al día) y «Qué hacer esta semana» (1 por semana): contenido vigente, y cada correo dice por qué se recibe. */
export function valueEmail(kind: "forYou" | "weekly", items: ValueItem[], c: EmailCtx): BuiltEmail {
  const v = VALUE[kind]
  const link = (p: string) => withEmailAttribution(`${c.siteUrl}${p}`, kind)
  const list = items.length ? items.map((i) => `• ${i.when} · ${i.title}\n  ${link(i.path)}`).join("\n") : v.empty
  const text = `${v.heading}\n\n${list}\n\n—\n${v.reason}\nDejar de recibir correos: ${c.unsubscribeUrl}\n`
  const rows = items.length ? `<ul style="margin:0;padding:0;list-style:none">${items.map((i) => `<li style="margin:0 0 14px"><a href="${esc(link(i.path))}" style="color:#9B0A26;font-weight:700;text-decoration:none;font-size:16px">${esc(i.title)}</a><br><span style="font-size:14px;color:#52525B">${esc(i.when)}</span></li>`).join("")}</ul>` : `<p>${esc(v.empty)}</p>`
  return { subject: v.subject, text, html: wrap(v.heading, rows, `${esc(v.reason)}<br><a href="${esc(c.unsubscribeUrl)}" style="color:#9B0A26">Dejar de recibir correos</a>`) }
}
