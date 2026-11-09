import test from "node:test";
import assert from "node:assert/strict";
import { summarizeBaseline } from "./baseline";

test("suma, promedia y cuenta documentos con views == 0", () => {
  const s = summarizeBaseline(
    [
      { id: "a", analytics: { views: 10, likes: 2, shares: 1, registrations: 0, clicks: 4 } },
      { id: "b", analytics: { views: 0, likes: 1 } },
      { id: "c" }, // sin analytics: cuenta como 0 en todo
    ],
    new Set(["a"]),
  );
  assert.equal(s.total, 3);
  assert.equal(s.metrics.views.sum, 10);
  assert.equal(s.metrics.views.avg, 10 / 3);
  assert.equal(s.metrics.likes.sum, 3);
  assert.equal(s.metrics.clicks.sum, 4);
  assert.equal(s.viewsZero, 2);
  assert.equal(s.withStats, 1);
});

test("colección vacía no divide por cero", () => {
  const s = summarizeBaseline([], new Set());
  assert.equal(s.total, 0);
  assert.equal(s.metrics.views.avg, 0);
});

test("ignora valores no numéricos", () => {
  const s = summarizeBaseline([{ id: "x", analytics: { views: "7" as unknown as number } }], new Set());
  assert.equal(s.metrics.views.sum, 0);
});
