import { test } from "node:test"
import assert from "node:assert/strict"
import type { Activity } from "@/domain/entities/activities/Activity"
import { makeActivity } from "@/domain/entities/activities/activity.fixture"
import { ActivityPlansService } from "./ActivityPlansService"

const NOW = new Date("2026-11-11T15:00:00Z") // miércoles 11
const acts: Record<string, Activity> = {
  a1: makeActivity({ id: "a1", slug: "senderismo", title: "Senderismo" }),
  a2: makeActivity({ id: "a2", slug: "lectura", title: "Lectura" }),
  a3: makeActivity({ id: "a3", slug: "ceramica", title: "Cerámica" }),
}

function setup(data: { saved?: string[]; visited?: string[]; joins?: { activityId: string; key: string; status: "pending" | "confirmed" | "noShow" }[] }) {
  const calls: string[] = []
  const svc = new ActivityPlansService({
    savedIds: async (uid, n) => { calls.push(`saved:${uid}:${n}`); return data.saved ?? [] },
    slots: async () => ({}),
    visitedIds: async (uid, n) => { calls.push(`visited:${uid}:${n}`); return data.visited ?? [] },
    joins: async (uid) => { calls.push(`joins:${uid}`); return data.joins ?? [] },
    getPublic: async (id) => acts[id] ?? null,
    clock: () => NOW,
  })
  return { svc, calls }
}

test("próximo: solo reservas con salida por venir y no 'No pagó', de la más cercana a la más lejana", async () => {
  const { svc } = setup({ joins: [
    { activityId: "a1", key: "2026-11-22", status: "confirmed" },
    { activityId: "a2", key: "2026-11-12", status: "pending" },
    { activityId: "a1", key: "2026-11-08", status: "confirmed" }, // ya pasó
    { activityId: "a3", key: "2026-11-15", status: "noShow" },
    { activityId: "a3", key: "open", status: "confirmed" },
  ] })
  const p = await svc.mine("u1")
  assert.deepEqual(p.upcoming.map((u) => [u.activity.id, u.key, u.status]), [["a2", "2026-11-12", "pending"], ["a1", "2026-11-22", "confirmed"], ["a3", "open", "confirmed"]])
})
test("guardado: públicas por actividad; las que ya no están se marcan para quitar", async () => {
  const { svc } = setup({ saved: ["a1", "borrada", "a2"] })
  const p = await svc.mine("u1")
  assert.deepEqual(p.saved.map((a) => a.id), ["a1", "a2"])
  assert.deepEqual(p.removedSaved, ["borrada"])
})
test("hecho: lo que marcó 'Yo fui' y sigue público", async () => {
  const { svc } = setup({ visited: ["a2", "borrada"] })
  assert.deepEqual((await svc.mine("u1")).done.map((a) => a.id), ["a2"])
})
test("solo lee datos de la cuenta que pide; sin sesión no lee nada", async () => {
  const { svc, calls } = setup({})
  await svc.mine("u1")
  assert.ok(calls.every((c) => c.includes("u1")))
  const empty = await svc.mine("")
  assert.deepEqual(empty, { upcoming: [], saved: [], removedSaved: [], done: [], slots: {} })
  assert.equal(calls.length, 3)
})
