import test from "node:test";
import assert from "node:assert/strict";
import { eventOutHref, siteOutHref } from "./outHref";

test("eventOutHref y siteOutHref arman rutas relativas /r/…", () => {
  assert.equal(eventOutHref("ev1", "register"), "/r/e/ev1?to=register");
  assert.equal(siteOutHref("s1", "booking"), "/r/s/s1?to=booking");
  assert.equal(siteOutHref("s1", "social", "instagram"), "/r/s/s1?to=social&n=instagram");
});

test("el id va codificado: no puede colar otro parámetro ni salirse de la ruta", () => {
  assert.equal(siteOutHref("a/b?x=1", "website"), "/r/s/a%2Fb%3Fx%3D1?to=website");
});
