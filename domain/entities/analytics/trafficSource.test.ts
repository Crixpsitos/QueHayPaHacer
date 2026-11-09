import test from "node:test";
import assert from "node:assert/strict";
import { trafficSource } from "./trafficSource";
import { EVENT_TRACK_TYPES, isEventTrackType } from "./trackTypes";

test("sin pistas = direct", () => {
  assert.equal(trafficSource({}), "direct");
  assert.equal(trafficSource({ ref: "" }), "direct");
});

test("utm_source reconocido, con alias", () => {
  assert.equal(trafficSource({ utm_source: "instagram" }), "instagram");
  assert.equal(trafficSource({ utm_source: "IG" }), "instagram");
  assert.equal(trafficSource({ utm_source: "fb" }), "facebook");
  assert.equal(trafficSource({ utm_source: "tiktok" }), "tiktok");
  assert.equal(trafficSource({ utm_source: "whatsapp" }), "whatsapp");
});

test("referrer por host (incluye subdominios y l.facebook.com)", () => {
  assert.equal(trafficSource({ ref: "https://l.instagram.com/?u=x" }), "instagram");
  assert.equal(trafficSource({ ref: "https://l.facebook.com/l.php" }), "facebook");
  assert.equal(trafficSource({ ref: "https://www.google.com/" }), "google");
  assert.equal(trafficSource({ ref: "https://www.tiktok.com/" }), "tiktok");
  assert.equal(trafficSource({ ref: "https://api.whatsapp.com/" }), "whatsapp");
});

test("host parecido NO cuenta (evilinstagram.com, instagram.com.evil.io)", () => {
  assert.equal(trafficSource({ ref: "https://evilinstagram.com/" }), "other");
  assert.equal(trafficSource({ ref: "https://instagram.com.evil.io/" }), "other");
});

test("referrer propio o inválido = direct u other", () => {
  assert.equal(trafficSource({ ref: "https://yquehaypahacer.com/eventos" }), "direct");
  assert.equal(trafficSource({ ref: "no es una url" }), "direct");
  assert.equal(trafficSource({ ref: "https://blog.example.org/" }), "other");
});

test("utm gana al referrer; qr gana a todo", () => {
  assert.equal(trafficSource({ utm_source: "instagram", ref: "https://www.google.com/" }), "instagram");
  assert.equal(trafficSource({ utm_source: "instagram", qr: "aB3dE5g" }), "link:aB3dE5g");
});

test("utm_source desconocido = other; qr inválido se ignora", () => {
  assert.equal(trafficSource({ utm_source: "newsletter" }), "other");
  assert.equal(trafficSource({ qr: "../../x" }), "direct");
});

test("tipos de track", () => {
  assert.ok(isEventTrackType("view"));
  assert.ok(isEventTrackType("whatsapp"));
  assert.ok(!isEventTrackType("like"));
  assert.ok(EVENT_TRACK_TYPES.includes("register_external"));
});
