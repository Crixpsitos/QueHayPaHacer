/**
 * Plantillas de correo en español de Colombia con tú. El dominio arma el MODELO (qué dice) y el texto plano;
 * el HTML lo dibuja el componente React de `infraestructure/email` (react-email), que escapa todo lo que viene de personas.
 */
export interface EmailCtx { siteUrl: string; unsubscribeUrl: string }
export interface WeeklyCard { title: string; when: string; place: string; price: string; imageUrl: string | null; href: string }
/** Correo semanal con portada: tira de días, plan destacado con foto y filas por día. */
export interface WeeklyBlock { range: string; total: number; days: { label: string; count: number }[]; featured: WeeklyCard | null; anytime: { title: string; href: string }[]; groups: { title: string; items: WeeklyCard[] }[]; allHref: string }
export interface EmailModel {
  weekly?: WeeklyBlock
  heading: string
  paragraphs: string[]
  items: { title: string; when: string; href: string }[]
  cta: { label: string; href: string } | null
  reason: string
  unsubscribeUrl: string
}
export interface BuiltEmail { subject: string; text: string; model: EmailModel }

/** El enlace del correo lleva el canal «em» (y utm) para que la medición sepa que la visita vino de un correo. */
export function withEmailAttribution(url: string, medium: string): string {
  const [base, hash] = url.split("#")
  const q = `ch=em&utm_source=email&utm_medium=${medium}&utm_campaign=auto`
  return `${base}${base.includes("?") ? "&" : "?"}${q}${hash ? `#${hash}` : ""}`
}

