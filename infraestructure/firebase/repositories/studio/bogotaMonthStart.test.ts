import { test } from "node:test"
import assert from "node:assert/strict"
import { bogotaMonthStart } from "./StudioFirebaseRepository"

test("bogotaMonthStart usa el mes de Ibagué (UTC-5), no el del servidor", () => {
  // 1 nov 03:00Z = 31 oct 22:00 en Bogotá → el mes actual sigue siendo octubre.
  const now = new Date("2026-11-01T03:00:00Z")
  assert.equal(bogotaMonthStart(now, 0).toISOString(), "2026-10-01T05:00:00.000Z")
  assert.equal(bogotaMonthStart(now, 1).toISOString(), "2026-11-01T05:00:00.000Z")
  assert.equal(bogotaMonthStart(now, -1).toISOString(), "2026-09-01T05:00:00.000Z")
  // Cruce de año.
  assert.equal(bogotaMonthStart(new Date("2026-01-01T04:59:00Z"), 0).toISOString(), "2025-12-01T05:00:00.000Z")
})
