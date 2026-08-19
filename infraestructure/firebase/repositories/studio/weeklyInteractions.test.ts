import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWeeklyInteractions } from "./weeklyInteractions";

// windowStartSeconds = 0 → weekStart determinista desde epoch (1970-01-01).
test("buildWeeklyInteractions: pivota por tipo, densifica huecos e ignora tipos desconocidos", () => {
  const rows = [
    { week: 0, type: "click", total: 5 },
    { week: 0, type: "like", total: 2 },
    { week: 0, type: "otro", total: 99 }, // desconocido → ignorado
    { week: 2, type: "share", total: 3 },
    { week: 2, type: "click", total: 1 },
  ];

  const out = buildWeeklyInteractions(rows, 0, 4);

  assert.equal(out.length, 4);
  assert.deepEqual(out[0], { weekStart: "1970-01-01", clicks: 5, likes: 2, shares: 0 });
  assert.deepEqual(out[1], { weekStart: "1970-01-08", clicks: 0, likes: 0, shares: 0 }); // hueco
  assert.deepEqual(out[2], { weekStart: "1970-01-15", clicks: 1, likes: 0, shares: 3 });
  assert.deepEqual(out[3], { weekStart: "1970-01-22", clicks: 0, likes: 0, shares: 0 });
});

test("buildWeeklyInteractions: sin filas → todo en cero", () => {
  const out = buildWeeklyInteractions([], 0, 3);
  assert.equal(out.length, 3);
  assert.ok(out.every((p) => p.clicks === 0 && p.likes === 0 && p.shares === 0));
});
