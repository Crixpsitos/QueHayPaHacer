import { test } from "node:test"
import assert from "node:assert/strict"
import { EventGuestService } from "./EventGuestService"
import type { GuestEntry, IEventGuestRepository } from "@/domain/repository/EventRegistration/IEventGuestRepository"

function setup(existing = 0) {
  const db: GuestEntry[] = []
  const repo: IEventGuestRepository = { count: async () => existing + db.length, add: async (_e, g) => { db.push(g) }, findByCode: async (_e, c) => { const g = db.find((x) => x.code === c); return g ? { name: g.name } : null } }
  let n = 0
  return { svc: new EventGuestService({ repo, randomBytes: (len) => Uint8Array.from({ length: len }, (_, i) => (i * 7 + n++ * 13) & 255) }), db }
}

test("agrega un invitado con código y se encuentra por ese código", async () => {
  const { svc, db } = setup()
  const r = await svc.add("e1", "owner", { name: "Ana Ruiz", phone: "3001234567" })
  assert.ok(r.ok && /^[0-9A-Z]{12}$/.test(r.code))
  assert.ok(db[0].id.startsWith("guest_") && db[0].addedBy === "owner")
  assert.deepEqual(await svc.ticket("e1", r.ok ? r.code.toLowerCase() : ""), { name: "Ana Ruiz", code: r.ok ? r.code : "" })
  assert.equal(await svc.ticket("e1", "AAAAAAAAAAAA"), null)
  assert.equal(await svc.ticket("e1", "basura"), null)
})
test("rechaza datos inválidos y el tope por evento", async () => {
  assert.equal((await setup().svc.add("e1", "o", { name: "A" })).ok, false)
  const r = await setup(300).svc.add("e1", "o", { name: "Ana" })
  assert.ok(!r.ok && /máximo/.test(r.error))
})
