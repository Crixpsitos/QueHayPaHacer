import test from "node:test";
import assert from "node:assert/strict";
import { createDailyDedupe } from "./dailyDedupe";

test("la misma persona+recurso se acepta una vez; otra persona o recurso, otra vez", () => {
  const d = createDailyDedupe(() => 0);
  assert.equal(d.isRepeat("1.1.1.1", "ua", "ev1:view"), false);
  assert.equal(d.isRepeat("1.1.1.1", "ua", "ev1:view"), true);
  assert.equal(d.isRepeat("1.1.1.1", "ua", "ev1:whatsapp"), false);
  assert.equal(d.isRepeat("2.2.2.2", "ua", "ev1:view"), false);
});

test("vence a las 24 h", () => {
  let t = 0;
  const d = createDailyDedupe(() => t);
  d.isRepeat("ip", "ua", "k");
  t = 24 * 3600_000 - 1;
  assert.equal(d.isRepeat("ip", "ua", "k"), true);
  t = 24 * 3600_000 + 1;
  assert.equal(d.isRepeat("ip", "ua", "k"), false);
});

test("memoria acotada: al pasar el tope se vacía en vez de crecer", () => {
  const d = createDailyDedupe(() => 0, 3);
  for (let i = 0; i < 10; i++) d.isRepeat(`ip${i}`, "ua", "k");
  assert.ok(d.size() <= 3);
});

test("no guarda la IP ni el UA en claro", () => {
  const d = createDailyDedupe(() => 0);
  d.isRepeat("203.0.113.9", "Mozilla", "k");
  assert.ok(!d.keys().some((k) => k.includes("203.0.113.9") || k.includes("Mozilla")));
});
