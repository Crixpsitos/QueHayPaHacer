import { test } from "node:test"
import assert from "node:assert/strict"
import { ACTIVITY_CATEGORIES } from "@/domain/entities/activities/value-objects/ActivityCategory"
import { canShowCatalog, canShowPromotions, CATALOG_RULES, promoBlockReason } from "./catalogRules"

test("cada categoría de actividad tiene regla (si se agrega una, esta prueba obliga a decidir)", () => {
  for (const c of ACTIVITY_CATEGORIES) assert.ok(c.slug in CATALOG_RULES, c.slug)
})
test("comida y mercados venden y hacen promociones; voluntariado y fe no", () => {
  assert.equal(canShowPromotions("comida-y-bebida"), true)
  assert.equal(canShowPromotions("compras-y-mercados"), true)
  assert.equal(canShowCatalog("voluntariado-y-comunidad"), false)
  assert.equal(canShowPromotions("fe-y-espiritualidad"), false)
})
test("aire libre y espacios: catálogo sí, promociones no", () => {
  assert.equal(canShowCatalog("aire-libre"), true)
  assert.equal(canShowPromotions("aire-libre"), false)
  assert.equal(canShowPromotions("espacios-y-reservas"), false)
})
test("motivo de bloqueo para el selector", () => {
  assert.equal(promoBlockReason("comida-y-bebida", "Comida y bebida"), null)
  assert.match(promoBlockReason("voluntariado-y-comunidad", "Voluntariado y comunidad") ?? "", /no admite promociones/)
})
