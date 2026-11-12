import { test } from "node:test"
import assert from "node:assert/strict"
import { emptyCatalog, normalizeCatalog, validateCatalog, type SiteCatalog } from "./SiteCatalog"
import type { Product } from "./Product"

const NOW = new Date("2026-11-20T20:00:00Z")
const prod = (id: string, price = 10000): Product => ({ id, name: `P ${id}`, description: "", priceCop: price, unit: "unidad", section: "", photoUrl: "", available: true, tags: [], traces: "", discount: null })
const cat = (o: Partial<SiteCatalog> = {}): SiteCatalog => ({ ...emptyCatalog("s1"), products: [prod("a"), prod("b", 5000)], ...o })

test("una carta vacía es válida", () => assert.equal(validateCatalog(emptyCatalog("s1"), NOW), null))
test("normaliza los teléfonos a 10 dígitos (acepta +57 y espacios)", () => {
  const n = normalizeCatalog(cat({ whatsapp: "+57 316 000 0000", reservePhone: "300-123-4567" }))
  assert.equal(n.whatsapp, "3160000000")
  assert.equal(n.reservePhone, "3001234567")
})
test("un teléfono inválido se guarda vacío al normalizar y se rechaza si llega tal cual a validar", () => {
  assert.equal(normalizeCatalog(cat({ whatsapp: "12345" })).whatsapp, "")
  assert.match(validateCatalog(cat({ whatsapp: "12345" }), NOW) ?? "", /WhatsApp/)
})
test("valida productos y promociones juntos", () => {
  assert.ok(validateCatalog(cat({ products: [prod("a"), prod("a")] }), NOW))
  const promo = { id: "p", title: "Dos por uno", imageUrl: "", buy: { productId: "a", qty: 1 }, get: { productId: "zzz", qty: 1 }, benefit: { kind: "free" as const }, weekdays: [], start: "", end: "", validFrom: "2026-11-01", validUntil: "2026-12-30", termsNote: "", paused: false, activityIds: [] }
  assert.match(validateCatalog(cat({ promotions: [promo] }), NOW) ?? "", /ya no está/)
  assert.equal(validateCatalog(cat({ promotions: [{ ...promo, get: { productId: "b", qty: 1 } }] }), NOW), null)
})
test("quitar un producto que usa una promoción invalida la carta (no queda una promoción rota)", () => {
  const promo = { id: "p", title: "Dos por uno", imageUrl: "", buy: { productId: "a", qty: 1 }, get: { productId: "b", qty: 1 }, benefit: { kind: "free" as const }, weekdays: [], start: "", end: "", validFrom: "2026-11-01", validUntil: "2026-12-30", termsNote: "", paused: false, activityIds: [] }
  assert.ok(validateCatalog(cat({ products: [prod("a")], promotions: [promo] }), NOW))
})
