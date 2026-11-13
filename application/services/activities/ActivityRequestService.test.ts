import { test } from "node:test"
import assert from "node:assert/strict"
import { ActivityRequestService } from "./ActivityRequestService"
import { makeActivity } from "@/domain/entities/activities/activity.fixture"
import type { ActivityRequestRow } from "@/domain/repository/activities/IActivityRequestRepository"
import type { IActivityJoinRepository, JoinRow } from "@/domain/repository/activities/IActivityJoinRepository"
import { holdsSpot } from "@/domain/entities/activities/activityJoin"
import type { Activity } from "@/domain/entities/activities/Activity"

let clock = new Date("2026-11-13T15:00:00Z").getTime() // viernes 10 a. m. en Bogotá
function setup(a: Partial<Activity> = {}) {
  const rows = new Map<string, ActivityRequestRow>()
  const joins = new Map<string, JoinRow>()
  const notes: { uid: string; id?: string; title: string }[] = []
  const act = makeActivity({ id: "a1", ownerUid: "owner", cta: { kind: "whatsapp", value: "https://wa.me/573001112233" }, schedule: { rules: [{ kind: "weekly", weekdays: [6], start: "16:00" }], skipDates: [], requiresReservation: false }, ...a })
  const svc = new ActivityRequestService({
    repo: {
      put: async (_id, row, ttl, now) => { const k = `${row.key}_${row.uid}`; const p = rows.get(k); if (p && now - p.createdAt <= ttl) return false; rows.set(k, row); return true },
      list: async () => [...rows.values()].sort((x, y) => y.createdAt - x.createdAt),
      get: async (_id, key, uid) => rows.get(`${key}_${uid}`) ?? null,
      remove: async (_id, key, uid) => void rows.delete(`${key}_${uid}`),
    },
    join: {
      join: async (i: Parameters<IActivityJoinRepository["join"]>[0], decide: Parameters<IActivityJoinRepository["join"]>[1]) => { const k = `${i.key}_${i.uid}`; if (joins.has(k)) return "already"; const taken = [...joins.values()].filter((r) => r.key === i.key && holdsSpot(r.status)).length; const d = decide(taken); if (!d.ok) return d.reason; joins.set(k, { uid: i.uid, name: i.name, key: i.key, createdAt: new Date(clock), status: i.status, phone: i.phone, extras: i.extras ?? [], manual: i.manual === true }); return "joined" },
    } as unknown as IActivityJoinRepository,
    getPublic: async (id) => (id === "a1" ? act : null),
    getForManager: async (id, v) => (id === "a1" && (v.uid === "owner" || v.isAdmin) ? act : null),
    displayName: async (uid) => (uid === "u1" ? "Ana Pérez" : ""),
    notify: async (uid, n, id) => void notes.push({ uid, id, title: n.title }),
    clock: () => new Date(clock),
  })
  return { svc, rows, notes, joins }
}

test("opciones: las próximas salidas con su día escrito", async () => {
  const { svc } = setup()
  const o = await svc.options("a1")
  assert.deepEqual(o.departures.map((x) => x.key), ["2026-11-14", "2026-11-21", "2026-11-28", "2026-12-05"])
  assert.match(o.departures[0].label, /sábado,? 14 de noviembre/)
  assert.deepEqual(await svc.options("nope"), { departures: [], extras: [] })
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

const withExtras = { extras: [{ label: "Almuerzo", amountCop: 18000, unit: "persona" as const }] }

test("la solicitud guarda los servicios que la persona pidió (solo los ofrecidos)", async () => {
  const { svc, rows } = setup(withExtras)
  await svc.request("u1", "a1", "2026-11-21", [{ label: "Almuerzo", qty: 2 }, { label: "Otro", qty: 1 }])
  assert.deepEqual(rows.get("2026-11-21_u1")?.extras, [{ label: "Almuerzo", qty: 2 }])
})
test("pasar de interesado a reservado: ocupa cupo en esa salida, conserva los servicios, avisa a la persona y sale de solicitudes", async () => {
  const { svc, rows, joins, notes } = setup({ ...withExtras, join: { capacity: 5, closed: false }, priceOptions: [{ label: "Completa", amountCop: 40000, unit: "persona", includes: [] }] })
  await svc.request("u1", "a1", "2026-11-21", [{ label: "Almuerzo", qty: 1 }])
  const r = await svc.promote({ uid: "owner", isAdmin: false }, "a1", "2026-11-21", "u1")
  assert.deepEqual(r, { ok: true })
  const j = joins.get("2026-11-21_u1")!
  assert.deepEqual([j.status, j.name, j.extras], ["pending", "Ana Pérez", [{ label: "Almuerzo", qty: 1 }]])
  assert.equal(rows.size, 0, "la solicitud ya no aparece")
  assert.ok(notes.some((x) => x.uid === "u1" && /Cupo reservado/.test(x.title)))
})
test("pasar a reservado: solo el dueño, solicitud existente y con cupo", async () => {
  const { svc, joins } = setup({ join: { capacity: 1, closed: false } })
  await svc.request("u1", "a1", "2026-11-21")
  assert.equal((await svc.promote({ uid: "otra", isAdmin: false }, "a1", "2026-11-21", "u1")).ok, false)
  assert.equal((await svc.promote({ uid: "owner", isAdmin: false }, "a1", "2026-11-21", "nadie")).ok, false)
  joins.set("2026-11-21_x", { uid: "x", name: "X", key: "2026-11-21", createdAt: new Date(clock), status: "confirmed", phone: null, extras: [], manual: false })
  assert.deepEqual(await svc.promote({ uid: "owner", isAdmin: false }, "a1", "2026-11-21", "u1"), { ok: false, error: "Se acabaron los cupos de esta salida." })
})
