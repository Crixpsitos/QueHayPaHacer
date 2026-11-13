import { test } from "node:test"
import assert from "node:assert/strict"
import { buildReservationMessage, describeExtras, extrasLine, extrasTotal, normalizeExtraPicks, reservationWhatsappHref } from "./reservationExtras"

const offered = [{ label: "Almuerzo", amountCop: 18000 }, { label: "Botella de agua", amountCop: 3000 }]

test("solo servicios que la actividad ofrece, cantidades enteras 1–20, repetidos se suman", () => {
  const r = normalizeExtraPicks([{ label: "Almuerzo", qty: 2 }, { label: "Almuerzo", qty: 1 }, { label: "Helicóptero", qty: 1 }, { label: "Botella de agua", qty: 0 }, { label: "Botella de agua", qty: 99 }, { label: 5, qty: 1 }, null], offered)
  assert.deepEqual(r, [{ label: "Almuerzo", qty: 3 }, { label: "Botella de agua", qty: 20 }])
  assert.deepEqual(normalizeExtraPicks("nada", offered), [])
  assert.deepEqual(normalizeExtraPicks([{ label: "Almuerzo", qty: 2.9 }], offered), [{ label: "Almuerzo", qty: 2 }])
})
test("total y descripciones", () => {
  const picks = [{ label: "Almuerzo", qty: 2 }, { label: "Botella de agua", qty: 1 }]
  assert.equal(extrasTotal(picks, offered), 39000)
  assert.equal(describeExtras(picks), "Almuerzo ×2, Botella de agua ×1")
  assert.equal(extrasLine(picks, offered), "Almuerzo ×2, Botella de agua ×1 · $39.000")
  assert.equal(extrasLine([], offered), "")
})
test("mensaje de reserva: día, servicios y pregunta de pago; sin servicios no hay lista", () => {
  const m = buildReservationMessage({ activityTitle: "Senderismo dominical", activityUrl: "https://x.co/actividades/senderismo", dateLabel: "domingo 16 de noviembre", extras: [{ label: "Almuerzo", qty: 2 }, { label: "Botella de agua", qty: 1 }], paid: true })
  assert.match(m, /^Hola, vengo de Que Hay Pa Hacer\. Vi tu actividad «Senderismo dominical» y quisiera reservar un cupo para el domingo 16 de noviembre\./)
  assert.match(m, /Además quisiera agregar:\n• 2 × Almuerzo\n• 1 × Botella de agua/)
  assert.match(m, /¿Me confirmas disponibilidad y cómo hago el pago\?/)
  assert.ok(m.endsWith("https://x.co/actividades/senderismo"))
  const sin = buildReservationMessage({ activityTitle: "Yoga", activityUrl: "u", dateLabel: null, extras: [], paid: false })
  assert.doesNotMatch(sin, /Además/)
  assert.match(sin, /reservar un cupo\./)
  assert.match(sin, /¿Me confirmas que hay cupo\?/)
})
test("enlace de WhatsApp solo si el botón es de WhatsApp", () => {
  const h = reservationWhatsappHref("https://wa.me/573001112233", "Hola ñ")
  assert.equal(h, "https://wa.me/573001112233?text=Hola%20%C3%B1")
  assert.equal(reservationWhatsappHref("+573001112233", "x"), null)
  assert.equal(reservationWhatsappHref("https://instagram.com/x", "x"), null)
})
