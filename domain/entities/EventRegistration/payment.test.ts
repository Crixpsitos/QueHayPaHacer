import { test } from "node:test"
import assert from "node:assert/strict"
import { payTiers, resolvePayment, summarizeIncome } from "./payment"

const vip = { isFree: false, amount: 30000, tiers: [{ name: "General", amount: 30000 }, { name: "VIP", amount: 80000 }] }

test("categorías: tiers, precio único como General, gratis vacío", () => {
  assert.equal(payTiers(vip).length, 2)
  assert.deepEqual(payTiers({ isFree: false, amount: 20000 }), [{ name: "General", amount: 20000 }])
  assert.deepEqual(payTiers({ isFree: true, amount: 0 }), [])
})
test("resolvePayment: el valor sale del evento; categoría falsa = null; sin categoría = la más barata", () => {
  assert.deepEqual(resolvePayment(vip, "VIP"), { tier: "VIP", amountCop: 80000 })
  assert.equal(resolvePayment(vip, "Inventada"), null)
  assert.deepEqual(resolvePayment(vip), { tier: "General", amountCop: 30000 })
  assert.deepEqual(resolvePayment({ isFree: true, amount: 0 }, "VIP"), { tier: null, amountCop: 0 })
})
test("ingresos: total, conteo y categoría más alta primero; ignora sin pago", () => {
  const s = summarizeIncome([{ tier: "General", paidAmount: 30000 }, { tier: "VIP", paidAmount: 80000 }, { tier: "General", paidAmount: 30000 }, { paidAmount: 0 }, {}])
  assert.equal(s.total, 140000)
  assert.equal(s.paidCount, 3)
  assert.deepEqual(s.byTier.map((t) => [t.tier, t.count, t.amount]), [["VIP", 1, 80000], ["General", 2, 60000]])
})
test("ingresos: lista todas las categorías del evento, también las que aún no venden", () => {
  const tiers = [{ name: "General", amount: 30000 }, { name: "VIP", amount: 80000 }, { name: "Estudiante", amount: 15000 }]
  const s = summarizeIncome([{ tier: "General", paidAmount: 30000 }], tiers)
  assert.deepEqual(s.byTier.map((t) => [t.tier, t.count, t.amount]), [["VIP", 0, 0], ["General", 1, 30000], ["Estudiante", 0, 0]])
  assert.equal(s.total, 30000)
  assert.equal(s.paidCount, 1)
})
test("ingresos: un cobro de una categoría que ya no existe en el evento se conserva", () => {
  const s = summarizeIncome([{ tier: "Antigua", paidAmount: 10000 }], [{ name: "General", amount: 30000 }])
  assert.deepEqual(s.byTier.map((t) => t.tier), ["General", "Antigua"])
})

import { applyPaid } from "./payment"
test("sumar un pago al resumen sin releer nada: suma total, conteo y la categoría (nueva o existente)", () => {
  const tiers = [{ name: "General", amount: 30000 }, { name: "VIP", amount: 80000 }]
  const base = summarizeIncome([{ tier: "General", paidAmount: 30000 }], tiers)
  const a = applyPaid(base, { tier: "VIP", amount: 80000 })
  assert.equal(a.total, 110000)
  assert.equal(a.paidCount, 2)
  assert.deepEqual(a.byTier.map((t) => [t.tier, t.count, t.amount]), [["VIP", 1, 80000], ["General", 1, 30000]])
  const b = applyPaid(a, { tier: "General", amount: 30000 })
  assert.deepEqual(b.byTier.map((t) => [t.tier, t.count, t.amount]), [["VIP", 1, 80000], ["General", 2, 60000]])
  assert.equal(base.total, 30000, "no muta el resumen original")
})
test("pago sin categoría o categoría que no existía: entra como «General» o como categoría nueva", () => {
  const e = summarizeIncome([])
  assert.deepEqual(applyPaid(e, { tier: null, amount: 10000 }).byTier.map((t) => t.tier), ["General"])
  assert.deepEqual(applyPaid(e, { tier: "Antigua", amount: 5000 }).byTier.map((t) => t.tier), ["Antigua"])
  assert.equal(applyPaid(e, { tier: "VIP", amount: 0 }).total, 0)
})
