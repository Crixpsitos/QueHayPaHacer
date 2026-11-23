import assert from "node:assert/strict"
import { test } from "node:test"
import { TrustService } from "./TrustService"
import type { ITrustRepository } from "@/domain/repository/trust/ITrustRepository"

const repo = (over: Partial<Awaited<ReturnType<ITrustRepository["signals"]>>> = {}, seen: Date[] = []): ITrustRepository => ({
  signals: async (_uid, since) => { seen.push(since); return { creatorVerified: false, approvedCount: 0, rejectedRecent: 0, suspended: false, ...over } },
})

test("evalúa con las señales del repositorio", async () => {
  assert.equal((await new TrustService(repo({ approvedCount: 3 })).evaluate("u")).reason, "earned")
})

test("la ventana de rechazos son 90 días hacia atrás", async () => {
  const seen: Date[] = []
  const now = new Date("2026-11-23T12:00:00Z")
  await new TrustService(repo({}, seen), () => now).evaluate("u")
  assert.equal(seen[0].toISOString(), "2026-08-25T12:00:00.000Z")
})

test("si falla la lectura, no hay confianza (camino seguro)", async () => {
  const broken: ITrustRepository = { signals: async () => { throw new Error("boom") } }
  const silent = console.error; console.error = () => undefined
  try { assert.deepEqual(await new TrustService(broken).evaluate("u"), { trusted: false, restricted: false, reason: "none" }) } finally { console.error = silent }
})
