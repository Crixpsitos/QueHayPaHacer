import test from "node:test";
import assert from "node:assert/strict";
import { createDailyDedupe } from "./dailyDedupe";

test("la misma persona+recurso se acepta una vez; otra persona o recurso, otra vez", () => {
  const d = createDailyDedupe(() => 0);
  assert.equal(d.isRepeat("1.1.1.1", "ua", "ev1:view"), false);
  d.mark("1.1.1.1", "ua", "ev1:view");
  assert.equal(d.isRepeat("1.1.1.1", "ua", "ev1:view"), true);
  assert.equal(d.isRepeat("1.1.1.1", "ua", "ev1:whatsapp"), false);
  assert.equal(d.isRepeat("2.2.2.2", "ua", "ev1:view"), false);
});

test("isRepeat NO marca: si la escritura no ocurre, la persona puede reintentar", () => {
  const d = createDailyDedupe(() => 0);
  assert.equal(d.isRepeat("ip", "ua", "k"), false);
  assert.equal(d.isRepeat("ip", "ua", "k"), false);
});

test("vence a las 24 h", () => {
  let t = 0;
  const d = createDailyDedupe(() => t);
  d.mark("ip", "ua", "k");
  t = 24 * 3600_000 - 1;
  assert.equal(d.isRepeat("ip", "ua", "k"), true);
  t = 24 * 3600_000 + 1;
  assert.equal(d.isRepeat("ip", "ua", "k"), false);
});

test("memoria acotada: al pasar el tope se expulsa lo más viejo, no todo", () => {
  const d = createDailyDedupe(() => 0, 3);
  for (let i = 0; i < 10; i++) d.mark(`ip${i}`, "ua", "k");
  assert.equal(d.size(), 3);
  assert.equal(d.isRepeat("ip9", "ua", "k"), true, "lo más reciente se conserva");
  assert.equal(d.isRepeat("ip0", "ua", "k"), false, "lo más viejo se expulsó");
});

test("no guarda la IP ni el UA en claro", () => {
  const d = createDailyDedupe(() => 0);
  d.mark("203.0.113.9", "Mozilla", "k");
  assert.ok(!d.keys().some((k) => k.includes("203.0.113.9") || k.includes("Mozilla")));
});
