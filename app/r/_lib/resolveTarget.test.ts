import test from "node:test";
import assert from "node:assert/strict";
import { resolveEventTarget, resolveSiteTarget, safeHttpUrl } from "./resolveTarget";

test("safeHttpUrl acepta http(s) público", () => {
  assert.equal(safeHttpUrl("https://example.com/a?b=1"), "https://example.com/a?b=1");
  assert.equal(safeHttpUrl("http://example.com"), "http://example.com/");
});

test("safeHttpUrl rechaza esquemas peligrosos y hosts locales/privados", () => {
  for (const u of ["javascript:alert(1)", "data:text/html,x", "ftp://example.com", "//evil.com", "/relativo", "", undefined,
    "http://localhost/x", "http://127.0.0.1", "http://10.0.0.5", "http://192.168.1.1", "http://172.16.0.1", "http://169.254.169.254/latest",
    "http://[::1]/", "http://foo.local", "https://user:pw@example.com"]) {
    assert.equal(safeHttpUrl(u as string | undefined), null, String(u));
  }
});

test("evento: register usa externalUrl del documento", () => {
  assert.equal(resolveEventTarget("register", { externalUrl: "https://tickets.example.com/e1" }), "https://tickets.example.com/e1");
});

test("evento: sin destino guardado o 'to' desconocido → null", () => {
  assert.equal(resolveEventTarget("register", {}), null);
  assert.equal(resolveEventTarget("register", { externalUrl: "javascript:x" }), null);
  assert.equal(resolveEventTarget("evil", { externalUrl: "https://a.com" }), null);
  assert.equal(resolveEventTarget(null, { externalUrl: "https://a.com" }), null);
});

test("sitio: website, booking y social con red de lista cerrada", () => {
  const doc = { bookingUrl: "https://wa.me/57300", socialMedia: { website: "https://nebraska.co", instagram: "https://instagram.com/n", extra: "https://x.com" } };
  assert.equal(resolveSiteTarget("website", null, doc), "https://nebraska.co/");
  assert.equal(resolveSiteTarget("booking", null, doc), "https://wa.me/57300");
  assert.equal(resolveSiteTarget("social", "instagram", doc), "https://instagram.com/n");
});

test("sitio: red fuera de la lista, red faltante o destino inválido → null", () => {
  const doc = { bookingUrl: "javascript:x", socialMedia: { instagram: "https://instagram.com/n", extra: "https://x.com" } };
  assert.equal(resolveSiteTarget("social", "extra", doc), null);
  assert.equal(resolveSiteTarget("social", null, doc), null);
  assert.equal(resolveSiteTarget("social", "facebook", doc), null);
  assert.equal(resolveSiteTarget("booking", null, doc), null);
  assert.equal(resolveSiteTarget("call", null, doc), null);
});
