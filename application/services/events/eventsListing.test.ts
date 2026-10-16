import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeScoreCursor,
  encodeScoreCursor,
  isPromotionActive,
  mergeFeaturedIds,
} from "./eventsListing";

test("mergeFeaturedIds: promovidos primero, sin duplicados, tope 10", () => {
  assert.deepEqual(mergeFeaturedIds(["p1", "p2"], ["a", "p1", "b"]), ["p1", "p2", "a", "b"]);
  const top = Array.from({ length: 20 }, (_, i) => `t${i}`);
  assert.equal(mergeFeaturedIds(["p"], top).length, 10);
  assert.equal(mergeFeaturedIds(["p"], top)[0], "p");
  assert.deepEqual(mergeFeaturedIds([], ["a"]), ["a"]);
});

test("isPromotionActive: vigente solo si isPromoted y promotedUntil >= ahora", () => {
  const now = new Date("2026-01-10");
  const ts = (d: string) => ({ toDate: () => new Date(d) });
  assert.equal(isPromotionActive({ isPromoted: true, promotedUntil: ts("2026-01-11") }, now), true);
  assert.equal(isPromotionActive({ isPromoted: true, promotedUntil: ts("2026-01-09") }, now), false);
  assert.equal(isPromotionActive({ isPromoted: false, promotedUntil: new Date("2026-02-01") }, now), false);
  assert.equal(isPromotionActive(undefined, now), false);
});

test("cursor: ida y vuelta, ids con '|' y entradas inválidas", () => {
  assert.deepEqual(decodeScoreCursor(encodeScoreCursor(12.5, "abc")), { score: 12.5, id: "abc" });
  assert.deepEqual(decodeScoreCursor(encodeScoreCursor(-3, "a|b")), { score: -3, id: "a|b" });
  assert.equal(decodeScoreCursor(null), null);
  assert.equal(decodeScoreCursor("12"), null);
  assert.equal(decodeScoreCursor("x|id"), null);
});
