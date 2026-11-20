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

test("«Para ti» tiene portada, plan destacado con foto grande, filas, sitios y botón «Ver más planes»", async () => {
  const e = valueEmail("forYou", [
    { title: "Trote en el parque", when: "Hoy · 5:30 p. m.", path: "/actividades/trote", place: "Parque Centenario", price: "Desde $20.000", imageUrl: "https://img.test/a.jpg" },
    { title: "Clase de salsa", when: "Hoy · 8:00 p. m.", path: "/actividades/salsa", place: "Calle 10", price: "Gratis" },
  ], ctx, { sites: [{ title: "Cascada La Plata", path: "/donde-ir/cascada", place: "Vía al Cañón", imageUrl: "https://img.test/s.jpg" }] })
  const html = await renderEmailHtml(e.model)
  assert.ok(html.includes("Lo primero que te recomendamos"))
  assert.ok(html.includes("_next/image?url=https%3A%2F%2Fimg.test%2Fa.jpg"))
  assert.ok(html.includes("Más para ti") && html.includes("Clase de salsa"))
  assert.ok(html.includes("Lugares para ir cuando quieras") && html.includes("Cascada La Plata"))
  assert.ok(html.includes("Ver más planes"))
  assert.ok(html.includes("https://x.co/avisos"))
})

test("bienvenida: solo del servicio, explica los avisos opcionales y deja elegir; sin planes ni ofertas", async () => {
  const e = transactionalEmailFor({ type: "welcome", title: "Te damos la bienvenida a Qué Hay Pa Hacer", href: "/" }, ctx)!
  const html = await renderEmailHtml(e.model)
  assert.ok(html.includes("Ver qué hay hoy") && html.includes("Elegir mis avisos"))
  assert.ok(html.includes("https://x.co/avisos"))
  assert.ok(html.includes("Solo se activan si tú los eliges"))
  assert.ok(html.includes("no te hemos apuntado a ningún aviso"))
  assert.ok(html.includes("Dejar de recibir correos"))
  assert.ok(e.text.includes("Elegir mis avisos: https://x.co/avisos"))
})
