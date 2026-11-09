import test from "node:test";
import assert from "node:assert/strict";
import { shareUrl } from "./shareUrl";
import { trafficSource } from "./trafficSource";

test("shareUrl marca el canal con utm_source y utm_medium=share", () => {
  assert.equal(shareUrl("https://yquehaypahacer.com/eventos/ev1", "whatsapp"), "https://yquehaypahacer.com/eventos/ev1?utm_source=whatsapp&utm_medium=share");
  assert.equal(shareUrl("https://yquehaypahacer.com/eventos/ev1", "facebook"), "https://yquehaypahacer.com/eventos/ev1?utm_source=facebook&utm_medium=share");
  assert.equal(shareUrl("https://yquehaypahacer.com/eventos/ev1", "x"), "https://yquehaypahacer.com/eventos/ev1?utm_source=x&utm_medium=share");
});

test("shareUrl conserva otros parámetros y reemplaza una marca previa (no la duplica)", () => {
  assert.equal(shareUrl("https://a.co/p?s=2&utm_source=instagram", "whatsapp"), "https://a.co/p?s=2&utm_source=whatsapp&utm_medium=share");
});

test("shareUrl no toca copiar enlace, canales desconocidos ni URLs inválidas", () => {
  assert.equal(shareUrl("https://a.co/p", "copy"), "https://a.co/p");
  assert.equal(shareUrl("https://a.co/p", "evil&x=1"), "https://a.co/p");
  assert.equal(shareUrl("no es url", "whatsapp"), "no es url");
});

test("trafficSource: el origen marcado por shareUrl se clasifica (incluida X)", () => {
  assert.equal(trafficSource({ utm_source: "whatsapp" }), "whatsapp");
  assert.equal(trafficSource({ utm_source: "facebook" }), "facebook");
  assert.equal(trafficSource({ utm_source: "x" }), "x");
  assert.equal(trafficSource({ utm_source: "twitter" }), "x");
});
