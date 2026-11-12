import { test } from "node:test"
import assert from "node:assert/strict"
import { normalizeCta } from "./Cta"

const ok = (kind: string, value: string, label?: string) => {
  const r = normalizeCta({ kind, value, label })
  assert.equal(r.ok, true, JSON.stringify(r))
  return (r as { ok: true; cta: { kind: string; value: string; label?: string } }).cta
}
const err = (kind: unknown, value: unknown) => {
  const r = normalizeCta({ kind, value })
  assert.equal(r.ok, false, `debía rechazar ${String(value)}`)
  return (r as { ok: false; error: string }).error
}

test("WhatsApp colombiano se normaliza a wa.me/57…", () => {
  assert.equal(ok("whatsapp", "300 123 4567").value, "https://wa.me/573001234567")
  assert.equal(ok("whatsapp", "+57 300-123-4567").value, "https://wa.me/573001234567")
  assert.equal(ok("whatsapp", "573001234567").value, "https://wa.me/573001234567")
})

test("WhatsApp rechaza números que no son celular colombiano", () => {
  err("whatsapp", "123")
  err("whatsapp", "6081234567")
  err("whatsapp", "abc")
})

test("teléfono acepta celular o fijo de 10 dígitos y guarda +57", () => {
  assert.equal(ok("phone", "300 123 4567").value, "+573001234567")
  assert.equal(ok("phone", "608 123 4567").value, "+576081234567")
  err("phone", "12345")
})

test("grupo de WhatsApp: solo chat.whatsapp.com con código", () => {
  assert.equal(ok("whatsappGroup", "https://chat.whatsapp.com/AbC123xyz").value, "https://chat.whatsapp.com/AbC123xyz")
  err("whatsappGroup", "https://evil.com/AbC123")
  err("whatsappGroup", "https://chat.whatsapp.com/")
})

test("enlaces web: solo https, sin credenciales ni IP ni localhost", () => {
  assert.equal(ok("website", "https://ejemplo.com/reserva?x=1").value, "https://ejemplo.com/reserva?x=1")
  assert.equal(ok("reserveLink", "https://wa.me/573001234567").kind, "reserveLink")
  assert.equal(ok("buyLink", "https://tienda.co").kind, "buyLink")
  for (const bad of ["http://ejemplo.com", "javascript:alert(1)", "data:text/html,hola", "//evil.com", "https://user:pass@evil.com", "https://127.0.0.1/x", "https://localhost/x", "https://intranet/x", "ftp://x.com", "ejemplo.com"]) err("website", bad)
})

test("instagram solo del dominio instagram.com", () => {
  assert.equal(ok("instagram", "https://www.instagram.com/quehaypahacer").value, "https://www.instagram.com/quehaypahacer")
  err("instagram", "https://otro.com/x")
})

test("checkout y tipos desconocidos se rechazan", () => {
  assert.match(err("checkout", "https://x.com"), /disponible/i)
  err("nada", "https://x.com")
  err(undefined, undefined)
})

test("etiqueta opcional máx. 30 y valor máx. 300", () => {
  assert.equal(ok("website", "https://x.com", "  Reservar  ").label, "Reservar")
  const r = normalizeCta({ kind: "website", value: "https://x.com", label: "x".repeat(31) })
  assert.equal(r.ok, false)
  err("website", "https://x.com/" + "a".repeat(300))
})

import { ctaButtonLabel, ctaHref } from "./Cta"
test("texto y enlace del botón: etiqueta propia o la de su tipo; teléfono como tel:", () => {
  assert.equal(ctaButtonLabel({ kind: "whatsappGroup", value: "https://chat.whatsapp.com/x" }), "Unirme al grupo")
  assert.equal(ctaButtonLabel({ kind: "whatsapp", value: "https://wa.me/573001234567", label: "Escríbeme" }), "Escríbeme")
  assert.equal(ctaButtonLabel({ kind: "buyLink", value: "https://x.com" }), "Comprar")
  assert.equal(ctaHref({ kind: "phone", value: "+573001234567" }), "tel:+573001234567")
  assert.equal(ctaHref({ kind: "website", value: "https://x.com/a" }), "https://x.com/a")
})
