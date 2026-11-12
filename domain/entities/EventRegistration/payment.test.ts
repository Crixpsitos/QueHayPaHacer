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
