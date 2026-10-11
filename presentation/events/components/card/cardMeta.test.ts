import assert from "node:assert/strict";
import test from "node:test";

import { compactCount, plainText, registrationLabel, spotsInfo, timingBadge } from "./cardMeta";

// 2026-10-11 12:00 en Bogotá
const now = new Date("2026-10-11T17:00:00Z");

test("timingBadge: hoy, mañana, en N días, en curso y fuera de rango", () => {
  assert.deepEqual(timingBadge("2026-10-12T01:00:00Z", "2026-10-12T04:00:00Z", now), { label: "Hoy", tone: "soon" }); // 11 oct 20:00 Bogotá
  assert.deepEqual(timingBadge("2026-10-12T20:00:00Z", "2026-10-13T01:00:00Z", now), { label: "Mañana", tone: "soon" });
  assert.deepEqual(timingBadge("2026-10-15T20:00:00Z", "2026-10-16T01:00:00Z", now), { label: "En 4 días", tone: "upcoming" });
  assert.equal(timingBadge("2026-10-25T20:00:00Z", "2026-10-26T01:00:00Z", now), null);
  assert.deepEqual(timingBadge("2026-10-11T15:00:00Z", "2026-10-11T20:00:00Z", now), { label: "En curso", tone: "live" });
  assert.equal(timingBadge("2026-10-10T15:00:00Z", "2026-10-10T20:00:00Z", now), null);
  assert.equal(timingBadge(undefined, undefined, now), null);
});

test("timingBadge: la medianoche de Bogotá separa el día (no UTC)", () => {
  // 11 oct 23:30 Bogotá = 12 oct 04:30 UTC → sigue siendo "Hoy"
  assert.equal(timingBadge("2026-10-12T04:30:00Z", "2026-10-12T06:00:00Z", now)?.label, "Hoy");
});

test("timingBadge: varias fechas no marca 'En curso'", () => {
  assert.equal(timingBadge("2026-10-10T15:00:00Z", "2026-10-20T20:00:00Z", now, true), null);
});

test("spotsInfo", () => {
  assert.equal(spotsInfo(undefined, 3), null);
  assert.deepEqual(spotsInfo(100, 100), { label: "Agotado", tone: "full" });
  assert.deepEqual(spotsInfo(100, 99), { label: "Queda 1 cupo", tone: "low" });
  assert.deepEqual(spotsInfo(100, 88), { label: "Quedan 12 cupos", tone: "low" });
  assert.deepEqual(spotsInfo(100, 20), { label: "80 cupos", tone: "ok" });
  assert.equal(spotsInfo(10, 12)?.tone, "full");
});

test("registrationLabel, compactCount y plainText", () => {
  assert.equal(registrationLabel("internal"), "Inscripción abierta");
  assert.equal(registrationLabel("form"), "Inscripción abierta");
  assert.equal(registrationLabel("external"), "Inscripción externa");
  assert.equal(registrationLabel("none"), "Sin inscripción");
  assert.equal(compactCount(950), "950");
  assert.equal(compactCount(1200), "1,2 k");
  assert.equal(compactCount(2000), "2 k");
  assert.equal(compactCount(12400), "12 k");
  assert.equal(plainText("<p>Hola   <b>mundo</b></p>"), "Hola mundo");
});
