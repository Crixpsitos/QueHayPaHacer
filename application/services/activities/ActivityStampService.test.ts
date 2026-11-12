import { test } from "node:test"
import assert from "node:assert/strict"
import { ActivityStampService } from "./ActivityStampService"
import type { IActivityStampRepository, Stamp } from "@/domain/repository/activities/IActivityStampRepository"

const NOW = new Date("2026-11-12T15:00:00Z")
function setup(over: { public?: boolean; manager?: boolean } = {}) {
  const tokens = new Map<string, string>(); const stamps = new Map<string, Stamp>()
  const repo: IActivityStampRepository = {
    async getToken(a) { return tokens.get(a) ?? null },
    async ensureToken(a, c) { if (!tokens.has(a)) tokens.set(a, c); return tokens.get(a)! },
    async collect(u, s) { const k = `${u}|${s.activityId}`; if (stamps.has(k)) return { created: false }; stamps.set(k, s); return { created: true } },
    async countOnDay(u, d) { return [...stamps].filter(([k, s]) => k.startsWith(`${u}|`) && s.day === d).length },
    async listMine(u) { return [...stamps].filter(([k]) => k.startsWith(`${u}|`)).map(([, s]) => s) },
  }
  const visited: string[] = []; const badges: string[] = []
  const svc = new ActivityStampService({
    repo, isPublic: async () => over.public !== false, canManage: async () => over.manager !== false,
    markVisited: async (u, a) => { visited.push(`${u}|${a}`) }, award: async (u, b) => { badges.push(`${u}|${b}`) },
    newToken: () => "tok-" + tokens.size, clock: () => NOW,
  })
  return { svc, tokens, stamps, visited, badges }
}

test("el dueño genera el código del QR (siempre el mismo); un tercero no", async () => {
  const s = setup()
  assert.equal(await s.svc.qrToken("owner", "a1"), await s.svc.qrToken("owner", "a1"))
  await assert.rejects(setup({ manager: false }).svc.qrToken("otro", "a1"), /gestiona/)
})
test("escanear con el código correcto da el sello, marca «Yo fui» y no se repite", async () => {
  const s = setup(); const t = await s.svc.qrToken("owner", "a1")
  const r = await s.svc.collect("u1", "a1", t)
  assert.equal(r.total, 1)
  assert.deepEqual(s.visited, ["u1|a1"])
  await assert.rejects(s.svc.collect("u1", "a1", t), /ya tienes/i)
})
test("código equivocado o actividad no pública: error genérico, sin sello", async () => {
  const s = setup(); await s.svc.qrToken("owner", "a1")
  await assert.rejects(s.svc.collect("u1", "a1", "falso"), /código/i)
  assert.equal(s.stamps.size, 0)
  const p = setup({ public: false }); await p.svc.qrToken("owner", "a1")
  await assert.rejects(p.svc.collect("u1", "a1", "tok-0"), /no existe/i)
})
test("al tercer sello distinto llega la insignia del pasaporte (una vez)", async () => {
  const s = setup()
  for (const a of ["a1", "a2", "a3"]) { const t = await s.svc.qrToken("owner", a); await s.svc.collect("u1", a, t) }
  assert.deepEqual(s.badges, ["u1|pasaporte-ibague"])
})
test("tope de 5 sellos por día", async () => {
  const s = setup()
  for (const a of ["a1", "a2", "a3", "a4", "a5"]) { const t = await s.svc.qrToken("owner", a); await s.svc.collect("u1", a, t) }
  const t6 = await s.svc.qrToken("owner", "a6")
  await assert.rejects(s.svc.collect("u1", "a6", t6), /máximo/i)
})
