import { test } from "node:test"
import assert from "node:assert/strict"
import { askHref, buildAskMessage, type AskInput } from "./whatsappAsk"

const base: AskInput = { activityTitle: "Compra plantas en Vivero Raíces", activityUrl: "https://quehaypahacer.com/actividades/vivero-raices", items: [{ name: "Monstera", qty: 2, unit: "unidad", unitPriceCop: 35000 }, { name: "Suculentas", qty: 3, unit: "unidad", unitPriceCop: 6000 }] }

test("mensaje estructurado con lista, total y enlace", () => {
  const m = buildAskMessage(base)
  assert.match(m, /^Hola, vengo de Que Hay Pa Hacer\. Vi tu actividad «Compra plantas en Vivero Raíces» y quisiera preguntar por:/)
  assert.match(m, /• 2 × Monstera · \$35\.000 c\/u/)
  assert.match(m, /Total aproximado: \$88\.000/)
  assert.match(m, /¿Los tienen disponibles\? ¿Cuándo puedo pasar a verlos\?/)
  assert.ok(m.endsWith("https://quehaypahacer.com/actividades/vivero-raices"))
})
test("un solo producto va en singular; con promoción y total ya calculado", () => {
  const m = buildAskMessage({ ...base, items: [base.items[0]], promoTitles: ["Suculentas 3x2"], totalCop: 60000 })
  assert.match(m, /¿Lo tienen disponible\? ¿Cuándo puedo pasar a verlo\?/)
  assert.match(m, /Promoción que vi: Suculentas 3x2/)
  assert.match(m, /Total aproximado: \$60\.000/)
})
test("sin productos: una pregunta sobre la actividad", () => {
  assert.match(buildAskMessage({ ...base, items: [] }), /quisiera hacerte una pregunta/)
})
test("enlace wa.me al número colombiano; número inválido = null", () => {
  assert.match(askHref("316 000 0000", base) ?? "", /^https:\/\/wa\.me\/573160000000\?text=Hola%2C/)
  assert.equal(askHref("123", base), null)
})
test("lista muy larga: recorta para que el enlace no pase de 1800 caracteres", () => {
  const items = Array.from({ length: 12 }, (_, i) => ({ name: `Planta ${"x".repeat(55)} ${i}`, qty: 1, unit: "unidad" as const, unitPriceCop: 10000 }))
  const href = askHref("3160000000", { ...base, items }) as string
  assert.ok(href.length <= 1800)
})
