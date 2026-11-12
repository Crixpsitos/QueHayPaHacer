import { test } from "node:test"
import assert from "node:assert/strict"
import { describePromo, isCatalogPromoCurrent, promoPricing, promosForActivity, validateCatalogPromotions, type CatalogPromotion } from "./CatalogPromotion"
import type { Product } from "./Product"

const prod = (id: string, name: string, priceCop: number, o: Partial<Product> = {}): Product => ({ id, name, description: "", priceCop, unit: "unidad", section: "", photoUrl: "", available: true, tags: [], traces: "", discount: null, ...o })
const waffle = prod("w", "Waffle con helado", 14000)
const sorbete = prod("s", "Sorbete de mora", 7000)
const products = [waffle, sorbete]
const TODAY = "2026-11-20"
const promo = (o: Partial<CatalogPromotion> = {}): CatalogPromotion => ({ id: "p1", title: "Tardes felices", imageUrl: "", buy: { productId: "w", qty: 1 }, get: { productId: "s", qty: 1 }, benefit: { kind: "percent", value: 50 }, weekdays: [5, 6, 0], start: "15:00", end: "19:00", validFrom: "2026-11-01", validUntil: "2026-12-30", termsNote: "", paused: false, activityIds: ["a1"], ...o })

test("cuenta: mitad de precio en lo que se recibe", () => {
  assert.deepEqual(promoPricing(promo(), products, TODAY), { normal: 21000, withPromo: 17500, saves: 3500 })
})
test("cuenta: gratis, precio especial y el mismo producto dos veces", () => {
  assert.equal(promoPricing(promo({ benefit: { kind: "free" } }), products, TODAY)?.saves, 7000)
  assert.equal(promoPricing(promo({ benefit: { kind: "special", value: 4000 } }), products, TODAY)?.withPromo, 18000)
  const tres = promo({ buy: { productId: "s", qty: 2 }, get: { productId: "s", qty: 1 }, benefit: { kind: "free" } })
  assert.deepEqual(promoPricing(tres, products, TODAY), { normal: 21000, withPromo: 14000, saves: 7000 })
})
test("la cuenta usa el precio con descuento vigente del producto", () => {
  const conDesc = [waffle, prod("s", "Sorbete de mora", 7000, { discount: { priceCop: 5000, until: "2026-12-01" } })]
  assert.equal(promoPricing(promo({ benefit: { kind: "free" } }), conDesc, TODAY)?.saves, 5000)
})
test("producto que ya no existe: sin cuenta y no valida", () => {
  assert.equal(promoPricing(promo(), [waffle], TODAY), null)
  assert.match(validateCatalogPromotions([promo()], [waffle], TODAY) ?? "", /ya no está/)
})
test("validación: cantidades, porcentaje, precio especial, vigencia obligatoria", () => {
  assert.equal(validateCatalogPromotions([promo()], products, TODAY), null)
  assert.ok(validateCatalogPromotions([promo({ buy: { productId: "w", qty: 0 } })], products, TODAY))
  assert.ok(validateCatalogPromotions([promo({ get: { productId: "s", qty: 11 } })], products, TODAY))
  assert.ok(validateCatalogPromotions([promo({ benefit: { kind: "percent", value: 100 } })], products, TODAY))
  assert.ok(validateCatalogPromotions([promo({ benefit: { kind: "special", value: 7000 } })], products, TODAY))
  assert.ok(validateCatalogPromotions([promo({ validUntil: "" })], products, TODAY))
  assert.ok(validateCatalogPromotions([promo({ title: "ab" })], products, TODAY))
})
test("validación: sin enlaces ni HTML en el título", () => {
  assert.ok(validateCatalogPromotions([promo({ title: "mira www.x.com" })], products, TODAY))
  assert.ok(validateCatalogPromotions([promo({ title: "<b>oferta</b>" })], products, TODAY))
})
test("vigente: pausada o vencida nunca se muestra; solo en las actividades elegidas", () => {
  const now = new Date("2026-11-20T20:00:00Z")
  assert.equal(isCatalogPromoCurrent(promo(), now), true)
  assert.equal(isCatalogPromoCurrent(promo({ paused: true }), now), false)
  assert.equal(isCatalogPromoCurrent(promo({ validUntil: "2026-11-19" }), now), false)
  assert.equal(promosForActivity([promo()], "a1", now).length, 1)
  assert.equal(promosForActivity([promo()], "otra", now).length, 0)
})
test("descripción legible", () => {
  assert.equal(describePromo(promo(), products), "Compras 1 Waffle con helado y recibes 1 Sorbete de mora a mitad de precio.")
  assert.equal(describePromo(promo({ benefit: { kind: "free" } }), products), "Compras 1 Waffle con helado y recibes 1 Sorbete de mora gratis.")
  assert.equal(describePromo(promo({ benefit: { kind: "special", value: 4000 } }), products), "Compras 1 Waffle con helado y recibes 1 Sorbete de mora por $4.000.")
  assert.equal(describePromo(promo({ buy: { productId: "s", qty: 2 }, get: { productId: "s", qty: 1 }, benefit: { kind: "free" } }), products), "Llevas 2 Sorbete de mora y 1 más gratis.")
})
import { cartTotal } from "./CatalogPromotion"

test("total aproximado: suma y descuenta las promociones que aplican ahora, las veces que caben", () => {
  const live = new Date("2026-11-20T21:00:00Z") // viernes 4 p. m. en Bogotá: dentro de «Tardes felices»
  const r = cartTotal([{ productId: "w", qty: 2 }, { productId: "s", qty: 3 }], [promo()], products, TODAY, live)
  assert.equal(r.subtotal, 2 * 14000 + 3 * 7000)
  assert.deepEqual(r.applied.map((a) => [a.id, a.times, a.saves]), [["p1", 2, 7000]])
  assert.equal(r.total, 49000 - 7000)
})
test("total aproximado: fuera de horario o sin los dos productos no hay descuento", () => {
  const fuera = new Date("2026-11-18T15:00:00Z") // miércoles
  assert.equal(cartTotal([{ productId: "w", qty: 1 }, { productId: "s", qty: 1 }], [promo()], products, TODAY, fuera).total, 21000)
  const live = new Date("2026-11-20T21:00:00Z")
  assert.equal(cartTotal([{ productId: "w", qty: 1 }], [promo()], products, TODAY, live).total, 14000)
})
test("total aproximado: mismo producto (lleva 2, el 3.º gratis) aplica por cada grupo completo", () => {
  const tres = promo({ buy: { productId: "s", qty: 2 }, get: { productId: "s", qty: 1 }, benefit: { kind: "free" }, weekdays: [], start: "", end: "" })
  const live = new Date("2026-11-20T21:00:00Z")
  assert.equal(cartTotal([{ productId: "s", qty: 6 }], [tres], products, TODAY, live).total, 6 * 7000 - 2 * 7000)
  assert.equal(cartTotal([{ productId: "s", qty: 2 }], [tres], products, TODAY, live).total, 14000)
})
