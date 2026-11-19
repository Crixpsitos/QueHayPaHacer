import { test } from "node:test"
import assert from "node:assert/strict"
import { renderEmailHtml } from "./renderEmail"
import { transactionalEmailFor, valueEmail } from "@/domain/entities/email/templates"

const ctx = { siteUrl: "https://x.co", unsubscribeUrl: "https://x.co/baja?u=u1&t=abc" }

test("React escapa lo que viene de personas (sin inyección) y conserva la marca, el botón y la baja", async () => {
  const e = transactionalEmailFor({ type: "activity_join_confirmed", title: '<img src=x onerror=alert(1)> "hola"', body: "Salida: <b>domingo</b>", href: "/actividades/a" }, ctx)!
  const html = await renderEmailHtml(e.model)
  assert.ok(!html.includes("<img src=x"))
  assert.ok(!html.includes("<b>domingo</b>"))
  assert.ok(html.includes("&lt;img"))
  assert.ok(html.includes("#9B0A26"))
  assert.ok(html.includes("Ver la actividad"))
  assert.ok(html.includes("Dejar de recibir correos"))
  assert.ok(html.includes('lang="es-CO"'))
})
test("el correo de valor lista los planes con sus enlaces", async () => {
  const e = valueEmail("weekly", [{ title: "Mercado campesino", when: "sábado 14 · 7:00 a. m.", path: "/actividades/mercado" }], ctx)
  const html = await renderEmailHtml(e.model)
  assert.ok(html.includes("Mercado campesino"))
  assert.ok(html.includes("https://x.co/actividades/mercado?ch=em"))
})

test("«Para ti» muestra foto, lugar y precio, el botón «Ver más planes» y «Cambiar mis avisos»", async () => {
  const e = valueEmail("forYou", [{ title: "Trote en el parque", when: "Hoy · 5:30 p. m.", path: "/actividades/trote", place: "Parque Centenario", price: "Desde $20.000", imageUrl: "https://img.test/a.jpg" }], ctx)
  const html = await renderEmailHtml(e.model)
  assert.ok(html.includes("Parque Centenario"))
  assert.ok(html.includes("$20.000"))
  assert.ok(html.includes("_next/image?url=https%3A%2F%2Fimg.test%2Fa.jpg"))
  assert.ok(html.includes("Ver más planes"))
  assert.ok(html.includes("https://x.co/avisos"))
})

test("correo de bienvenida: botón «Ver qué hay hoy», «Cambiar mis avisos» y baja", async () => {
  const e = transactionalEmailFor({ type: "welcome", title: "Te damos la bienvenida", body: "Hola", href: "/" }, ctx)!
  const html = await renderEmailHtml(e.model)
  assert.ok(html.includes("Ver qué hay hoy"))
  assert.ok(html.includes("https://x.co/avisos"))
  assert.ok(html.includes("Dejar de recibir correos"))
})
