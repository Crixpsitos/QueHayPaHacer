import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import vm from "node:vm"

// Carga public/sw.js en un contexto falso y prueba qué navegaciones se cachean.
const ORIGIN = "https://qhpa.test"
const context = vm.createContext({
  self: { location: { href: `${ORIGIN}/sw.js?v=abc`, origin: ORIGIN }, addEventListener() {} },
  URL,
  URLSearchParams,
})
vm.runInContext(readFileSync("public/sw.js", "utf8"), context)
const key = (path: string) => context.pageCacheKey(new URL(path, ORIGIN)) as string | null

test("cachea páginas públicas (y normaliza ?source=pwa)", () => {
  for (const path of ["/", "/eventos", "/eventos/abc", "/eventos/abc/sessions/s1", "/donde-ir/x", "/profile/handle", "/privacidad"]) {
    assert.equal(key(path), ORIGIN + path, path)
  }
  assert.equal(key("/?source=pwa"), `${ORIGIN}/`)
})

test("nunca cachea rutas privadas, auth ni con query", () => {
  for (const path of [
    "/api/auth/me", "/studio", "/studio/events/1", "/profile", "/mis-eventos", "/mis-inscripciones", "/mis-invitaciones", "/sites", "/sites/1/edit",
    "/eventos/create", "/eventos/abc/edit", "/eventos/abc/edit/x", "/eventos/abc/sessions", "/eventos/abc/sessions/",
    "/login", "/register", "/reset-password", "/eventos?categoria=musica", "/?source=other", "/?source=pwa&x=1",
  ]) {
    assert.equal(key(path), null, path)
  }
})

test("versión de caché tomada de ?v=", () => {
  assert.equal(vm.runInContext("STATIC_CACHE", context), "qhpa-static-abc")
})
