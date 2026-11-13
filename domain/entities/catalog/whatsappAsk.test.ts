import { test } from "node:test"
import assert from "node:assert/strict"
import { askHref, buildAskMessage, type AskInput } from "./whatsappAsk"

const base: AskInput = { activityTitle: "Compra plantas en Vivero Raíces", activityUrl: "https://quehaypahacer.com/actividades/vivero-raices", items: [{ name: "Monstera", qty: 2 }, { name: "Suculentas", qty: 3 }] }

test("mensaje con lo que le interesó y el enlace; sin precios ni preguntas de inventario", () => {
  const m = buildAskMessage(base)
  assert.match(m, /^Hola, vengo de Que Hay Pa Hacer\. Vi tu actividad «Compra plantas en Vivero Raíces» y me interesa:/)
  assert.match(m, /• 2 × Monstera/)
  assert.match(m, /• 3 × Suculentas/)
  assert.match(m, /¿Me cuentas más\?/)
  assert.ok(m.endsWith("https://quehaypahacer.com/actividades/vivero-raices"))
  assert.doesNotMatch(m, /\$|disponible|total|aproximado|pasar a ver/i)
})
test("incluye la promoción vista", () => {
  assert.match(buildAskMessage({ ...base, promoTitles: ["Suculentas 3x2"] }), /Promoción que vi: Suculentas 3x2/)
})
test("sin productos: una pregunta sobre la actividad", () => {
  assert.match(buildAskMessage({ ...base, items: [] }), /me gustaría saber más/)
})
test("enlace wa.me al número colombiano; número inválido = null", () => {
  assert.match(askHref("316 000 0000", base) ?? "", /^https:\/\/wa\.me\/573160000000\?text=Hola%2C/)
  assert.equal(askHref("123", base), null)
})
test("lista muy larga: recorta para que el enlace no pase de 1800 caracteres", () => {
  const items = Array.from({ length: 12 }, (_, i) => ({ name: `Planta ${"x".repeat(80)} ${i}`, qty: 1 }))
  const href = askHref("3160000000", { ...base, items }) as string
  assert.ok(href.length <= 1800)
})
