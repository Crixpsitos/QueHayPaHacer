import { test } from "node:test"
import assert from "node:assert/strict"
import { withDefaultEnd } from "./withDefaultEnd"
import { formatTimeRange } from "@/presentation/events/components/detail/format"

test("un evento de una fecha sin fin termina al final del día de inicio", () => {
  const out = withDefaultEnd({ startDate: "2026-11-29T02:00:00.000Z", endDate: "" })
  assert.equal(out.endDate, "2026-11-29T04:59:59.999Z")
})

test("respeta el fin elegido y no toca los multi-fecha", () => {
  assert.equal(withDefaultEnd({ startDate: "2026-11-29T02:00:00.000Z", endDate: "2026-11-29T05:00:00.000Z" }).endDate, "2026-11-29T05:00:00.000Z")
  assert.equal(withDefaultEnd<{ eventType: string; startDate?: string; endDate?: string }>({ eventType: "multi-date" }).endDate, undefined)
})

test("sin hora de fin solo se muestra la hora de inicio", () => {
  assert.equal(formatTimeRange("2026-11-29T02:00:00.000Z", "2026-11-29T04:59:59.999Z"), "21:00")
  assert.match(formatTimeRange("2026-11-29T02:00:00.000Z", "2026-11-29T05:00:00.000Z"), /–/)
})
