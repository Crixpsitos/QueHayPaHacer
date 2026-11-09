import test from "node:test";
import assert from "node:assert/strict";
import { generateLinkCode, isLinkCode, landingPath, LINK_TARGET_TYPES, isLinkTargetType } from "./link";

test("generateLinkCode: 7 caracteres base62", () => {
  for (let i = 0; i < 200; i++) assert.match(generateLinkCode(), /^[A-Za-z0-9]{7}$/);
});

test("generateLinkCode: sin sesgo de módulo (bytes ≥ 248 se descartan) y usa todo el alfabeto", () => {
  // 248 = 62 * 4: con bytes 0..247 cada letra sale con igual probabilidad. Aquí: primero bytes altos (se descartan), luego 0..6.
  const bytes = [255, 250, 248, 0, 1, 2, 3, 4, 5, 6];
  const code = generateLinkCode(() => Uint8Array.from(bytes));
  assert.equal(code, "ABCDEFG");
});

test("generateLinkCode: no se repite en 5000 códigos (probabilidad de choque despreciable)", () => {
  assert.equal(new Set(Array.from({ length: 5000 }, () => generateLinkCode())).size, 5000);
});

test("isLinkCode acepta solo 7 alfanuméricos", () => {
  assert.equal(isLinkCode("aB3xY9Z"), true);
  for (const c of ["", "abc", "aB3xY9ZZ", "aB3-Y9Z", "../etc/", "aB3 Y9Z", 7 as unknown as string]) assert.equal(isLinkCode(c), false, String(c));
});

test("landingPath: ficha del evento o del sitio con utm y qr; el id va codificado", () => {
  assert.equal(
    landingPath({ type: "event", id: "ev1" }, "aB3xY9Z"),
    "/eventos/ev1?utm_source=qhpa_link&utm_medium=short_link&utm_campaign=aB3xY9Z&qr=aB3xY9Z",
  );
  assert.equal(landingPath({ type: "site", id: "s 1/x" }, "aB3xY9Z")?.startsWith("/donde-ir/s%201%2Fx?"), true);
});

test("landingPath: tipo desconocido o código inválido → null", () => {
  assert.equal(landingPath({ type: "other" as never, id: "x" }, "aB3xY9Z"), null);
  assert.equal(landingPath({ type: "event", id: "x" }, "bad"), null);
  assert.equal(landingPath({ type: "event", id: "" }, "aB3xY9Z"), null);
});

test("tipos de destino", () => {
  assert.deepEqual([...LINK_TARGET_TYPES], ["event", "site"]);
  assert.equal(isLinkTargetType("event"), true);
  assert.equal(isLinkTargetType("url"), false);
});
