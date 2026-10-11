import { test } from "node:test";
import assert from "node:assert/strict";
import { dateParts, formatPrice, formatPriceSummary, formatTimeRange, sameDay } from "./format";

test("fechas en hora de Colombia, no del servidor", () => {
  // 00:30 UTC del 11 = 19:30 del 10 en Bogotá
  const start = "2026-10-11T00:30:00Z";
  assert.equal(dateParts(start).day, "10");
  assert.equal(formatTimeRange(start, "2026-10-11T04:00:00Z"), "19:30 – 23:00");
  // Cruza la medianoche pero dura menos de 24 h: solo horas.
  assert.equal(formatTimeRange(start, "2026-10-11T07:00:00Z"), "19:30 – 02:00");
  assert.equal(sameDay(start, "2026-10-10T15:00:00Z"), true);
});

test("precios", () => {
  assert.equal(formatPrice({ isFree: true, amount: 0, currency: "COP" }), "Gratis");
  assert.match(formatPrice({ isFree: false, amount: 25000, currency: "COP" }), /25\.000/);
  assert.match(
    formatPriceSummary([
      { isFree: false, amount: 30000 },
      { isFree: false, amount: 15000 },
    ]),
    /^Desde .*15\.000$/,
  );
  assert.equal(formatPriceSummary([{ isFree: true, amount: 0 }]), "Gratis");
});
