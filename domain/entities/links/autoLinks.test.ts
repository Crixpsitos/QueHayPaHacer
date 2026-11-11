import test from "node:test";
import assert from "node:assert/strict";
import { AUTO_CHANNELS, autoLinkHref, autoLandingPath } from "./autoLinks";

test("canales visibles al dueño, en el orden en que se muestran", () => {
  assert.deepEqual(AUTO_CHANNELS.map((c) => [c.id, c.label]), [
    ["ig", "Instagram (bio)"], ["ig_h", "Instagram (historias)"], ["wa", "WhatsApp"], ["fb", "Facebook"], ["qr", "Afiche con QR"],
  ]);
});

test("autoLinkHref arma la ruta corta con el id codificado", () => {
  assert.equal(autoLinkHref("event", "ev1", "ig"), "/r/e/ev1/ig");
  assert.equal(autoLinkHref("site", "s 1", "ig_h"), "/r/s/s%201/ig_h");
});

test("autoLandingPath: ficha + ch + utm del canal", () => {
  assert.equal(autoLandingPath("event", "ev1", "ig"), "/eventos/ev1?ch=ig&utm_source=instagram&utm_medium=bio&utm_campaign=auto");
  assert.equal(autoLandingPath("site", "s1", "ig_h"), "/donde-ir/s1?ch=ig_h&utm_source=instagram&utm_medium=stories&utm_campaign=auto");
  assert.equal(autoLandingPath("event", "ev1", "qr"), "/eventos/ev1?ch=qr&utm_source=qr&utm_medium=print&utm_campaign=auto");
});

test("canal desconocido, tipo desconocido o id vacío → null (nada del request llega al destino)", () => {
  assert.equal(autoLandingPath("event", "ev1", "evil"), null);
  assert.equal(autoLandingPath("other" as never, "ev1", "ig"), null);
  assert.equal(autoLandingPath("event", "", "ig"), null);
  assert.equal(autoLandingPath("event", "ev1", "__proto__"), null);
});

test("actividades: ruta corta por id y aterrizaje en la ficha por slug", () => {
  assert.equal(autoLinkHref("activity", "a1", "wa"), "/r/a/a1/wa");
  assert.equal(autoLandingPath("activity", "senderismo-los-domingos", "wa"), "/actividades/senderismo-los-domingos?ch=wa&utm_source=whatsapp&utm_medium=share&utm_campaign=auto");
  assert.equal(autoLandingPath("activity", "", "wa"), null);
});
