import { cop, UNIT_LABELS, type ProductUnit } from "./Product"
import { colombianNumber } from "@/domain/entities/activities/value-objects/Cta"

/**
 * Mensaje de WhatsApp para PREGUNTAR por productos (no somos una tienda en línea: no hay pagos ni pedidos). Va ya escrito,
 * con la lista, el total aproximado, la promoción que se vio y el enlace de la actividad. La persona puede editarlo antes de enviar.
 */
export interface AskItem { name: string; qty: number; unit: ProductUnit; unitPriceCop: number }
export interface AskInput {
  activityTitle: string
  activityUrl: string
  items: AskItem[]
  promoTitles?: string[]
  /** Total aproximado ya calculado (con promociones). Si falta, se suma sin promociones. */
  totalCop?: number
}

const MAX_ITEMS = 12
/** wa.me acepta enlaces largos, pero muchos clientes cortan por encima de ~2000 caracteres. */
const MAX_URL = 1800

const line = (i: AskItem) => `• ${i.qty} × ${i.name} · ${cop(i.unitPriceCop)} ${UNIT_LABELS[i.unit]}`

export function buildAskMessage(i: AskInput): string {
  const head = `Hola, vengo de Que Hay Pa Hacer. Vi tu actividad «${i.activityTitle}»`
  const tail = i.items.length === 1 ? "¿Lo tienen disponible? ¿Cuándo puedo pasar a verlo?" : "¿Los tienen disponibles? ¿Cuándo puedo pasar a verlos?"
  if (!i.items.length) return `${head} y quisiera hacerte una pregunta.\n\n${i.activityUrl}`
  const shown = i.items.slice(0, MAX_ITEMS)
  const more = i.items.length - shown.length
  const total = i.totalCop ?? i.items.reduce((s, x) => s + x.qty * x.unitPriceCop, 0)
  const promos = (i.promoTitles ?? []).filter(Boolean)
  return [
    `${head} y quisiera preguntar por:`,
    ...shown.map(line),
    ...(more > 0 ? [`• …y ${more} más`] : []),
    "",
    `Total aproximado: ${cop(total)}`,
    ...(promos.length ? [`Promoción que vi: ${promos.join(", ")}`] : []),
    "",
    tail,
    "",
    i.activityUrl,
  ].join("\n")
}

/** Enlace wa.me al número del sitio con el mensaje escrito. null si el número no es válido. Recorta la lista si el enlace queda muy largo. */
export function askHref(phone: string, input: AskInput): string | null {
  const n = colombianNumber(phone)
  if (!n) return null
  let items = input.items
  for (;;) {
    const url = `https://wa.me/57${n}?text=${encodeURIComponent(buildAskMessage({ ...input, items }))}`
    if (url.length <= MAX_URL || items.length <= 1) return url
    items = items.slice(0, -1)
  }
}
