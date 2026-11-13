import { cop } from "@/domain/entities/catalog/Product"
import type { Extra } from "./value-objects/Price"

/**
 * Servicios aparte de una reserva (almuerzo, botellas de agua…): se eligen entre los «Se paga aparte» de la actividad, con cantidad.
 * Sirven para armar un mensaje de WhatsApp ordenado y para que quien organiza vea qué pidió cada persona.
 */
export interface ExtraPick { label: string; qty: number }
export const EXTRA_QTY_MAX = 20
export const EXTRA_PICKS_MAX = 10

/** Deja solo servicios que la actividad ofrece (por su nombre), cantidades enteras de 1 a 20 y sin repetidos (se suman). */
export function normalizeExtraPicks(input: unknown, offered: readonly Pick<Extra, "label">[]): ExtraPick[] {
  if (!Array.isArray(input)) return []
  const names = new Set(offered.map((x) => x.label))
  const sum = new Map<string, number>()
  for (const raw of input) {
    const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
    if (typeof r.label !== "string" || !names.has(r.label)) continue
    const q = Math.trunc(Number(r.qty))
    if (!Number.isFinite(q) || q < 1) continue
    sum.set(r.label, Math.min(EXTRA_QTY_MAX, (sum.get(r.label) ?? 0) + q))
  }
  return [...sum].slice(0, EXTRA_PICKS_MAX).map(([label, qty]) => ({ label, qty }))
}

/** Lo que suman los servicios elegidos (con el precio vigente de la actividad). */
export function extrasTotal(picks: readonly ExtraPick[], offered: readonly Pick<Extra, "label" | "amountCop">[]): number {
  const price = new Map(offered.map((x) => [x.label, x.amountCop]))
  return picks.reduce((s, p) => s + (price.get(p.label) ?? 0) * p.qty, 0)
}

/** «Almuerzo ×2, Agua ×1» (para listas). */
export const describeExtras = (picks: readonly ExtraPick[]): string => picks.map((p) => `${p.label} ×${p.qty}`).join(", ")

/** Mensaje de WhatsApp para reservar: quién es, qué actividad, qué día y qué servicios agrega. Sin precios: se acuerdan por el chat. */
export interface ReservationAsk { activityTitle: string; activityUrl: string; dateLabel: string | null; extras: readonly ExtraPick[]; paid: boolean }

export function buildReservationMessage(i: ReservationAsk): string {
  const day = i.dateLabel ? ` para el ${i.dateLabel}` : ""
  const lines = [`Hola, vengo de Que Hay Pa Hacer. Vi tu actividad «${i.activityTitle}» y quisiera reservar un cupo${day}.`]
  if (i.extras.length) lines.push("", "Además quisiera agregar:", ...i.extras.map((e) => `• ${e.qty} × ${e.label}`))
  lines.push("", i.paid ? "¿Me confirmas disponibilidad y cómo hago el pago?" : "¿Me confirmas que hay cupo?", "", i.activityUrl)
  return lines.join("\n")
}

/** Enlace wa.me al número del botón de la actividad (`https://wa.me/57…`) con el mensaje escrito. null si el botón no es de WhatsApp. */
export function reservationWhatsappHref(ctaValue: string, message: string): string | null {
  const m = /^https:\/\/wa\.me\/(\d{10,13})$/.exec(ctaValue)
  return m ? `https://wa.me/${m[1]}?text=${encodeURIComponent(message)}` : null
}

export const extrasLine = (picks: readonly ExtraPick[], offered: readonly Pick<Extra, "label" | "amountCop">[]): string => {
  const t = extrasTotal(picks, offered)
  return t > 0 ? `${describeExtras(picks)} · ${cop(t)}` : describeExtras(picks)
}
