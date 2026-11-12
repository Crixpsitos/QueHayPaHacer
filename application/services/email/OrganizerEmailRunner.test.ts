import { test } from "node:test"
import assert from "node:assert/strict"
import { OrganizerEmailRunner, type OrganizerActivity } from "./OrganizerEmailRunner"
import type { OutboxItem } from "@/domain/repository/email/IEmailOutboxRepository"

// Salida todos los días: siempre hay una pasado mañana.
const everyDay = { rules: [{ kind: "weekly", weekdays: [0, 1, 2, 3, 4, 5, 6], start: "10:00", end: "11:00" }], skipDates: [] } as never
const act: OrganizerActivity = { id: "a1", title: "Trote", slug: "trote", ownerUid: "o1", schedule: everyDay }

function setup(o: { count?: number; now?: string; joins?: Date[]; allows?: boolean } = {}) {
  const queued: OutboxItem[] = []
  const r = new OrganizerEmailRunner({
    activities: async () => [act], counts: async (_id, keys) => Object.fromEntries(keys.map((k) => [k, o.count ?? 0])),
    joinDates: async () => o.joins ?? [], allows: async () => o.allows ?? true, getEmail: async () => "o@x.co",
    enqueue: async (i) => { queued.push(i); return true }, siteUrl: "https://x.co", secret: "s", clock: () => new Date(o.now ?? "2026-11-11T15:00:00Z"), render: async () => "<p/>",
  })
  return { r, queued }
}

test("salida de pasado mañana sin inscritos → correo al organizador (id por actividad y fecha)", async () => {
  const s = setup(); const out = await s.r.run()
  assert.equal(out.empty, 1); assert.equal(s.queued[0].id, "og_empty_a1_2026-11-13"); assert.equal(s.queued[0].to, "o@x.co")
})
test("con inscritos no hay empujón; sin permiso no se envía nada", async () => {
  assert.equal((await setup({ count: 2 }).r.run()).empty, 0)
  assert.equal((await setup({ allows: false }).r.run()).empty, 0)
})
test("lunes: resumen con las inscripciones de 7 días; otro día no", async () => {
  const mon = setup({ now: "2026-11-09T15:00:00Z", count: 1, joins: [new Date("2026-11-08T12:00:00Z"), new Date("2026-10-01T12:00:00Z")] })
  assert.equal((await mon.r.run()).weekly, 1)
  assert.ok(mon.queued.find((q) => q.id.startsWith("og_week_o1_"))?.subject.includes("1 persona"))
  assert.equal((await setup({ now: "2026-11-11T15:00:00Z", joins: [new Date("2026-11-10T12:00:00Z")] }).r.run()).weekly, 0)
})
