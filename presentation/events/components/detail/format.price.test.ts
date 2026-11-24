import { test } from "node:test"
import assert from "node:assert/strict"
import * as v from "valibot"
import { formatPrice, formatTierAmount, hasFreePart, tiersLabel } from "./format"
import { PriceTierSchema } from "@/application/dto/events/EventDto"

const mixed = { isFree: false, amount: 15000, currency: "COP", tiers: [{ name: "Zona de videojuegos", amount: 15000 }, { name: "Concurso de cosplay", amount: 0, description: "Inscripción y desfile" }] }
const paid = { isFree: false, amount: 15000, currency: "COP", tiers: [{ name: "General", amount: 15000 }, { name: "VIP", amount: 40000 }] }

test("con una categoría gratis y otra de pago dice «Gratis y $X»", () => {
  assert.match(formatPrice(mixed), /^Gratis y \$\s?15\.000$/)
  assert.equal(tiersLabel(mixed), "2 categorías")
  assert.equal(hasFreePart(mixed), true)
  assert.equal(formatTierAmount(mixed, 0), "Gratis")
})

test("todas de pago siguen diciendo «Desde»; sin categorías todo igual que antes", () => {
  assert.match(formatPrice(paid), /^Desde \$\s?15\.000$/)
  assert.equal(hasFreePart(paid), false)
  assert.match(formatPrice({ isFree: false, amount: 20000, currency: "COP" }), /^\$\s?20\.000$/)
  assert.equal(formatPrice({ isFree: true, amount: 0, currency: "COP" }), "Gratis")
  assert.equal(hasFreePart({ isFree: true, amount: 0, currency: "COP" }), true)
  assert.equal(tiersLabel({ isFree: false, amount: 5000, currency: "COP" }), "")
})

test("todas las categorías gratis = Gratis", () => {
  assert.equal(formatPrice({ isFree: false, amount: 0, currency: "COP", tiers: [{ name: "A", amount: 0 }, { name: "B", amount: 0 }] }), "Gratis")
})

test("una categoría puede costar 0 y explicar qué incluye; negativo no", () => {
  assert.equal(v.safeParse(PriceTierSchema, { name: "Cosplay", amount: 0, description: "  Desfile a las 5 pm " }).success, true)
  assert.equal(v.safeParse(PriceTierSchema, { name: "Cosplay", amount: -1 }).success, false)
  assert.equal(v.safeParse(PriceTierSchema, { name: "", amount: 0 }).success, false)
})
