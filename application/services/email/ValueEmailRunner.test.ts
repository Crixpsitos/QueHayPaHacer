import { test } from "node:test"
import assert from "node:assert/strict"
import { ValueEmailRunner } from "./ValueEmailRunner"
import type { OutboxItem } from "@/domain/repository/email/IEmailOutboxRepository"
import type { Digest } from "@/domain/entities/activities/weeklyDigest"

const THU = new Date("2026-11-12T13:00:00Z") // jueves 8 a. m. Bogotá
const FRI = new Date("2026-11-13T13:00:00Z")
const digest: Digest = { title: "Qué hacer este fin de semana en Ibagué", days: [{ date: "2026-11-14", label: "sábado 14", items: [{ kind: "activity", title: "Mercado campesino", timeLabel: "7:00 a. m.", place: "Plaza", detail: "Gratis", url: "/actividades/mercado", sortMin: 420 }] }] }

function setup(o: { now?: Date; kinds?: Record<string, string[]>; email?: string | null; allow?: boolean; pool?: boolean } = {}) {
  const q: OutboxItem[] = []
  const runner = new ValueEmailRunner({
    optIns: async (k) => o.kinds?.[k] ?? [], allows: async () => o.allow !== false, getEmail: async () => (o.email === undefined ? "ana@x.co" : o.email),
    signals: async () => ({ categories: ["aire-libre"], excludeIds: [] }),
    pool: async () => (o.pool === false ? [] : [{ id: "a", title: "Trote", path: "/actividades/trote", category: "aire-libre", when: "Hoy · 5:30 p. m." }]),
    enqueue: async (i) => { if (q.some((x) => x.id === i.id)) return false; q.push(i); return true },
    siteUrl: "https://x.co", secret: "s3", clock: () => o.now ?? THU,
  })
  return { runner, q }
}

test("«Para ti»: uno por persona y día (el segundo barrido del día no duplica)", async () => {
  const s = setup({ kinds: { forYou: ["u1", "u2"] } })
  await s.runner.run(async () => digest); await s.runner.run(async () => digest)
  assert.equal(s.q.filter((i) => i.kind === "forYou").length, 2)
  assert.ok(s.q[0].text.includes("Trote") && s.q[0].headers!["List-Unsubscribe"])
})
test("«Para ti» sin nada vigente no se envía (no se manda un correo vacío)", async () => {
  const s = setup({ kinds: { forYou: ["u1"] }, pool: false })
  await s.runner.run(async () => digest)
  assert.equal(s.q.length, 0)
})
test("resumen semanal: solo los jueves, uno por semana", async () => {
  const thu = setup({ now: THU, kinds: { weekly: ["u1"] } }); await thu.runner.run(async () => digest); await thu.runner.run(async () => digest)
  assert.equal(thu.q.filter((i) => i.kind === "weekly").length, 1)
  assert.ok(thu.q[0].text.includes("Mercado campesino"))
  const fri = setup({ now: FRI, kinds: { weekly: ["u1"] } }); await fri.runner.run(async () => digest)
  assert.equal(fri.q.length, 0)
})
test("sin permiso, sin correo o sin secreto de baja: nada", async () => {
  for (const o of [{ allow: false }, { email: null }]) { const s = setup({ kinds: { forYou: ["u1"], weekly: ["u1"] }, ...o }); await s.runner.run(async () => digest); assert.equal(s.q.length, 0) }
})
