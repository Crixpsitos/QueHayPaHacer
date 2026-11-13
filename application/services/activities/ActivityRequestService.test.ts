import { test } from "node:test"
import assert from "node:assert/strict"
import { ActivityRequestService } from "./ActivityRequestService"
import { makeActivity } from "@/domain/entities/activities/activity.fixture"
import type { ActivityRequestRow } from "@/domain/repository/activities/IActivityRequestRepository"
import type { Activity } from "@/domain/entities/activities/Activity"

let clock = new Date("2026-11-13T15:00:00Z").getTime() // viernes 10 a. m. en Bogotá
function setup(a: Partial<Activity> = {}) {
  const rows = new Map<string, ActivityRequestRow>()
  const notes: { uid: string; id?: string; title: string }[] = []
  const act = makeActivity({ id: "a1", ownerUid: "owner", cta: { kind: "whatsapp", value: "https://wa.me/573001112233" }, schedule: { rules: [{ kind: "weekly", weekdays: [6], start: "16:00" }], skipDates: [], requiresReservation: false }, ...a })
  const svc = new ActivityRequestService({
    repo: {
      put: async (_id, row, ttl, now) => { const k = `${row.key}_${row.uid}`; const p = rows.get(k); if (p && now - p.createdAt <= ttl) return false; rows.set(k, row); return true },
      list: async () => [...rows.values()].sort((x, y) => y.createdAt - x.createdAt),
    },
    getPublic: async (id) => (id === "a1" ? act : null),
    getForManager: async (id, v) => (id === "a1" && (v.uid === "owner" || v.isAdmin) ? act : null),
    displayName: async (uid) => (uid === "u1" ? "Ana Pérez" : ""),
    notify: async (uid, n, id) => void notes.push({ uid, id, title: n.title }),
    clock: () => new Date(clock),
  })
  return { svc, rows, notes }
}

test("opciones: las próximas salidas con su día escrito", async () => {
  const { svc } = setup()
  const o = await svc.options("a1")
  assert.deepEqual(o.map((x) => x.key), ["2026-11-14", "2026-11-21", "2026-11-28", "2026-12-05"])
  assert.match(o[0].label, /sábado,? 14 de noviembre/)
  assert.deepEqual(await svc.options("nope"), [])
})
test("pedir: guarda quién y para qué salida, y avisa a quien organiza una sola vez", async () => {
  const { svc, rows, notes } = setup()
  const r = await svc.request("u1", "a1", "2026-11-21")
  assert.deepEqual(r, { ok: true, key: "2026-11-21", created: true })
  assert.equal(rows.get("2026-11-21_u1")?.name, "Ana Pérez")
  assert.equal(notes.length, 1)
  assert.equal(notes[0].uid, "owner")
  assert.match(notes[0].title, /Ana Pérez quiere reservar/)
  const again = await svc.request("u1", "a1", "2026-11-21")
  assert.deepEqual(again, { ok: true, key: "2026-11-21", created: false })
  assert.equal(notes.length, 1, "tocar de nuevo no vuelve a avisar")
})
test("a las 24 h puede volver a pedir y se avisa otra vez", async () => {
  const { svc, notes } = setup()
  await svc.request("u1", "a1", "2026-11-21")
  clock += 25 * 3_600_000
  const r = await svc.request("u1", "a1", "2026-11-21")
  assert.equal(r.ok && r.created, true)
  assert.equal(notes.length, 2)
  clock -= 25 * 3_600_000
})
test("rechaza: sin sesión, propia actividad, botón que no es de reserva, salida inventada", async () => {
  assert.equal((await setup().svc.request("", "a1", null)).ok, false)
  assert.equal((await setup().svc.request("owner", "a1", null)).ok, false)
  assert.equal((await setup({ cta: { kind: "instagram", value: "https://instagram.com/x" } }).svc.request("u1", "a1", null)).ok, false)
  assert.equal((await setup({ cta: null }).svc.request("u1", "a1", null)).ok, false)
  assert.equal((await setup().svc.request("u1", "a1", "2026-11-15")).ok, false) // domingo: no sale
  assert.equal((await setup().svc.request("u1", "nope", null)).ok, false)
})
test("sin fecha fija: una sola salida «open» y no hace falta elegir", async () => {
  const { svc } = setup({ schedule: { rules: [{ kind: "always" }], skipDates: [], requiresReservation: false } })
  assert.deepEqual(await svc.request("u1", "a1", null), { ok: true, key: "open", created: true })
})
test("para quien organiza: lista con estado vigente/vencida; una persona ajena no ve nada", async () => {
  const { svc } = setup()
  await svc.request("u1", "a1", "2026-11-21")
  clock += 30 * 3_600_000
  const mine = await svc.listForOwner({ uid: "owner", isAdmin: false }, "a1")
  assert.deepEqual(mine?.map((r) => [r.who, r.state]), [["Ana Pérez", "expired"]])
  assert.equal(await svc.listForOwner({ uid: "otra", isAdmin: false }, "a1"), null)
  clock -= 30 * 3_600_000
})
