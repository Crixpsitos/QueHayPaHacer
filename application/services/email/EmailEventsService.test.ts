import { test } from "node:test"
import assert from "node:assert/strict"
import { EmailEventsService } from "./EmailEventsService"

function setup(known = true) {
  const unsub: string[] = []; const seen = new Set<string>(); const logs: string[] = []
  const svc = new EmailEventsService({ uidByEmailId: async () => (known ? "u1" : null), unsubscribe: async (u) => { unsub.push(u) }, record: async (id) => { if (seen.has(id)) return false; seen.add(id); return true }, clock: () => new Date(), log: (m) => logs.push(m) })
  return { svc, unsub, logs }
}

test("una queja de spam apaga el correo de esa persona", async () => {
  const s = setup()
  assert.equal(await s.svc.handle({ type: "email.complained", emailId: "e1" }), "unsubscribed")
  assert.deepEqual(s.unsub, ["u1"]); assert.ok(s.logs.some((l) => l.includes("qhpa_email_complaint")))
})
test("rebote definitivo apaga; rebote temporal y otros eventos se ignoran", async () => {
  const a = setup(); assert.equal(await a.svc.handle({ type: "email.bounced", emailId: "e1", bounceType: "Permanent" }), "unsubscribed")
  const b = setup(); assert.equal(await b.svc.handle({ type: "email.bounced", emailId: "e1", bounceType: "Transient" }), "ignored")
  for (const type of ["email.delivered", "email.opened", "email.clicked", "email.sent"]) assert.equal(await setup().svc.handle({ type, emailId: "e1" }), "ignored", type)
  assert.deepEqual(b.unsub, [])
})
test("idempotente: Resend repite el aviso y no se procesa dos veces; correo desconocido se ignora", async () => {
  const s = setup()
  await s.svc.handle({ type: "email.complained", emailId: "e1" }); await s.svc.handle({ type: "email.complained", emailId: "e1" })
  assert.equal(s.unsub.length, 1)
  assert.equal(await setup(false).svc.handle({ type: "email.complained", emailId: "zz" }), "ignored")
})
