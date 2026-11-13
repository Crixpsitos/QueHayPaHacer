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
  for (const t of ["activity_join", "activity_join_confirmed", "activity_reminder", "activity_last_spot"]) {
    const e = transactionalEmailFor(n(t), ctx)!
    assert.ok(e.subject.includes("Senderismo"), t)
    assert.ok(e.text.includes("https://x.co/actividades/senderismo?ch=em"), t)
    assert.ok(e.text.includes(ctx.unsubscribeUrl) && e.model.unsubscribeUrl === ctx.unsubscribeUrl, t)
    assert.match(e.text, /porque (reservaste|guardaste|te apuntaste|organizas)/i)
  }
})
test("solo cuatro tipos de aviso se envían por correo; los demás no", () => {
  assert.equal(transactionalEmailFor(n("activity_sanction"), ctx), null)
  assert.equal(transactionalEmailFor(n("review_received"), ctx), null)
})
test("el texto no tiene voseo y el modelo lleva el botón con atribución", () => {
  const e = transactionalEmailFor(n("activity_join_confirmed"), ctx)!
  assert.doesNotMatch(`${e.text}`, /\b(vos|tenés|querés|podés|mirá|sabés|hacé)\b/i)
  assert.match(e.model.cta!.href, /\?ch=em&utm_source=email&utm_medium=transactional/)
})
test("correos de valor: dicen por qué llegan, listan lo vigente con enlace y llevan la baja", () => {
  for (const kind of ["forYou", "weekly"] as const) {
    const e = valueEmail(kind, [{ title: "Trote en el parque", when: "Hoy 5:30 p. m.", path: "/actividades/trote" }], ctx)
    assert.ok(e.text.includes("Trote en el parque") && e.text.includes("https://x.co/actividades/trote?ch=em"))
    assert.match(e.text, /porque (activaste|autorizaste|elegiste)/i)
    assert.ok(e.text.includes(ctx.unsubscribeUrl))
  }
})

test("correo semanal con portada: destacado con foto, grupos por día y foto optimizada", () => {
  const items = [
    { title: "A", when: "viernes 13 · 5:30 p. m.", path: "/actividades/a", day: "viernes 13", time: "5:30 p. m.", place: "Parque", price: "Gratis", imageUrl: "https://s.co/a.jpg" },
    { title: "B", when: "viernes 13 · 7:00 p. m.", path: "/actividades/b", day: "viernes 13", time: "7:00 p. m.", place: "Centro", price: "$25.000" },
    { title: "C", when: "sábado 14 · 6:00 a. m.", path: "/eventos/c", day: "sábado 14", time: "6:00 a. m.", place: "Plaza", price: "Evento" },
  ]
  const w = valueEmail("weekly", items, ctx).model.weekly!
  assert.equal(w.featured!.title, "A"); assert.match(w.featured!.imageUrl!, /\/_next\/image\?url=https%3A%2F%2Fs\.co%2Fa\.jpg&w=640/)
  assert.deepEqual(w.days.map((d) => [d.label, d.count]), [["Viernes 13", 2], ["Sábado 14", 1]])
  assert.deepEqual(w.groups.map((g) => [g.title, g.items.map((i) => i.title)]), [["Viernes 13", ["B"]], ["Sábado 14", ["C"]]]) // el destacado no se repite
  assert.equal(w.range, "viernes 13 al sábado 14"); assert.equal(w.total, 3)
  assert.ok(valueEmail("weekly", [{ title: "X", when: "hoy", path: "/x" }], ctx).model.weekly === undefined) // sin día: queda el formato simple
})

test("inscripción a un evento: correo para quien organiza y confirmación para quien se inscribió, con botón «Ver el evento»", () => {
  for (const [t, reason] of [["event_registration", /organizas este evento/i], ["event_registration_confirmed", /te inscribiste/i]] as const) {
    const e = transactionalEmailFor(n(t, { href: "/eventos/feria" }), ctx)!
    assert.ok(e, t)
    assert.match(e.text, reason)
    assert.equal(e.model.cta!.label, "Ver el evento")
    assert.match(e.model.cta!.href, /\/eventos\/feria\?ch=em/)
  }
  assert.equal(transactionalEmailFor(n("activity_join"), ctx)!.model.cta!.label, "Ver la actividad")
})
