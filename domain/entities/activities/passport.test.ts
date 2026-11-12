import { test } from "node:test"
import assert from "node:assert/strict"
import { canStamp, passportBadgesFor, MAX_STAMPS_PER_DAY, STAMPS_FOR_BADGE, PASSPORT_BADGE_ID } from "./passport"

test("sellar: una sola vez por actividad", () => {
  assert.equal(canStamp({ alreadyStamped: false, stampsToday: 0 }), null)
  assert.match(canStamp({ alreadyStamped: true, stampsToday: 0 }) ?? "", /ya tienes/i)
})
test("sellar: tope diario contra abuso", () => {
  assert.equal(canStamp({ alreadyStamped: false, stampsToday: MAX_STAMPS_PER_DAY - 1 }), null)
  assert.match(canStamp({ alreadyStamped: false, stampsToday: MAX_STAMPS_PER_DAY }) ?? "", /hoy/i)
})
test("insignia del pasaporte desde 3 sellos distintos", () => {
  assert.deepEqual(passportBadgesFor(STAMPS_FOR_BADGE - 1), [])
  assert.deepEqual(passportBadgesFor(STAMPS_FOR_BADGE), [PASSPORT_BADGE_ID])
})
