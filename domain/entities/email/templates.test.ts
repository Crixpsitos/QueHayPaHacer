import { test } from "node:test"
import assert from "node:assert/strict"
import { transactionalEmailFor, valueEmail, withEmailAttribution } from "./templates"

const ctx = { siteUrl: "https://x.co", unsubscribeUrl: "https://x.co/baja?u=u1&t=abc" }
const n = (type: string, extra = {}) => ({ type, title: 'Estás dentro: "Senderismo & café"', body: "Salida: domingo 15 de noviembre.", href: "/actividades/senderismo", ...extra })

test("el enlace del correo lleva el canal «em» y respeta query y # existentes", () => {
  assert.equal(withEmailAttribution("https://x.co/actividades/a", "transactional"), "https://x.co/actividades/a?ch=em&utm_source=email&utm_medium=transactional&utm_campaign=auto")
  assert.equal(withEmailAttribution("https://x.co/actividades/a#resenas", "weekly"), "https://x.co/actividades/a?ch=em&utm_source=email&utm_medium=weekly&utm_campaign=auto#resenas")
  assert.match(withEmailAttribution("https://x.co/a?x=1", "forYou"), /\?x=1&ch=em/)
})
test("transaccional: confirmación, recordatorio y último cupo con tu texto, tuteo y baja visible", () => {
  for (const t of ["activity_join_confirmed", "activity_reminder", "activity_last_spot"]) {
    const e = transactionalEmailFor(n(t), ctx)!
    assert.ok(e.subject.includes("Senderismo"), t)
    assert.ok(e.text.includes("https://x.co/actividades/senderismo?ch=em"), t)
    assert.ok(e.text.includes(ctx.unsubscribeUrl) && e.html.includes("/baja?u=u1&amp;t=abc"), t) // en HTML el & va escapado
    assert.match(e.text, /porque (reservaste|guardaste|te apuntaste)/i)
  }
})
test("solo tres tipos de aviso se envían por correo; los demás no", () => {
  assert.equal(transactionalEmailFor(n("activity_join"), ctx), null)
  assert.equal(transactionalEmailFor(n("review_received"), ctx), null)
})
test("el HTML escapa el texto (sin inyección) y no hay voseo", () => {
  const e = transactionalEmailFor(n("activity_join_confirmed", { title: '<img src=x onerror=alert(1)> "hola"' }), ctx)!
  assert.ok(!e.html.includes("<img"))
  assert.ok(e.html.includes("&lt;img"))
  assert.doesNotMatch(`${e.text} ${e.html}`, /\b(vos|tenés|querés|podés|mirá|sabés|hacé)\b/i)
})
test("correos de valor: dicen por qué llegan, listan lo vigente con enlace y llevan la baja", () => {
  for (const kind of ["forYou", "weekly"] as const) {
    const e = valueEmail(kind, [{ title: "Trote en el parque", when: "Hoy 5:30 p. m.", path: "/actividades/trote" }], ctx)
    assert.ok(e.text.includes("Trote en el parque") && e.text.includes("https://x.co/actividades/trote?ch=em"))
    assert.match(e.text, /porque (activaste|autorizaste|elegiste)/i)
    assert.ok(e.text.includes(ctx.unsubscribeUrl))
  }
})
