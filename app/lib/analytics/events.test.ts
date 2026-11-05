import { test } from "node:test"
import assert from "node:assert/strict"
import { cleanLocation, isTrackablePath, sanitizeParams } from "./events"

test("mide páginas públicas", () => {
  for (const path of [
    "/", "/eventos", "/eventos/abc", "/eventos/abc/sessions/s1", "/donde-ir/x", "/eventos-musica-ibague",
    "/explorar", "/privacidad", "/profile/handle", "/login", "/register",
  ]) {
    assert.equal(isTrackablePath(path), true, path)
  }
})

test("no mide rutas privadas ni internas", () => {
  for (const path of [
    "/studio", "/studio/events/1", "/mis-eventos", "/mis-inscripciones", "/mis-invitaciones/3",
    "/profile", "/sites", "/sites/1/edit", "/eventos/create", "/eventos/abc/edit", "/eventos/abc/edit/media",
    "/eventos/abc/sessions", "/eventos/abc/sessions/", "/api/auth/me", "/dev", "/reset-password",
  ]) {
    assert.equal(isTrackablePath(path), false, path)
  }
})

test("sanitizeParams deja pasar solo parámetros permitidos", () => {
  assert.deepEqual(
    sanitizeParams({ item_type: "event", item_id: "abc123", item_category: "musica", method: "whatsapp" }),
    { item_type: "event", item_id: "abc123", item_category: "musica", method: "whatsapp" },
  )
})

test("sanitizeParams elimina datos personales y claves desconocidas", () => {
  const out = sanitizeParams({ item_id: "abc", uid: "u1", email: "a@b.co", displayName: "Ana", query: "texto libre" })
  assert.deepEqual(out, { item_id: "abc" })
})

test("sanitizeParams descarta valores largos u objetos", () => {
  const out = sanitizeParams({ item_id: "x".repeat(101), item_category: { a: 1 }, method: "ok" } as never)
  assert.deepEqual(out, { method: "ok" })
})

test("cleanLocation conserva solo UTM y click ids, sin hash", () => {
  const href =
    "https://qhpa.test/eventos/abc?utm_source=facebook&utm_medium=cpc&utm_campaign=prueba&fbclid=IwAR1&redirect_to=%2Fstudio&token=secreto#seccion"
  assert.equal(
    cleanLocation(href),
    "https://qhpa.test/eventos/abc?utm_source=facebook&utm_medium=cpc&utm_campaign=prueba&fbclid=IwAR1",
  )
})

test("cleanLocation sin query útil devuelve solo la ruta", () => {
  assert.equal(cleanLocation("https://qhpa.test/login?redirect_to=%2Fstudio"), "https://qhpa.test/login")
})
