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
