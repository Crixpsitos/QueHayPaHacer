import assert from "node:assert/strict"
import { test } from "node:test"
import { TRUST_APPROVED_MIN, computeTrust, type TrustSignals } from "./trust"

const base: TrustSignals = { creatorVerified: false, approvedCount: 0, rejectedRecent: 0, suspended: false }

test("cuenta nueva: sin confianza", () => {
  assert.deepEqual(computeTrust(base), { trusted: false, restricted: false, reason: "none" })
})

test("se la gana con publicaciones aprobadas y ningún rechazo reciente", () => {
  assert.equal(computeTrust({ ...base, approvedCount: TRUST_APPROVED_MIN - 1 }).trusted, false)
  assert.deepEqual(computeTrust({ ...base, approvedCount: TRUST_APPROVED_MIN }), { trusted: true, restricted: false, reason: "earned" })
})

test("un rechazo reciente la frena", () => {
  assert.equal(computeTrust({ ...base, approvedCount: 10, rejectedRecent: 1 }).trusted, false)
})

test("creador verificado confía (como ya ocurría en eventos)", () => {
  assert.equal(computeTrust({ ...base, creatorVerified: true }).reason, "verified")
})

test("confianza manual gana sobre las señales automáticas", () => {
  assert.deepEqual(computeTrust({ ...base, override: "trusted", rejectedRecent: 5 }), { trusted: true, restricted: false, reason: "manual" })
})

test("restricción manual gana sobre todo, incluso creador verificado y confianza ganada", () => {
  const r = computeTrust({ ...base, override: "restricted", creatorVerified: true, approvedCount: 50 })
  assert.deepEqual(r, { trusted: false, restricted: true, reason: "restricted" })
})

test("suspensión vigente restringe aunque haya confianza manual", () => {
  assert.deepEqual(computeTrust({ ...base, override: "trusted", suspended: true }), { trusted: false, restricted: true, reason: "suspended" })
})
