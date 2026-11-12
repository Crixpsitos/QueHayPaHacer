import { test } from "node:test"
import assert from "node:assert/strict"
import { isPromoCurrent, isPromoLive, normalizePromotions, promoScheduleLabel, validatePromotions, PROMOTIONS_MAX, type Promotion } from "./Promotion"

// miércoles 11-nov-2026, 4:00 p. m. en Bogotá (21:00 UTC)
const NOW = new Date("2026-11-11T21:00:00Z")
const p = (o: Partial<Promotion> = {}): Promotion => ({ id: "p1", title: "Tardes felices", description: "2x1 en helados", rule: { kind: "twoForOne" }, weekdays: [1, 2, 3, 4, 5], start: "15:00", end: "18:00", validFrom: "2026-11-01", validUntil: "2026-12-31", termsNote: "Hasta agotar existencias", paused: false, ...o })

test("una promoción válida; sin promociones también", () => { assert.equal(validatePromotions([p()]), null); assert.equal(validatePromotions([]), null) })
test("la vigencia final es obligatoria y no puede ir antes del inicio ni pasar de un año", () => {
  assert.notEqual(validatePromotions([p({ validUntil: "" })]), null)
  assert.notEqual(validatePromotions([p({ validFrom: "2026-12-01", validUntil: "2026-11-01" })]), null)
  assert.notEqual(validatePromotions([p({ validFrom: "2026-01-01", validUntil: "2027-06-01" })]), null)
  assert.notEqual(validatePromotions([p({ validUntil: "31/12/2026" })]), null)
})
test("título 3–60, descripción ≤240, condiciones ≤160, regla válida, máximo 5, sin enlaces", () => {
  assert.notEqual(validatePromotions([p({ title: "ab" })]), null)
  assert.notEqual(validatePromotions([p({ title: "t".repeat(61) })]), null)
  assert.notEqual(validatePromotions([p({ description: "d".repeat(241) })]), null)
  assert.notEqual(validatePromotions([p({ termsNote: "t".repeat(161) })]), null)
  assert.notEqual(validatePromotions([p({ rule: { kind: "gratis" as never } })]), null)
  assert.notEqual(validatePromotions(Array.from({ length: PROMOTIONS_MAX + 1 }, (_, i) => p({ id: `p${i}` }))), null)
  assert.notEqual(validatePromotions([p({ description: "pide en www.tienda.com" })]), null)
})
test("horas: ambas o ninguna, fin después del inicio", () => {
  assert.notEqual(validatePromotions([p({ start: "15:00", end: "" })]), null)
  assert.notEqual(validatePromotions([p({ start: "18:00", end: "15:00" })]), null)
  assert.equal(validatePromotions([p({ start: "", end: "" })]), null)
})
test("vigente por fechas: dentro del rango (inclusive) y no pausada; vencida nunca", () => {
  assert.equal(isPromoCurrent(p(), NOW), true)
  assert.equal(isPromoCurrent(p({ validUntil: "2026-11-11" }), NOW), true)
  assert.equal(isPromoCurrent(p({ validUntil: "2026-11-10" }), NOW), false)
  assert.equal(isPromoCurrent(p({ validFrom: "2026-11-12" }), NOW), false)
  assert.equal(isPromoCurrent(p({ paused: true }), NOW), false)
})
test("«ahora»: día de la semana y franja horaria (Bogotá)", () => {
  assert.equal(isPromoLive(p(), NOW), true) // miércoles 4 p. m.
  assert.equal(isPromoLive(p(), new Date("2026-11-11T23:30:00Z")), false) // 6:30 p. m.
  assert.equal(isPromoLive(p(), new Date("2026-11-14T21:00:00Z")), false) // sábado
  assert.equal(isPromoLive(p({ weekdays: [], start: "", end: "" }), NOW), true) // todos los días, todo el día
  assert.equal(isPromoLive(p({ validUntil: "2026-11-10" }), NOW), false)
})
test("horario legible", () => {
  assert.equal(promoScheduleLabel(p()), "Lun a vie · 3:00 a 6:00 p. m.")
  assert.equal(promoScheduleLabel(p({ weekdays: [], start: "", end: "" })), "Todos los días")
  assert.equal(promoScheduleLabel(p({ weekdays: [0], start: "", end: "" })), "Dom")
})
test("normalizar: recorta, descarta sin título y asigna ids", () => {
  const n = normalizePromotions([{ ...p(), id: "", title: "  Black Sunday  " }, { ...p(), title: "   " }])
  assert.equal(n.length, 1)
  assert.equal(n[0].title, "Black Sunday")
  assert.ok(n[0].id.length > 0)
})
