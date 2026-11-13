import { colombianNumber } from "@/domain/entities/activities/value-objects/Cta"

/**
 * Mensaje de WhatsApp para PREGUNTAR por una actividad económica (no somos una tienda en línea: no hay precios cotizados, ni
 * pedidos, ni pagos). Va ya escrito con lo que le interesó a la persona, la promoción que vio y el enlace de la actividad; la
 * persona puede editarlo antes de enviar. El precio y la disponibilidad los habla ella con el sitio.
 */
export interface AskItem { name: string; qty: number }
export interface AskInput {
  activityTitle: string
  activityUrl: string
  items: AskItem[]
  promoTitles?: string[]
}

const MAX_ITEMS = 12
/** wa.me acepta enlaces largos, pero muchos clientes cortan por encima de ~2000 caracteres. */
const MAX_URL = 1800

export function buildAskMessage(i: AskInput): string {
  const head = `Hola, vengo de Que Hay Pa Hacer. Vi tu actividad «${i.activityTitle}»`
  if (!i.items.length) return `${head} y me gustaría saber más.\n\n${i.activityUrl}`
  const shown = i.items.slice(0, MAX_ITEMS)
  const more = i.items.length - shown.length
  const promos = (i.promoTitles ?? []).filter(Boolean)
  return [
    `${head} y me interesa:`,
    ...shown.map((x) => `• ${x.qty} × ${x.name}`),
    ...(more > 0 ? [`• …y ${more} más`] : []),
    ...(promos.length ? ["", `Promoción que vi: ${promos.join(", ")}`] : []),
    "",
    "¿Me cuentas más?",
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