const REASON: Record<string, string> = {
  activity_join: "Recibes este correo porque organizas esta actividad en Qué Hay Pa Hacer.",
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
  return { subject: n.title.replace(/["“”]/g, ""), text, model: { heading: n.title, paragraphs: body ? [body] : [], items: [], cta: { label: "Ver la actividad", href: link }, reason, unsubscribeUrl: c.unsubscribeUrl } }
}

export interface ValueItem { title: string; when: string; path: string; day?: string; time?: string; place?: string; price?: string; imageUrl?: string; /** el plan destacado del correo (si no, el primero con foto) */ star?: boolean }
const VALUE: Record<"forYou" | "weekly", { subject: string; heading: string; reason: string; empty: string }> = {
  forYou: { subject: "Para ti: planes que te pueden gustar en Ibagué", heading: "Planes que te pueden gustar", reason: "Recibes este correo porque activaste «Para ti» en Mis avisos. Elegimos según lo que guardas y marcas con «Yo fui».", empty: "Hoy no hay nada nuevo para ti." },
  weekly: { subject: "Qué hacer este fin de semana en Ibagué", heading: "Qué hacer este fin de semana en Ibagué", reason: "Recibes este correo porque autorizaste el resumen semanal en Mis avisos.", empty: "Esta semana todavía no hay planes publicados." },
}

/** «Para ti» (máx. 1 al día) y «Qué hacer esta semana» (1 por semana): contenido vigente, y cada correo dice por qué se recibe. */
export function valueEmail(kind: "forYou" | "weekly", items: ValueItem[], c: EmailCtx, extra: { anytime?: { title: string; path: string }[] } = {}): BuiltEmail {
  const v = VALUE[kind]
  const link = (p: string) => withEmailAttribution(`${c.siteUrl}${p}`, kind)
  const list = items.length ? items.map((i) => `• ${i.when} · ${i.title}\n  ${link(i.path)}`).join("\n") : v.empty
  const text = `${v.heading}\n\n${list}\n\n—\n${v.reason}\nDejar de recibir correos: ${c.unsubscribeUrl}\n`
  const base: EmailModel = { heading: v.heading, paragraphs: items.length ? [] : [v.empty], items: items.map((i) => ({ title: i.title, when: i.when, href: link(i.path) })), cta: null, reason: v.reason, unsubscribeUrl: c.unsubscribeUrl }
  const weekly = kind === "weekly" && items.length && items.every((i) => i.day) ? weeklyBlock(items, c, link, extra.anytime ?? []) : null
  return { subject: v.subject, text, model: weekly ? { ...base, items: [], weekly } : base }
}

/** Foto optimizada para correo: la misma ruta de imágenes de la web, a 640 px. */
const emailImage = (siteUrl: string, url?: string) => (url ? `${siteUrl}/_next/image?url=${encodeURIComponent(url)}&w=640&q=75` : null)

function weeklyBlock(items: ValueItem[], c: EmailCtx, link: (p: string) => string, anytime: { title: string; path: string }[]): WeeklyBlock {
  const card = (i: ValueItem): WeeklyCard => ({ title: i.title, when: i.time ?? i.when, place: i.place ?? "", price: i.price ?? "", imageUrl: emailImage(c.siteUrl, i.imageUrl), href: link(i.path) })
  // el destacado: el primero con foto (si ninguno la tiene, no hay destacado y todo va en filas)
  const star = items.find((i) => i.star) ?? items.find((i) => i.imageUrl)
  const days = [...new Set(items.map((i) => i.day!))]
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  return {
    range: days.length > 1 ? `${days[0]} al ${days[days.length - 1]}` : days[0],
    total: items.length,
    days: days.map((d) => ({ label: cap(d), count: items.filter((i) => i.day === d).length })),
    featured: star ? card(star) : null,
    anytime: anytime.map((a) => ({ title: a.title, href: link(a.path) })),
    groups: days.map((d) => ({ title: cap(d), items: items.filter((i) => i.day === d && i !== star).map(card) })).filter((g) => g.items.length),
    allHref: link("/actividades"),
  }
}

/** Correos para quien ORGANIZA: alguien se unió (agrupado por hora) ya sale por `transactionalEmailFor`; aquí, la salida sin inscritos y el resumen de la semana. */
export type OrganizerLine = { title: string; count: number; path: string }
const ORG_REASON = "Recibes este correo porque organizas actividades en Qué Hay Pa Hacer."

export function organizerEmptyEmail(a: { title: string; path: string; when: string }, c: EmailCtx): BuiltEmail {
  const link = withEmailAttribution(`${c.siteUrl}${a.path}`, "organizer_empty")
  const share = withEmailAttribution(`${c.siteUrl}/actividades/mis`, "organizer_empty")
  const heading = `"${a.title}" sale ${a.when} y aún no tiene inscritos`
  const body = "Comparte el enlace por WhatsApp o imprime el afiche con el QR desde tu panel: las salidas se llenan en los últimos días."
  const text = `${heading}\n\n${body}\n\nTu actividad: ${link}\nTu panel: ${share}\n\n—\n${ORG_REASON}\nDejar de recibir correos: ${c.unsubscribeUrl}\n`
  return { subject: `Aún nadie se anota a "${a.title}"`.replace(/["“”]/g, ""), text, model: { heading, paragraphs: [body], items: [], cta: { label: "Abrir mi panel", href: share }, reason: ORG_REASON, unsubscribeUrl: c.unsubscribeUrl } }
}

export function organizerWeeklyEmail(lines: OrganizerLine[], c: EmailCtx): BuiltEmail {
  const total = lines.reduce((n, l) => n + l.count, 0)
  const heading = total === 1 ? "Esta semana 1 persona se anotó a tus actividades" : `Esta semana ${total} personas se anotaron a tus actividades`
  const link = (p: string) => withEmailAttribution(`${c.siteUrl}${p}`, "organizer_weekly")
  const list = lines.map((l) => `• ${l.title}: ${l.count} ${l.count === 1 ? "inscrito" : "inscritos"}\n  ${link(l.path)}`).join("\n")
  const text = `${heading}\n\n${list}\n\n—\n${ORG_REASON}\nDejar de recibir correos: ${c.unsubscribeUrl}\n`
  return { subject: heading, text, model: { heading, paragraphs: [], items: lines.map((l) => ({ title: l.title, when: `${l.count} ${l.count === 1 ? "inscrito" : "inscritos"} en los últimos 7 días`, href: link(l.path) })), cta: null, reason: ORG_REASON, unsubscribeUrl: c.unsubscribeUrl } }
}
