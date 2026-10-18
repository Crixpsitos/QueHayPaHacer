import { test } from "node:test"
import assert from "node:assert/strict"
import { HolidayService, parseHolidays } from "./HolidayService"
import type { ConfigDoc, IConfigRepository } from "@/domain/repository/config/IConfigRepository"

const fakeRepo = (initial: Record<string, unknown> = {}) => {
  const store = new Map<string, ConfigDoc<unknown>>(Object.entries(initial).map(([k, data]) => [k, { data, updatedAt: 1, updatedBy: "admin" }]))
  const repo: IConfigRepository = {
    get: async <T,>(k: string) => (store.get(k) as ConfigDoc<T> | undefined) ?? null,
    set: async (k, data, by) => { store.set(k, { data, updatedAt: 2, updatedBy: by }) },
    delete: async (k) => { store.delete(k) },
  }
  return { repo, store }
}

test("sin configuración usa el cálculo por regla", async () => {
  const svc = new HolidayService(fakeRepo().repo)
  const y = await svc.getYear(2026)
  assert.equal(y.source, "computed")
  assert.equal(y.holidays.length, 18)
})

test("la configuración del administrador manda sobre el cálculo", async () => {
  const { repo } = fakeRepo({ "holidays-2026": { holidays: [{ date: "2026-03-02", name: "Decreto especial" }] } })
  const svc = new HolidayService(repo)
  const { holidays, configured } = await svc.getMap([2026, 2027])
  assert.deepEqual(configured, [2026])
  assert.equal(holidays["2026-03-02"], "Decreto especial")
  assert.equal(holidays["2026-01-01"], undefined) // 2026 manda su lista, no mezcla con el cálculo
  assert.equal(holidays["2027-01-01"], "Año Nuevo") // 2027 sigue por regla
})

test("seedYear no pisa ediciones; resetYear vuelve al cálculo", async () => {
  const { repo, store } = fakeRepo()
  const svc = new HolidayService(repo)
  assert.equal(await svc.seedYear(2028, "script"), "created")
  assert.equal(await svc.seedYear(2028, "script"), "exists")
  await svc.saveYear(2028, [{ date: "2028-01-01", name: "Solo uno" }], "admin")
  assert.equal((await svc.getYear(2028)).holidays.length, 1)
  await svc.resetYear(2028)
  assert.equal(store.has("holidays-2028"), false)
  assert.equal((await svc.getYear(2028)).source, "computed")
})

test("parseHolidays valida fechas, año, nombre y tope", () => {
  assert.equal(parseHolidays(2026, [{ date: "2026-05-01", name: " Trabajo " }]).ok, true)
  assert.equal(parseHolidays(2026, [{ date: "2025-05-01", name: "X" }]).ok, false)
  assert.equal(parseHolidays(2026, [{ date: "2026-13-40", name: "X" }]).ok, false)
  assert.equal(parseHolidays(2026, [{ date: "2026-05-01", name: "" }]).ok, false)
  assert.equal(parseHolidays(2026, "x").ok, false)
  assert.equal(parseHolidays(2026, Array.from({ length: 41 }, () => ({ date: "2026-05-01", name: "X" }))).ok, false)
  const sorted = parseHolidays(2026, [{ date: "2026-12-25", name: "B" }, { date: "2026-01-01", name: "A" }])
  assert.ok(sorted.ok && sorted.holidays[0].date === "2026-01-01")
})
